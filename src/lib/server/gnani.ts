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
  const cloneAudio = process.env.GNANI_CLONE_AUDIO?.trim() || null;
  return {
    apiKey,
    baseUrl,
    ttsModel: process.env.GNANI_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL,
    sttModel: process.env.GNANI_STT_MODEL?.trim() || DEFAULT_STT_MODEL,
    cloneAudio,
    configured: Boolean(apiKey),
    cloneConfigured: Boolean(apiKey && cloneAudio),
  };
}

/** The assistant voice id that triggers voice-cloned synthesis. */
export const CLONED_VOICE_ID = "clone";
/** Gnani's voice-cloning model — used instead of Timbre when a clone is requested. */
const VC_MODEL = "vachana-vc-v1";

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

/**
 * Voice cloning, step 1: read the reference audio configured via
 * GNANI_CLONE_AUDIO (a file path, or a base64 data URI) and exchange it for a
 * speaker embedding. The embedding is generated once and cached in-process —
 * Gnani's docs recommend reusing it across every synthesis call.
 */
interface SpeakerEmbedding {
  embedding: string;
  shape: number[];
  dtype: string;
}

let embeddingCache: { embedding: SpeakerEmbedding; source: string } | null = null;

async function loadSpeakerEmbedding(): Promise<SpeakerEmbedding> {
  const { apiKey, baseUrl, cloneAudio } = gnaniConfig();
  if (!apiKey || !cloneAudio) {
    throw new GnaniError(
      "Voice cloning is not configured. Set GNANI_CLONE_AUDIO to a 5-30 second recording of the reference voice.",
      503,
      "CLONE_NOT_CONFIGURED"
    );
  }

  if (embeddingCache && embeddingCache.source === cloneAudio) return embeddingCache.embedding;

  let bytes: Uint8Array;
  let filename = "reference.wav";
  if (cloneAudio.startsWith("data:")) {
    const comma = cloneAudio.indexOf(",");
    const meta = cloneAudio.slice(0, comma);
    filename = meta.match(/name=([^;]+)/)?.[1] ?? "reference.wav";
    bytes = new Uint8Array(Buffer.from(cloneAudio.slice(comma + 1), "base64"));
  } else {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const resolved = path.isAbsolute(cloneAudio) ? cloneAudio : path.join(process.cwd(), cloneAudio);
    filename = path.basename(resolved);
    bytes = new Uint8Array(await readFile(resolved));
  }

  if (bytes.byteLength === 0) {
    throw new GnaniError("The voice-clone reference audio is empty.", 502, "EMPTY_CLONE_AUDIO");
  }

  const form = new FormData();
  form.append(
    "audio_file",
    new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer]),
    filename
  );

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/tts/voice-clone/embeddings`, {
      method: "POST",
      headers: { "X-API-Key-ID": apiKey },
      body: form,
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (error) {
    throw new GnaniError(
      error instanceof Error && error.name === "TimeoutError"
        ? "Gnani voice-clone embedding request timed out."
        : "Could not reach the Gnani voice-clone service.",
      504,
      "UPSTREAM_UNREACHABLE"
    );
  }
  if (!response.ok) throw await failure(response);

  const body = (await response.json()) as {
    data?: { voice_clone_embedding?: { embedding?: string; shape?: number[]; dtype?: string } };
  };
  const raw = body.data?.voice_clone_embedding;
  if (!raw?.embedding) {
    throw new GnaniError("Gnani did not return a voice-clone embedding.", 502, "CLONE_FAILED");
  }
  const embedding: SpeakerEmbedding = {
    embedding: raw.embedding,
    shape: raw.shape ?? [1, 768],
    dtype: raw.dtype ?? "torch.bfloat16",
  };
  embeddingCache = { embedding, source: cloneAudio };
  return embedding;
}

/** Synthesise speech and return raw audio bytes. Cached in-process per line. */
export async function synthesizeSpeech(input: SynthesisInput): Promise<{
  audio: ArrayBuffer;
  contentType: string;
  cached: boolean;
}> {
  const { apiKey, baseUrl } = requireKey();
  const config = gnaniConfig();
  const cloned = input.voice === CLONED_VOICE_ID;
  if (cloned && !config.cloneAudio) {
    throw new GnaniError(
      "The cloned voice is not configured on the server. Set GNANI_CLONE_AUDIO to enable it.",
      503,
      "CLONE_NOT_CONFIGURED"
    );
  }
  const language = input.language || "auto";
  const speed = Math.min(1.15, Math.max(0.85, input.speed ?? 1));
  const cacheKey = [cloned ? "clone" : config.ttsModel, input.voice, language, speed, input.text].join("|");

  const hit = ttsCache.get(cacheKey);
  if (hit) return { ...hit, cached: true };

  // Voice-cloned synthesis runs on the VC model: no voice name or language —
  // the timbre comes entirely from the cached speaker embedding.
  const payload = cloned
    ? {
        text: input.text,
        model: VC_MODEL,
        speed,
        speaker_embedding: await loadSpeakerEmbedding(),
        audio_config: {
          sample_rate: 24000,
          num_channels: 1,
          sample_width: 2,
          container: "mp3",
          bitrate: "64k",
        },
      }
    : {
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
      };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/tts/inference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key-ID": apiKey,
      },
      body: JSON.stringify(payload),
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
