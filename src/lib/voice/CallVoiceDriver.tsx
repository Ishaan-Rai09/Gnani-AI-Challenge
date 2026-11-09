"use client";

import { useEffect, useRef } from "react";
import { useCallShield } from "@/lib/store";
import { useVoice } from "@/lib/voice/VoiceProvider";
import { callerVoiceFor, defaultAssistantVoice } from "@/lib/voice/catalog";

/**
 * Drives call audio from the live session transcript.
 *
 * While a line is being spoken the store holds back new script steps, so the
 * conversation is paced by the voices instead of racing ahead of the audio.
 * If Gnani is not configured (or playback fails) the driver releases the hold
 * and the call continues in captions-only mode.
 */
export function CallVoiceDriver() {
  const { session, assistant, setSpeechHold } = useCallShield();
  const voice = useVoice();
  const stopVoice = voice.stop;
  const spokenRef = useRef<Set<string>>(new Set());
  const sessionRef = useRef<string | null>(null);
  const holdRef = useRef(false);

  const setHold = (next: boolean) => {
    if (holdRef.current === next) return;
    holdRef.current = next;
    setSpeechHold(next);
  };

  const voiceActive =
    voice.configured && voice.available && voice.enabled && assistant.voiceEnabled;

  const voiceName = defaultAssistantVoice(assistant);

  // New session: reset spoken lines and silence any previous call.
  useEffect(() => {
    if (session?.id === sessionRef.current) return;
    sessionRef.current = session?.id ?? null;
    spokenRef.current = new Set();
    stopVoice();
    setHold(false);
  }, [session?.id, stopVoice]);

  // Taking over or ending the call stops the assistant mid-sentence.
  useEffect(() => {
    if (!session) return;
    if (session.phase === "user" || session.phase === "ended" || session.phase === "ringing") {
      stopVoice();
      setHold(false);
    }
  }, [session?.phase, session?.id, stopVoice]);

  // Speak each newly revealed caller / assistant line, one at a time.
  useEffect(() => {
    if (!session || (session.phase !== "screening" && session.phase !== "user")) {
      setHold(false);
      return;
    }
    if (!voiceActive) {
      setHold(false);
      return;
    }

    const entry = session.transcript.find(
      (line) =>
        (line.speaker === "ai" || line.speaker === "caller") &&
        !spokenRef.current.has(line.id)
    );

    if (!entry) {
      setHold(false);
      return;
    }

    spokenRef.current.add(entry.id);
    setHold(true);

    const speaker = entry.speaker === "ai" ? voiceName : callerVoiceFor(session.scenarioId);
    void voice
      .speak(entry.text, { voice: speaker, lineId: entry.id })
      .catch(() => {
        // Error state is surfaced by the voice provider; keep the call moving.
      })
      .finally(() => {
        setHold(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.transcript.length, session?.phase, session?.id, voiceActive, voiceName]);

  useEffect(() => {
    return () => {
      holdRef.current = false;
    };
  }, []);

  return null;
}
