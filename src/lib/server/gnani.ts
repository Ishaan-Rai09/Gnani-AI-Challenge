/**
 * Server-only Gnani Speech API client.
 *
 * Docs: https://docs.gnani.ai
 * - TTS REST: POST {base}/api/v1/tts/inference  (binary audio response)
 * - STT REST: POST {base}/stt/v3                (multipart/form-data)
 * - Auth:     X-API-Key-ID header on every request
 *
 * The API key is read from the server environment on each call. It must never
 * be imported into a client component or prefixed with NEXT_PUBLIC_.
 */

const DEFAULT_BASE_URL = "https://api.vachana.ai";
export const DEFAULT_TTS_MODEL = "timbre-v2.5";
export const DEFAULT_STT_MODEL = "prisma-v2.5";

export class GnaniError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 502, code = "GNANI_ERROR") {
    super(message);
    this.name = "GnaniError";
    this.status = status;
    this.code = code;
  }
}

export function gnaniConfig() {
  const apiKey = process.env.GNANI_API_KEY?.trim() || null;
  const baseUrl = (process.env.GNANI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return {
    apiKey,
    baseUrl,
    ttsModel: process.env.GNANI_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL,
    sttModel: process.env.GNANI_STT_MODEL?.trim() || DEFAULT_STT_MODEL,
    configured: Boolean(apiKey),
  };
}

function requireKey(): { apiKey: string; baseUrl: string } {
  const config = gnaniConfig();
  if (!config.apiKey) {
    throw new GnaniError(
      "Gnani is not configured. Add GNANI_API_KEY to .env.local and restart the server.",
      503,
      "NOT_CONFIGURED"
    );
  }
  return { apiKey: config.apiKey, baseUrl: config.baseUrl };
}

async function failure(response: Response): Promise<GnaniError> {
  let message = `Gnani returned ${response.status}.`;
  try {
    const body = (await response.json()) as {
      message?: string;
      detail?: { message?: string; error_code?: string } | string;
      error?: { message?: string; type?: string };
    };
    message =
      body.message ||
      body.error?.message ||
      (typeof body.detail === "string" ? body.detail : body.detail?.message) ||
      message;
    if (response.status === 401) message = "Gnani rejected the API key (401). Check GNANI_API_KEY.";
    if (response.status === 429) message = "Gnani rate limit reached. Wait a moment and try again.";
  } catch {
    // Non-JSON error body — keep the status message.
  }
  const code =
    response.status === 401
      ? "UNAUTHORIZED"
      : response.status === 429
        ? "RATE_LIMITED"
        : "GNANI_HTTP_ERROR";
  return new GnaniError(message, response.status, code);
}

export interface SynthesisInput {
  text: string;
  voice: string;
  language?: string;
  speed?: number;
}

const ttsCache = new Map<string, { audio: ArrayBuffer; contentType: string }>();
const TTS_CACHE_LIMIT = 24;

/** Synthesise speech and return raw audio bytes. Cached in-process per line. */
export async function synthesizeSpeech(input: SynthesisInput): Promise<{
  audio: ArrayBuffer;
  contentType: string;
  cached: boolean;
}> {
  const { apiKey, baseUrl } = requireKey();
  const config = gnaniConfig();
  const language = input.language || "auto";
  const speed = Math.min(1.15, Math.max(0.85, input.speed ?? 1));
  const cacheKey = [config.ttsModel, input.voice, language, speed, input.text].join("|");

  const hit = ttsCache.get(cacheKey);
  if (hit) return { ...hit, cached: true };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/tts/inference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key-ID": apiKey,
      },
      body: JSON.stringify({
        text: input.text,
        voice: input.voice,
        model: config.ttsModel,
        language,
        speed,
        audio_config: {
          sample_rate: 24000,
          num_channels: 1,
          sample_width: 2,
          container: "mp3",
          bitrate: "64k",
        },
      }),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
  } catch (error) {
    throw new GnaniError(
      error instanceof Error && error.name === "TimeoutError"
        ? "Gnani text-to-speech timed out."
        : "Could not reach Gnani text-to-speech.",
      504,
      "UPSTREAM_UNREACHABLE"
    );
  }

  if (!response.ok) throw await failure(response);

  const audio = await response.arrayBuffer();
  if (audio.byteLength === 0) {
    throw new GnaniError("Gnani returned empty audio.", 502, "EMPTY_AUDIO");
  }
  const contentType = response.headers.get("content-type") || "audio/mpeg";
  if (ttsCache.size >= TTS_CACHE_LIMIT) {
    const oldest = ttsCache.keys().next().value;
    if (oldest) ttsCache.delete(oldest);
  }
  ttsCache.set(cacheKey, { audio, contentType });
  return { audio, contentType, cached: false };
}

export interface TranscriptionResult {
  transcript: string;
  detectedLanguage: string | null;
  model: string;
  latencyMs: number | null;
}

/** Transcribe a short clip (≤ 30 s) with Gnani Prisma. */
export async function transcribeSpeech(
  file: File,
  languageCode: string
): Promise<TranscriptionResult> {
  const { apiKey, baseUrl } = requireKey();
  const config = gnaniConfig();

  const form = new FormData();
  form.append("audio_file", file, file.name || "clip.wav");
  form.append("language_code", languageCode);
  form.append("model", config.sttModel);
  form.append("format", "transcribe");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/stt/v3`, {
      method: "POST",
      headers: {
        "X-API-Key-ID": apiKey,
        "X-API-Request-ID": crypto.randomUUID(),
      },
      body: form,
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (error) {
    throw new GnaniError(
      error instanceof Error && error.name === "TimeoutError"
        ? "Gnani speech-to-text timed out."
        : "Could not reach Gnani speech-to-text.",
      504,
      "UPSTREAM_UNREACHABLE"
    );
  }

  if (!response.ok) throw await failure(response);

  const body = (await response.json()) as {
    success?: boolean;
    transcript?: string;
    model?: string;
    detected_language_code?: string;
    end_to_end_latency?: number;
  };
  if (body.success === false) {
    throw new GnaniError("Gnani could not transcribe that clip.", 502, "TRANSCRIPTION_FAILED");
  }

  return {
    transcript: (body.transcript ?? "").trim(),
    detectedLanguage: body.detected_language_code ?? null,
    model: body.model ?? config.sttModel,
    latencyMs: typeof body.end_to_end_latency === "number" ? Math.round(body.end_to_end_latency * 1000) : null,
  };
}
