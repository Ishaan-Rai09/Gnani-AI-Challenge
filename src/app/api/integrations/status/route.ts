import { NextResponse } from "next/server";
import { gnaniConfig } from "@/lib/server/gnani";

// Reads the environment per request; never prerender this as demo mode.
export const dynamic = "force-dynamic";

/**
 * Reports whether server-side Gnani credentials are present. Only service
 * metadata is returned — never the key or the base URL.
 */
export async function GET() {
  const config = gnaniConfig();

  return NextResponse.json({
    gnani: {
      configured: config.configured,
      mode: config.configured ? "ready" : "demo",
      voice: config.configured,
      services: {
        speechToText: config.configured ? "configured" : "demo",
        textToSpeech: config.configured ? "configured" : "demo",
        textToSpeechModel: config.ttsModel,
        speechToTextModel: config.sttModel,
      },
    },
  });
}
