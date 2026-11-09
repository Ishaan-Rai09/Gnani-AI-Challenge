"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  ChevronDown,
  CornerDownLeft,
  Loader2,
  Mic,
  Phone,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { LiveSession, TranscriptEntry } from "@/lib/types";
import { formatClock } from "@/lib/format";
import { cx } from "@/lib/utils";
import { useCallShield } from "@/lib/store";
import { useVoice } from "@/lib/voice/VoiceProvider";
import { usePushToTalk } from "@/lib/voice/usePushToTalk";

const QUICK_REPLIES = [
  "I can't share that on this call.",
  "Please send that request in writing.",
  "I'll verify this through the official number.",
];

const SPEAKER_LABEL: Record<TranscriptEntry["speaker"], string> = {
  ai: "CallShield AI",
  caller: "Unknown caller",
  user: "You",
  system: "CallShield",
};

function Waveform({ active, level = 0 }: { active: boolean; level?: number }) {
  return (
    <div className="flex h-7 items-center justify-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 32 }).map((_, index) => {
        const base = 5 + ((index * 7) % 17);
        const height = active ? base + Math.round(level * 22) : 4 + (index % 3);
        return (
          <span
            key={index}
            className={cx(
              "w-[2px] rounded-full transition-[height,background-color] duration-150",
              active ? "animate-voice-bar bg-signal" : "bg-ivory/20"
            )}
            style={{
              height: `${height}px`,
              animationDelay: `${(index % 11) * 75}ms`,
              animationDuration: `${720 + (index % 5) * 110}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function CaptionLine({ entry, live }: { entry: TranscriptEntry; live: boolean }) {
  const ai = entry.speaker === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={cx(
        "flex gap-2.5 text-left",
        !ai && entry.speaker === "caller" && "opacity-60",
        entry.speaker === "user" && "opacity-70"
      )}
    >
      <span
        className={cx(
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          ai ? "bg-signal" : entry.speaker === "user" ? "bg-ivory/70" : "bg-ivory/30"
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p
          className={cx(
            "text-[8.5px] font-semibold uppercase tracking-[0.14em]",
            ai ? "text-signal/80" : "text-ivory/40"
          )}
        >
          {SPEAKER_LABEL[entry.speaker]}
        </p>
        <p
          className={cx(
            "mt-1 text-[12.5px] leading-relaxed",
            live ? "text-ivory" : "text-ivory/65"
          )}
        >
          {entry.text}
        </p>
      </div>
    </motion.div>
  );
}

function TranscriptLog({ session }: { session: LiveSession }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [session.transcript.length]);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-thin max-h-[220px] space-y-3.5 overflow-y-auto px-4 py-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {session.transcript.map((entry) => {
        if (entry.speaker === "system") {
          return (
            <div key={entry.id} className="flex items-center gap-2 py-0.5">
              <span className="h-px flex-1 bg-line" />
              <span className="max-w-[85%] text-center text-[9.5px] leading-relaxed text-muted">
                {entry.text}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          );
        }
        return (
          <div key={entry.id} className="flex gap-2.5">
            <span className="mt-0.5 w-[86px] shrink-0 pt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-ink/40">
              {SPEAKER_LABEL[entry.speaker]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] leading-relaxed text-ink/75">{entry.text}</p>
              <p className="mt-0.5 font-display text-[8.5px] tabular-nums text-ink/25">
                {formatClock(entry.at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TranscriptPanel({
  session,
  onSend,
  disabled,
}: {
  session: LiveSession;
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const { assistant } = useCallShield();
  const voice = useVoice();
  const [value, setValue] = useState("");
  const [logOpen, setLogOpen] = useState(false);

  const handling = session.phase === "user";

  const ptt = usePushToTalk({
    language: assistant.language,
    enabled: handling && voice.configured && !disabled,
    onTranscript: (text) => onSend(text),
  });

  const visibleLines = session.transcript.filter((entry) => entry.speaker !== "system");
  const captions = visibleLines.slice(-3);
  const speakingEntry = voice.activeLineId
    ? session.transcript.find((entry) => entry.id === voice.activeLineId)
    : undefined;
  const lastUserLine = [...visibleLines].reverse().find((entry) => entry.speaker === "user");

  const recording = ptt.state === "recording";
  const transcribing = ptt.state === "transcribing";

  let statusLabel = "Assistant is listening";
  if (recording) statusLabel = "Listening — speak now";
  else if (transcribing) statusLabel = "Transcribing your reply…";
  else if (voice.speaking && speakingEntry?.speaker === "caller") statusLabel = "Caller is speaking";
  else if (voice.speaking) statusLabel = "CallShield AI is speaking";
  else if (handling) statusLabel = "Your turn — tap the mic to speak";
  else if (voice.configured && !voice.available) statusLabel = "Audio unavailable — captions only";

  const callerActive = recording || (voice.speaking && speakingEntry?.speaker === "caller");
  const aiActive = !recording && voice.speaking && speakingEntry?.speaker === "ai";

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[13px] font-semibold">Conversation</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            Live
          </span>
          {voice.configured ? (
            <span className="hidden items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-muted sm:inline-flex">
              <Phone className="h-2.5 w-2.5" />
              Gnani voice
            </span>
          ) : (
            <span className="hidden rounded-full border border-line px-2 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-muted sm:inline">
              Captions only
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[9.5px] tabular-nums text-muted">
            {session.transcript.length} {session.transcript.length === 1 ? "line" : "lines"}
          </span>
          {voice.configured && (
            <button
              type="button"
              onClick={() => voice.setEnabled(!voice.enabled)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink/55 transition-colors hover:border-ink/30 hover:text-ink"
              aria-label={voice.enabled ? "Mute call audio" : "Play call audio"}
              title={voice.enabled ? "Mute call audio" : "Play call audio"}
            >
              {voice.enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden bg-ink px-4 pb-4 pt-3.5 text-ivory">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.16em] text-ivory/40">
            <span className={cx("h-1.5 w-1.5 rounded-full", handling ? "bg-ivory/60" : "bg-signal")} />
            {handling ? "You're on the call" : "AI screening call"}
          </span>
          <span className="font-display text-[10px] tabular-nums text-ivory/35">
            {formatClock(session.elapsedSec)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cx(
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                callerActive
                  ? "border-signal/60 bg-signal/15 text-signal"
                  : "border-ivory/15 bg-ivory/[0.06] text-ivory/60"
              )}
            >
              {callerActive && (
                <span className="absolute inset-0 animate-voice-ring rounded-full border border-signal/50" />
              )}
              ?
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-ivory/90">
                {session.callerName ?? "Unknown caller"}
              </p>
              <p className="truncate text-[9px] text-ivory/35">
                {session.claimedOrg ? `Claims ${session.claimedOrg}` : "No organisation given"}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <Waveform active={recording || voice.speaking} level={ptt.level} />
            <p
              className={cx(
                "mt-1.5 text-[9px] font-medium tracking-wide",
                recording ? "text-signal" : "text-ivory/45"
              )}
              aria-live="polite"
            >
              {statusLabel}
            </p>
          </div>

          <div className="flex min-w-0 flex-row-reverse items-center gap-2.5 text-right">
            <span
              className={cx(
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                aiActive
                  ? "border-signal/60 bg-signal/15 text-signal"
                  : "border-ivory/15 bg-ivory/[0.06] text-ivory/60"
              )}
            >
              {aiActive && (
                <span className="absolute inset-0 animate-voice-ring rounded-full border border-signal/50" />
              )}
              <Bot className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-medium text-ivory/90">CallShield AI</p>
              <p className="truncate text-[9px] text-ivory/35">{handling ? "Taking notes" : "Screening"}</p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 min-h-[92px] space-y-2.5 rounded-lg border border-ivory/10 bg-ivory/[0.04] px-3 py-2.5" aria-live="polite">
          {captions.length === 0 ? (
            <p className="text-[11.5px] text-ivory/40">Connecting call audio…</p>
          ) : (
            captions.map((entry, index) => (
              <CaptionLine key={entry.id} entry={entry} live={index === captions.length - 1} />
            ))
          )}
        </div>

        {(voice.error || ptt.error) && (
          <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-signal/30 bg-signal/10 px-2.5 py-2">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-signal" />
            <p className="flex-1 text-[10px] leading-relaxed text-ivory/70">
              {ptt.error ?? voice.error}
            </p>
            {voice.error && (
              <button
                type="button"
                onClick={() => {
                  void voice.refreshStatus();
                }}
                className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-signal hover:text-ivory"
              >
                Retry
              </button>
            )}
            {!voice.error && ptt.error && (
              <button
                type="button"
                onClick={ptt.reset}
                className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-signal hover:text-ivory"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-line bg-white/50 p-3.5">
        {handling ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (recording ? ptt.stop() : void ptt.start())}
                disabled={disabled || transcribing || !voice.configured}
                className={cx(
                  "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all",
                  recording
                    ? "bg-signal text-ink"
                    : "bg-ink text-ivory hover:bg-inkSoft disabled:opacity-30",
                  transcribing && "bg-ink/80"
                )}
                aria-label={recording ? "Stop and transcribe your reply" : "Speak your reply"}
              >
                {recording && (
                  <span className="absolute inset-0 animate-voice-ring rounded-full border-2 border-signal/50" />
                )}
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : recording ? (
                  <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-ink/75">
                  {recording
                    ? `Recording · ${Math.ceil((ptt.maxMs - ptt.elapsedMs) / 1000)}s left`
                    : transcribing
                      ? "Sending your reply to Gnani…"
                      : voice.configured
                        ? "Tap the mic and speak your reply"
                        : "Voice replies need GNANI_API_KEY"}
                </p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                  {voice.configured
                    ? "Your clip is transcribed by Gnani Prisma and added to the call. Up to 25 seconds."
                    : "Add the key to .env.local and restart the server. You can type below for now."}
                </p>
              </div>
              {recording && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-signal" />}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => submit(reply)}
                  disabled={disabled || recording || transcribing}
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-[9.5px] text-ink/55 transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-40"
                >
                  {reply}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit(value);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Or type your reply…"
                aria-label="Your reply in the simulated call"
                disabled={disabled || recording || transcribing}
                className="input-base h-9 py-0 text-[11.5px]"
              />
              <button
                type="submit"
                disabled={!value.trim() || disabled || recording || transcribing}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-ivory transition-colors hover:bg-inkSoft disabled:opacity-30"
                aria-label="Send reply"
              >
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
            </form>

            {lastUserLine && (
              <p className="truncate text-[9px] text-muted">
                Last said: “{lastUserLine.text}”
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9.5px] leading-relaxed text-muted">
              The assistant is handling the caller. Take over any time to speak yourself.
            </p>
            <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-muted">
              AI handling
            </span>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setLogOpen((open) => !open)}
          aria-expanded={logOpen}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-ash/40"
        >
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            Full transcript
          </span>
          <ChevronDown
            className={cx("h-3.5 w-3.5 text-muted transition-transform", logOpen && "rotate-180")}
          />
        </button>
        {logOpen && <TranscriptLog session={session} />}
      </div>
    </section>
  );
}
