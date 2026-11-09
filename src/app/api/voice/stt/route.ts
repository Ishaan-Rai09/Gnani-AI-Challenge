import { NextResponse } from "next/server";
import { GnaniError, gnaniConfig, transcribeSpeech } from "@/lib/server/gnani";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS = /\.(wav|mp3|ogg|flac|aac|m4a)$/i;

/**
 * Authenticated proxy for Gnani Prisma speech-to-text.
 * Accepts a short recorded clip from the browser and returns the transcript.
 */
export async function POST(request: Request) {
  if (!gnaniConfig().configured) {
    return NextResponse.json(
      {
        error: "NOT_CONFIGURED",
        message: "Add GNANI_API_KEY to .env.local and restart the server to enable speech recognition.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_FORM_DATA" }, { status: 400 });
  }

  const audio = form.get("audio");
  const rawLanguage = form.get("language");
  const language = typeof rawLanguage === "string" ? rawLanguage.trim() : "en-IN";

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "AUDIO_REQUIRED" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "AUDIO_TOO_LARGE" }, { status: 413 });
  }
  if (!/^[a-z]{2}-[A-Z]{2}$/.test(language)) {
    return NextResponse.json({ error: "INVALID_LANGUAGE" }, { status: 400 });
  }

  const named = EXTENSIONS.test(audio.name)
    ? audio
    : new File([audio], "reply.wav", { type: audio.type || "audio/wav" });

  try {
    const result = await transcribeSpeech(named, language);
    return NextResponse.json({
      transcript: result.transcript,
      detectedLanguage: result.detectedLanguage,
      model: result.model,
      latencyMs: result.latencyMs,
      provider: "gnani",
    });
  } catch (error) {
    if (error instanceof GnaniError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }
    return NextResponse.json(
      { error: "TRANSCRIPTION_FAILED", message: "Speech recognition failed." },
      { status: 502 }
    );
  }
}
