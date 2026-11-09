import type { AssistantSettings } from "@/lib/types";

/**
 * A small, curated slice of Gnani Timbre v2.5's voice catalog.
 * Full list: https://docs.gnani.ai/api/TTS/available-voices
 */
export interface VoiceOption {
  id: string;
  label: string;
  persona: string;
  language: string;
}

export const ASSISTANT_VOICES: VoiceOption[] = [
  { id: "Kaveri", label: "Kaveri", persona: "Firm, professional", language: "en-IN" },
  { id: "Pranav", label: "Pranav", persona: "Friendly support", language: "en-IN" },
  { id: "Trupti", label: "Trupti", persona: "Upbeat, articulate", language: "en-IN" },
  { id: "Shlok", label: "Shlok", persona: "Warm, conversational", language: "en-IN" },
  { id: "Girish", label: "Girish", persona: "Expressive, energetic", language: "en-IN" },
  { id: "Devika", label: "Devika", persona: "Authoritative", language: "en-IN" },
];

/** Caller voices are assigned per scenario so two callers never sound alike. */
const CALLER_VOICES = ["Pranav", "Shlok", "Girish", "Devika", "Trupti", "Kaveri"];

export function callerVoiceFor(scenarioId: string): string {
  let hash = 0;
  for (let index = 0; index < scenarioId.length; index += 1) {
    hash = (hash * 31 + scenarioId.charCodeAt(index)) % 100_000;
  }
  return CALLER_VOICES[hash % CALLER_VOICES.length];
}

export function isAssistantVoice(voice: string): boolean {
  return ASSISTANT_VOICES.some((option) => option.id === voice);
}

/** Gnani TTS uses `auto` for script detection; STT needs a concrete locale. */
export const TTS_LANGUAGE = "auto";

const STT_LANGUAGES: Record<string, string> = {
  "English (India)": "en-IN",
  "English (US)": "en-IN",
  Hindi: "hi-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Bengali: "bn-IN",
};

export function sttLanguageCode(language: string): string {
  return STT_LANGUAGES[language] ?? "en-IN";
}

/**
 * Light spoken-form normalisation before synthesis. Gnani handles numbers and
 * currency well, but acronyms and long digit strings are clearer spelled out.
 */
export function speechText(input: string): string {
  return input
    .replace(/\bOTP\b/g, "O T P")
    .replace(/\bKYC\b/g, "K Y C")
    .replace(/\bUPI\b/g, "U P I")
    .replace(/\bINR\b/g, "rupees")
    .replace(/₹\s?/g, "rupees ")
    .replace(/\b\d{8,}\b/g, (digits) => digits.split("").join(" "))
    .replace(/\b([A-Z]{2,4})-(\d{3,6})\b/g, (_match, letters: string, digits: string) =>
      `${letters.split("").join(" ")} ${digits.split("").join(" ")}`
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function voiceLabel(voice: string): string {
  return ASSISTANT_VOICES.find((option) => option.id === voice)?.label ?? voice;
}

export function defaultAssistantVoice(settings: Pick<AssistantSettings, "voice">): string {
  return isAssistantVoice(settings.voice) ? settings.voice : ASSISTANT_VOICES[0].id;
}
