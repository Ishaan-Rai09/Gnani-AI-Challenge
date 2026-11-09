"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TTS_LANGUAGE, speechText } from "@/lib/voice/catalog";

interface GnaniStatus {
  configured: boolean;
  mode: string;
  voiceClone?: boolean;
  services?: {
    textToSpeech?: string;
    speechToText?: string;
    textToSpeechModel?: string;
    speechToTextModel?: string;
  };
}

interface SpeakOptions {
  voice: string;
  lineId?: string;
  language?: string;
  speed?: number;
}

interface VoiceContextValue {
  /** Server has a Gnani key. */
  configured: boolean;
  /** Server has a voice-clone reference audio configured. */
  voiceClone: boolean;
  /** Status request in flight. */
  checking: boolean;
  /** Audio failed for this session (bad key, network, autoplay). */
  available: boolean;
  /** User's speaker control. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  speaking: boolean;
  activeLineId: string | null;
  error: string | null;
  ttsModel: string | null;
  sttModel: string | null;
  speak: (text: string, options: SpeakOptions) => Promise<void>;
  stop: () => void;
  refreshStatus: () => Promise<void>;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<GnaniStatus | null>(null);
  const [available, setAvailable] = useState(true);
  const [enabled, setEnabledState] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishRef = useRef<(() => void) | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const generationRef = useRef(0);

  const stop = useCallback(() => {
    generationRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    }
    finishRef.current?.();
    finishRef.current = null;
    setSpeaking(false);
    setActiveLineId(null);
  }, []);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      if (!next) stop();
    },
    [stop]
  );

  const refreshStatus = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/integrations/status", { cache: "no-store" });
      const data = (await response.json()) as { gnani?: GnaniStatus };
      setStatus(data.gnani ?? null);
      setAvailable(true);
      setError(null);
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    return () => {
      generationRef.current += 1;
      audioRef.current?.pause();
      finishRef.current?.();
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [refreshStatus]);

  const speak = useCallback(
    async (text: string, options: SpeakOptions) => {
      const spoken = speechText(text);
      if (!spoken) return;

      stop();
      const generation = generationRef.current;
      setError(null);
      setActiveLineId(options.lineId ?? null);

      const cacheKey = `${options.voice}|${options.language ?? TTS_LANGUAGE}|${options.speed ?? 1}|${spoken}`;
      let url = cacheRef.current.get(cacheKey);

      if (!url) {
        let response: Response;
        try {
          response = await fetch("/api/voice/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: spoken,
              voice: options.voice,
              language: options.language ?? TTS_LANGUAGE,
              speed: options.speed ?? 1,
            }),
          });
        } catch {
          setAvailable(false);
          setError("Could not reach the voice service.");
          throw new Error("Voice service unreachable");
        }

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          const message = data?.message ?? "Call audio is unavailable. Captions will continue.";
          setAvailable(false);
          setError(message);
          throw new Error(message);
        }

        const blob = await response.blob();
        if (cacheRef.current.size > 80) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest) {
            const oldUrl = cacheRef.current.get(oldest);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            cacheRef.current.delete(oldest);
          }
        }
        url = URL.createObjectURL(blob);
        cacheRef.current.set(cacheKey, url);
      }

      if (generation !== generationRef.current) return;

      const audio = new Audio(url);
      audio.preload = "auto";
      audioRef.current = audio;
      setSpeaking(true);

      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };
        finishRef.current = finish;
        audio.onended = finish;
        audio.onerror = () => {
          setError("Call audio could not be played.");
          finish();
        };
        void audio.play().catch((playError: DOMException) => {
          setError(
            playError?.name === "NotAllowedError"
              ? "Your browser blocked autoplay. Tap “Play call audio” to continue hearing the call."
              : "Call audio could not be played."
          );
          finish();
        });
      });

      if (generation === generationRef.current) {
        setSpeaking(false);
        setActiveLineId(null);
        finishRef.current = null;
        audioRef.current = null;
      }
    },
    [stop]
  );

  const value = useMemo<VoiceContextValue>(
    () => ({
      configured: Boolean(status?.configured),
      voiceClone: Boolean(status?.voiceClone),
      checking,
      available,
      enabled,
      setEnabled,
      speaking,
      activeLineId,
      error,
      ttsModel: status?.services?.textToSpeechModel ?? null,
      sttModel: status?.services?.speechToTextModel ?? null,
      speak,
      stop,
      refreshStatus,
    }),
    [
      status,
      checking,
      available,
      enabled,
      setEnabled,
      speaking,
      activeLineId,
      error,
      speak,
      stop,
      refreshStatus,
    ]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext);
  if (!context) throw new Error("useVoice must be used inside VoiceProvider");
  return context;
}
