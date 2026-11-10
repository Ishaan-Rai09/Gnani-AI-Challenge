import { gnaniConfig } from "@/lib/server/gnani";
import { jsonNoStore } from "@/lib/server/http";
import { currentUserId, unauthorized } from "@/lib/server/session";

// Reads the environment per request; this must never be prerendered.
export const dynamic = "force-dynamic";

/**
 * Reports whether server-side Gnani credentials are present. Only service
 * metadata is returned — never the key or the base URL.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const config = gnaniConfig();

  return jsonNoStore({
    gnani: {
      configured: config.configured,
      mode: config.configured ? "ready" : "unconfigured",
      voice: config.configured,
      voiceClone: config.cloneConfigured,
      services: {
        speechToText: config.configured ? "configured" : "unconfigured",
        textToSpeech: config.configured ? "configured" : "unconfigured",
        textToSpeechModel: config.ttsModel,
        speechToTextModel: config.sttModel,
      },
    },
  });
}
