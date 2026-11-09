import { NextResponse } from "next/server";
import { GnaniError, gnaniConfig, synthesizeSpeech } from "@/lib/server/gnani";

export const runtime = "nodejs";

const MAX_TEXT = 600;
const VOICE_RE = /^[A-Za-z][A-Za-z .'-]{1,29}$/;

/**
 * Authenticated proxy for Gnani Timbre text-to-speech.
 * The API key stays on the server; the browser only receives audio.
 */
export async function POST(request: Request) {
  let body: { text?: unknown; voice?: unknown; language?: unknown; speed?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const voice = typeof body.voice === "string" ? body.voice.trim() : "";
  const language = typeof body.language === "string" ? body.language.trim() : "auto";
  const speed = typeof body.speed === "number" ? body.speed : 1;

  if (!text) {
    return NextResponse.json({ error: "TEXT_REQUIRED" }, { status: 400 });
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json({ error: "TEXT_TOO_LONG", max: MAX_TEXT }, { status: 413 });
  }
  if (!VOICE_RE.test(voice)) {
    return NextResponse.json({ error: "INVALID_VOICE" }, { status: 400 });
  }
  if (!/^(auto|[a-z]{2}(-[A-Za-z]{2,4})?)$/.test(language)) {
    return NextResponse.json({ error: "INVALID_LANGUAGE" }, { status: 400 });
  }

  if (!gnaniConfig().configured) {
    return NextResponse.json(
      {
        error: "NOT_CONFIGURED",
        message: "Add GNANI_API_KEY to .env.local and restart the server to enable call audio.",
      },
      { status: 503 }
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
      },
    });
  } catch (error) {
    if (error instanceof GnaniError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }
    return NextResponse.json(
      { error: "VOICE_FAILED", message: "Text-to-speech failed." },
      { status: 502 }
    );
  }
}
