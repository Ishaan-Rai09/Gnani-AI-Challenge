"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordingToWav } from "@/lib/voice/wav";
import { sttLanguageCode } from "@/lib/voice/catalog";

export type PushToTalkState = "idle" | "recording" | "transcribing" | "error";

const MAX_RECORDING_MS = 25_000;
const MIN_RECORDING_MS = 1_200;
const SILENCE_THRESHOLD = 0.075;
const SILENCE_MS = 1_100;
const NO_SPEECH_STOP_MS = 8_000;

/**
 * Records a spoken reply, converts it to 16 kHz WAV and sends it to the
 * server-side Gnani STT route. The API key never reaches the browser.
 *
 * Voice-activity detection ends the clip automatically ~1s after you stop
 * speaking, so replies reach the call in seconds instead of waiting for the
 * full recording window.
 */
export function usePushToTalk({
  language,
  onTranscript,
  enabled = true,
}: {
  language: string;
  onTranscript: (text: string) => void;
  enabled?: boolean;
}) {
  const [state, setState] = useState<PushToTalkState>("idle");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const contextRef = useRef<AudioContext | null>(null);
  const meterRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const startedRef = useRef(0);
  const sawSpeechRef = useRef(false);
  const lastVoiceRef = useRef(0);
  const silentAbortRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const cleanup = useCallback(() => {
    if (meterRef.current !== null) window.clearInterval(meterRef.current);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    meterRef.current = null;
    timerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      if (recorder.state !== "inactive") recorder.stop();
      recorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setState("transcribing");
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (meterRef.current !== null) window.clearInterval(meterRef.current);
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    if (state === "recording" || state === "transcribing") return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot capture microphone audio.");
      setState("error");
      return;
    }

    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      sawSpeechRef.current = false;
      silentAbortRef.current = false;
      lastVoiceRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const chunks = chunksRef.current;
        const type = recorder.mimeType || mimeType || "audio/webm";
        const wasSilentAbort = silentAbortRef.current;
        cleanup();
        if (chunks.length === 0 || wasSilentAbort) {
          // Nothing usable was said — re-arm quietly instead of erroring.
          setState("idle");
          setError(null);
          return;
        }

        setState("transcribing");
        try {
          const wav = await recordingToWav(new Blob(chunks, { type }));
          const form = new FormData();
          form.append("audio", wav, "reply.wav");
          form.append("language", sttLanguageCode(language));

          const response = await fetch("/api/voice/stt", { method: "POST", body: form });
          const data = (await response.json().catch(() => null)) as
            | { transcript?: string; message?: string }
            | null;

          if (!response.ok) {
            setError(data?.message ?? "Speech recognition is unavailable right now.");
            setState("error");
            return;
          }

          const text = (data?.transcript ?? "").trim();
          if (!text) {
            setError("I didn't catch that. Tap the mic and try again.");
            setState("error");
            return;
          }

          onTranscriptRef.current(text);
          setState("idle");
        } catch {
          setError("That clip could not be transcribed. Try again.");
          setState("error");
        }
      };

      recorder.start();
      startedRef.current = Date.now();
      setElapsedMs(0);
      setState("recording");

      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      contextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      meterRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const value = (samples[index] - 128) / 128;
          sum += value * value;
        }
        const current = Math.min(1, Math.sqrt(sum / samples.length) * 4);
        setLevel(current);
        const now = Date.now();
        setElapsedMs(now - startedRef.current);

        // Voice-activity detection: stop shortly after the speaker pauses so
        // the reply is transcribed immediately instead of waiting out the
        // full window.
        const active = recorderRef.current;
        if (!active || active.state === "inactive") return;
        const elapsed = now - startedRef.current;
        if (current > SILENCE_THRESHOLD) {
          sawSpeechRef.current = true;
          lastVoiceRef.current = now;
        }
        if (elapsed < MIN_RECORDING_MS) return;
        if (sawSpeechRef.current && now - lastVoiceRef.current > SILENCE_MS) {
          active.stop();
          setState("transcribing");
        } else if (!sawSpeechRef.current && elapsed > NO_SPEECH_STOP_MS) {
          silentAbortRef.current = true;
          active.stop();
        }
      }, 90);

      timerRef.current = window.setTimeout(() => {
        const active = recorderRef.current;
        if (active && active.state !== "inactive") {
          active.stop();
          setState("transcribing");
        }
      }, MAX_RECORDING_MS);
    } catch (caught) {
      cleanup();
      const name = caught instanceof DOMException ? caught.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was denied. Allow it in your browser, or type your reply instead."
          : "The microphone could not be started. You can type your reply instead."
      );
      setState("error");
    } finally {
      startingRef.current = false;
    }
  }, [cleanup, enabled, language, state]);

  const reset = useCallback(() => {
    setError(null);
    if (state === "error") setState("idle");
  }, [state]);

  return {
    state,
    level,
    error,
    elapsedMs,
    maxMs: MAX_RECORDING_MS,
    start,
    stop,
    reset,
    busy: state === "recording" || state === "transcribing",
  };
}
