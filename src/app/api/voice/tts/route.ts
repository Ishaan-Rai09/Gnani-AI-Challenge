import { NextResponse } from "next/server";
import { GnaniError, gnaniConfig, synthesizeSpeech } from "@/lib/server/gnani";
import { forbiddenOrigin, isSameOrigin, jsonNoStore } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { currentUserId, unauthorized } from "@/lib/server/session";

export const runtime = "nodejs";

const MAX_TEXT = 600;
const VOICE_RE = /^[A-Za-z][A-Za-z .'-]{1,29}$/;

/**
 * Authenticated proxy for Gnani Timbre text-to-speech.
 * The API key stays on the server; the browser only receives audio.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  // Without this guard the route is an open, billable relay to Gnani.
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`tts:${userId}`, 120, 60_000);
  if (!limit.ok) {
    const response = jsonNoStore(
      { error: "RATE_LIMITED", message: "Too many voice requests. Wait a moment and try again." },
      429
    );
    response.headers.set("Retry-After", String(limit.retryAfterSec));
    return response;
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > 16 * 1024) {
    return jsonNoStore({ error: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let body: { text?: unknown; voice?: unknown; language?: unknown; speed?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonNoStore({ error: "INVALID_JSON" }, 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const voice = typeof body.voice === "string" ? body.voice.trim() : "";
  const language = typeof body.language === "string" ? body.language.trim() : "auto";
  const rawSpeed = typeof body.speed === "number" ? body.speed : 1;
  const speed = Number.isFinite(rawSpeed) ? Math.min(1.5, Math.max(0.5, rawSpeed)) : 1;

  if (!text) {
    return jsonNoStore({ error: "TEXT_REQUIRED" }, 400);
  }
  if (text.length > MAX_TEXT) {
    return jsonNoStore({ error: "TEXT_TOO_LONG", max: MAX_TEXT }, 413);
  }
  if (!VOICE_RE.test(voice)) {
    return jsonNoStore({ error: "INVALID_VOICE" }, 400);
  }
  if (!/^(auto|[a-z]{2}(-[A-Za-z]{2,4})?)$/.test(language)) {
    return jsonNoStore({ error: "INVALID_LANGUAGE" }, 400);
  }

  if (!gnaniConfig().configured) {
    return jsonNoStore(
      {
        error: "NOT_CONFIGURED",
        message: "Add GNANI_API_KEY to .env.local and restart the server to enable call audio.",
      },
      503
    );
  }

  try {
    const { audio, contentType, cached } = await synthesizeSpeech({
      text,
      voice,
      language,
      speed,
    });
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "private, max-age=86400",
        "X-CallShield-Voice-Cache": cached ? "hit" : "miss",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof GnaniError) {
      return jsonNoStore(
        { error: error.code, message: error.message },
        error.status >= 400 && error.status < 600 ? error.status : 502
      );
    }
    return jsonNoStore(
      { error: "VOICE_FAILED", message: "Text-to-speech failed." },
      502
    );
  }
}
