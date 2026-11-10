import { GnaniError, gnaniConfig, transcribeSpeech } from "@/lib/server/gnani";
import { forbiddenOrigin, isSameOrigin, jsonNoStore } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { currentUserId, unauthorized } from "@/lib/server/session";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_BYTES + 512 * 1024;
const EXTENSIONS = /\.(wav|mp3|ogg|flac|aac|m4a)$/i;

/**
 * Authenticated proxy for Gnani Prisma speech-to-text.
 * Accepts a short recorded clip from the browser and returns the transcript.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  // Without this guard the route is an open, billable relay to Gnani.
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`stt:${userId}`, 40, 60_000);
  if (!limit.ok) {
    const response = jsonNoStore(
      { error: "RATE_LIMITED", message: "Too many transcription requests. Wait a moment and try again." },
      429
    );
    response.headers.set("Retry-After", String(limit.retryAfterSec));
    return response;
  }

  if (!gnaniConfig().configured) {
    return jsonNoStore(
      {
        error: "NOT_CONFIGURED",
        message: "Add GNANI_API_KEY to .env.local and restart the server to enable speech recognition.",
      },
      503
    );
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    return jsonNoStore({ error: "AUDIO_TOO_LARGE" }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonNoStore({ error: "INVALID_FORM_DATA" }, 400);
  }

  const audio = form.get("audio");
  const rawLanguage = form.get("language");
  const language = typeof rawLanguage === "string" ? rawLanguage.trim() : "en-IN";

  if (!(audio instanceof File) || audio.size === 0) {
    return jsonNoStore({ error: "AUDIO_REQUIRED" }, 400);
  }
  if (audio.size > MAX_BYTES) {
    return jsonNoStore({ error: "AUDIO_TOO_LARGE" }, 413);
  }
  if (audio.type && !audio.type.startsWith("audio/") && audio.type !== "application/octet-stream") {
    return jsonNoStore({ error: "INVALID_AUDIO_TYPE" }, 400);
  }
  if (!/^[a-z]{2}-[A-Z]{2}$/.test(language)) {
    return jsonNoStore({ error: "INVALID_LANGUAGE" }, 400);
  }

  const named = new File([audio], `reply.${(audio.name.match(EXTENSIONS)?.[1] ?? "wav").toLowerCase()}`, {
    type: audio.type || "audio/wav",
  });

  try {
    const result = await transcribeSpeech(named, language);
    return jsonNoStore({
      transcript: result.transcript,
      detectedLanguage: result.detectedLanguage,
      model: result.model,
      latencyMs: result.latencyMs,
      provider: "gnani",
    });
  } catch (error) {
    if (error instanceof GnaniError) {
      return jsonNoStore(
        { error: error.code, message: error.message },
        error.status >= 400 && error.status < 600 ? error.status : 502
      );
    }
    return jsonNoStore(
      { error: "TRANSCRIPTION_FAILED", message: "Speech recognition failed." },
      502
    );
  }
}
