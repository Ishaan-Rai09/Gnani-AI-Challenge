import type { AssistantSettings, TranscriptEntry } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Conversation orchestration for the demo engine.
 *
 * In production this module would broker a realtime conversation between a
 * telephony audio stream and Gnani's speech services. For the prototype the
 * caller side is deterministic script data, while the assistant greeting and
 * follow-up questions come from the user's assistant settings.
 */
export const conversationService = {
  greetingLine(settings: AssistantSettings, at = 0): TranscriptEntry {
    return {
      id: uid("line"),
      speaker: "ai",
      text: settings.greeting,
      at,
    };
  },

  systemLine(text: string, at: number): TranscriptEntry {
    return { id: uid("line"), speaker: "system", text, at };
  },

  userLine(text: string, at: number): TranscriptEntry {
    return { id: uid("line"), speaker: "user", text, at };
  },

  lineFromStep(text: string, speaker: "ai" | "caller", at: number): TranscriptEntry {
    return { id: uid("line"), speaker, text, at };
  },
};
