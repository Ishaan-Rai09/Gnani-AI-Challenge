"use client";

import { useState } from "react";
import {
  Bot,
  Check,
  CircleHelp,
  Globe2,
  Languages,
  ListChecks,
  Loader2,
  MessageSquareText,
  Play,
  RotateCcw,
  ShieldCheck,
  Siren,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useCallShield } from "@/lib/store";
import { DEFAULT_ASSISTANT } from "@/lib/seed";
import type { AssistantSettings, ScreeningMode } from "@/lib/types";
import { cx } from "@/lib/utils";
import { useVoice } from "@/lib/voice/VoiceProvider";
import { ASSISTANT_VOICES } from "@/lib/voice/catalog";

const MODES: Array<{ key: ScreeningMode; label: string; body: string }> = [
  {
    key: "strict",
    label: "Strict",
    body: "Ask every question and flag unusual answers early. Best if you receive frequent unknown calls.",
  },
  {
    key: "balanced",
    label: "Balanced",
    body: "Ask the core identity questions, then assess context before escalating anything to you.",
  },
  {
    key: "relaxed",
    label: "Relaxed",
    body: "Ask fewer questions and only surface strong credential, payment, or coercion signals.",
  },
];

const LANGUAGES = [
  "English (India)",
  "English (US)",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
];

const QUESTIONS: Array<{
  key: keyof AssistantSettings["questions"];
  label: string;
  body: string;
}> = [
  { key: "name", label: "Ask for the caller's name", body: "Who is on the line, and what is their role?" },
  { key: "organisation", label: "Ask which organisation they represent", body: "Capture a company or department name for the record." },
  { key: "purpose", label: "Ask the reason for the call", body: "Establish intent before the conversation goes further." },
  { key: "reference", label: "Ask for a reference or case number", body: "A verifiable identifier callers can be held to." },
];

const HANDLING: Array<{
  key: AssistantSettings["handling"];
  label: string;
  body: string;
}> = [
  {
    key: "notify",
    label: "Notify me and keep screening",
    body: "The assistant continues the conversation and sends you an in-app alert. Nothing is blocked automatically.",
  },
  {
    key: "screen_and_hold",
    label: "Screen and hold",
    body: "After the questions, the caller waits while you review the summary. They are never forwarded without your action.",
  },
  {
    key: "voicemail",
    label: "Offer voicemail",
    body: "The assistant offers to take a message. You decide later whether to call back or block the number.",
  },
];

const NOTIFICATIONS: Array<{
  key: keyof Pick<
    AssistantSettings,
    "notifySuspicious" | "notifySummaries" | "notifyBlocked"
  >;
  label: string;
  body: string;
}> = [
  { key: "notifySuspicious", label: "Suspicious caller alerts", body: "When a new high-risk signal appears during screening." },
  { key: "notifySummaries", label: "Screening report ready", body: "When the assistant finishes and a summary is available." },
  { key: "notifyBlocked", label: "Blocklist changes", body: "When a number is added to or removed from your blocklist." },
];

export function AssistantView() {
  const { assistant, updateAssistant, pushToast } = useCallShield();
  const voice = useVoice();
  const [previewing, setPreviewing] = useState(false);

  async function previewVoice() {
    if (!voice.configured) return;
    setPreviewing(true);
    try {
      await voice.speak(assistant.greeting, { voice: assistant.voice });
    } catch {
      // The provider surfaces the reason inline in the voice card.
    } finally {
      setPreviewing(false);
    }
  }

  const activeQuestions = QUESTIONS.filter((question) => assistant.questions[question.key]);

  function resetGreeting() {
    updateAssistant({ greeting: DEFAULT_ASSISTANT.greeting });
    pushToast({ title: "Greeting restored", description: "The default assistant introduction is back.", tone: "success" });
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Configure · auto-saved locally
          </p>
          <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">
            Set the rules for your screening.
          </h2>
          <p className="mt-2 max-w-[580px] text-[12.5px] leading-relaxed text-muted">
            Decide how the assistant answers, what it asks, and what should reach you. Everything
            here is a preference — the assistant never blocks a caller without your action.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-paper px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted sm:self-auto">
          <Check className="h-3 w-3 text-signal" />
          Saved automatically
        </span>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-3">
          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white">
                  <Bot className="h-4 w-4 text-ink/60" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-semibold">AI screening</h3>
                  <p className="mt-0.5 max-w-[420px] text-[11px] leading-relaxed text-muted">
                    Let the assistant answer unknown callers, introduce itself, and collect identity
                    and intent before the call reaches you.
                  </p>
                </div>
              </div>
              <Toggle
                checked={assistant.screeningEnabled}
                onChange={(value) => updateAssistant({ screeningEnabled: value })}
                label="Enable AI call screening"
              />
            </div>
            <div
              className={cx(
                "mt-4 rounded-lg border px-3.5 py-2.5 text-[10.5px] leading-relaxed",
                assistant.screeningEnabled
                  ? "border-line bg-white/60 text-muted"
                  : "border-signal/35 bg-signal/[0.06] text-ink/65"
              )}
            >
              {assistant.screeningEnabled
                ? "Screening is active. Incoming unknown callers reach the assistant first during live screening."
                : "Screening is paused. Unknown callers will not be answered by the assistant until you turn this back on."}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <h3 className="text-[13.5px] font-semibold">Screening mode</h3>
            <p className="mt-0.5 text-[11px] text-muted">
              How much the assistant asks before it hands the decision to you.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Screening mode">
              {MODES.map((mode) => {
                const active = assistant.screeningMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateAssistant({ screeningMode: mode.key })}
                    className={cx(
                      "rounded-lg border p-3.5 text-left transition-colors",
                      active ? "border-ink bg-ivory" : "border-line bg-white hover:border-ink/25"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cx("text-[12px] font-semibold", active ? "text-ink" : "text-ink/70")}>
                        {mode.label}
                      </span>
                      <span
                        className={cx(
                          "flex h-4 w-4 items-center justify-center rounded-full border",
                          active ? "border-ink bg-ink text-ivory" : "border-ink/20 bg-white"
                        )}
                      >
                        {active && <Check className="h-2.5 w-2.5" />}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{mode.body}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-3.5 w-3.5 text-ink/40" />
                <h3 className="text-[13.5px] font-semibold">Assistant greeting</h3>
              </div>
              <button
                type="button"
                onClick={resetGreeting}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-ink/45 transition-colors hover:text-ink"
              >
                <RotateCcw className="h-3 w-3" />
                Restore default
              </button>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              The first line every caller hears. Introduce the assistant clearly — never imply it is
              you.
            </p>
            <label htmlFor="greeting" className="sr-only">
              Assistant greeting
            </label>
            <textarea
              id="greeting"
              value={assistant.greeting}
              onChange={(event) => updateAssistant({ greeting: event.target.value })}
              rows={3}
              maxLength={280}
              className="input-base mt-3 resize-none text-[12px] leading-relaxed"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[9.5px] text-muted">
                Spoken as the assistant&apos;s first line, in the voice selected below.
              </p>
              <span className="text-[9px] tabular-nums text-muted">{assistant.greeting.length}/280</span>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white">
                  <Volume2 className="h-4 w-4 text-ink/60" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-semibold">Call voice</h3>
                  <p className="mt-0.5 max-w-[420px] text-[11px] leading-relaxed text-muted">
                    Caller and assistant lines are spoken aloud through Gnani Timbre. Speak replies
                    are transcribed by Gnani Prisma on the server.
                  </p>
                </div>
              </div>
              <Toggle
                checked={assistant.voiceEnabled}
                onChange={(value) => updateAssistant({ voiceEnabled: value })}
                label="Play call audio"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="assistant-voice" className="label-micro">
                  Assistant voice
                </label>
                <select
                  id="assistant-voice"
                  value={assistant.voice}
                  onChange={(event) => updateAssistant({ voice: event.target.value })}
                  className="input-base mt-2 h-9 py-0 text-[11.5px]"
                >
                  {ASSISTANT_VOICES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} — {option.persona}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => void previewVoice()}
                disabled={!voice.configured || previewing}
                className="h-9"
              >
                {previewing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {previewing ? "Playing" : "Preview voice"}
              </Button>
            </div>

            <p className="mt-2 text-[9.5px] leading-relaxed text-muted">
              {voice.configured && assistant.voice === "clone" && !voice.voiceClone
                ? "The cloned voice needs a reference recording on the server: add GNANI_CLONE_AUDIO (path to a 5-30s clip of your voice) and restart. Until then calls fall back to captions."
                : voice.configured
                  ? `Gnani ${voice.ttsModel ?? "Timbre"} for speech, ${voice.sttModel ?? "Prisma"} for recognition.${voice.voiceClone ? " Your cloned voice is ready." : ""} Caller voices are assigned per scenario.`
                  : "Add GNANI_API_KEY to .env.local to enable spoken calls. Until then, calls run in captions-only mode."}
            </p>
            {voice.error && (
              <p className="mt-2 rounded-lg border border-signal/30 bg-signal/[0.07] px-3 py-2 text-[10px] leading-relaxed text-ink/65">
                {voice.error}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white">
                  <Languages className="h-4 w-4 text-ink/60" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-semibold">Hinglish flavour</h3>
                  <p className="mt-0.5 max-w-[420px] text-[11px] leading-relaxed text-muted">
                    Callers speak the natural, code-mixed way real spam calls sound —
                    &ldquo;Aapka KYC expire ho gaya hai&rdquo; — while summaries and risk reports stay
                    in formal English.
                  </p>
                </div>
              </div>
              <Toggle
                checked={assistant.hinglish}
                onChange={(value) => updateAssistant({ hinglish: value })}
                label="Hinglish flavour"
              />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">Caller information questions</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              Pick the questions the assistant should ask. Fewer questions can make screening feel
              less intrusive.
            </p>
            <div className="mt-3 divide-y divide-line/70">
              {QUESTIONS.map((question) => (
                <div key={question.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-[11.5px] font-medium text-ink/80">{question.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{question.body}</p>
                  </div>
                  <Toggle
                    size="sm"
                    checked={assistant.questions[question.key]}
                    onChange={(value) =>
                      updateAssistant({
                        questions: { ...assistant.questions, [question.key]: value },
                      })
                    }
                    label={question.label}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <Siren className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">When something looks suspicious</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              Automatic blocking is intentionally disabled. The assistant prepares context; you take
              the action.
            </p>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label="Suspicious call handling">
              {HANDLING.map((option) => {
                const active = assistant.handling === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateAssistant({ handling: option.key })}
                    className={cx(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      active ? "border-ink bg-ivory" : "border-line bg-white hover:border-ink/25"
                    )}
                  >
                    <span
                      className={cx(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-ink bg-ink" : "border-ink/25 bg-white"
                      )}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-ivory" />}
                    </span>
                    <span>
                      <span className="block text-[11.5px] font-medium text-ink/80">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{option.body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">Notification preferences</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              In-app alerts. No email or push provider is connected in this prototype.
            </p>
            <div className="mt-3 divide-y divide-line/70">
              {NOTIFICATIONS.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-[11.5px] font-medium text-ink/80">{item.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{item.body}</p>
                  </div>
                  <Toggle
                    size="sm"
                    checked={assistant[item.key]}
                    onChange={(value) => updateAssistant({ [item.key]: value })}
                    label={item.label}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <p className="label-micro">Live greeting preview</p>
              <span className="inline-flex items-center gap-1 text-[9px] text-muted">
                <span className={cx("h-1.5 w-1.5 rounded-full", assistant.screeningEnabled ? "bg-signal" : "bg-ink/20")} />
                {assistant.screeningEnabled ? "Screening on" : "Paused"}
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl bg-ink p-4 text-ivory">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                    <CircleHelp className="h-3.5 w-3.5 text-signal" />
                  </span>
                  <div>
                    <p className="font-display text-[12px] font-medium">+91 90000 00000</p>
                    <p className="text-[9px] text-ivory/35">Unknown caller</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-ivory/40">
                  Simulated
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[8px] font-bold text-ink">
                    AI
                  </span>
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-ivory/35">
                    CallShield assistant
                  </p>
                </div>
                <p className="mt-2 max-h-[132px] overflow-y-auto scrollbar-thin text-[11.5px] leading-relaxed text-ivory/80">
                  {assistant.greeting || "Add a greeting for the assistant."}
                </p>
                <div className="mt-3 flex items-end gap-[3px]" aria-hidden="true">
                  {[8, 14, 20, 12, 17, 24, 11, 16, 9, 19, 13, 7].map((height, index) => (
                    <span
                      key={index}
                      className="w-[2px] animate-pulse rounded-full bg-signal/50"
                      style={{ height: `${height}px`, animationDelay: `${index * 90}ms`, animationDuration: "1.2s" }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-ivory/30">
                  Will ask
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {activeQuestions.length === 0 ? (
                    <span className="text-[9px] text-ivory/35">Only the greeting</span>
                  ) : (
                    activeQuestions.map((question) => (
                      <span
                        key={question.key}
                        className="rounded border border-white/12 px-1.5 py-0.5 text-[8.5px] text-ivory/50"
                      >
                        {question.label.replace("Ask for the ", "").replace("Ask which ", "").replace("Ask the ", "")}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[8.5px] text-ivory/30">
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="h-2.5 w-2.5" />
                  {assistant.language}
                </span>
                <span className="capitalize">{assistant.screeningMode} mode</span>
              </div>
            </div>

            <p className="mt-3 text-[9px] leading-relaxed text-muted">
              Scripted callers use fixed dialogue. Changing the greeting updates the
              assistant&apos;s first line, and the voice above reads it aloud.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-ink/40" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Voice integration
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11.5px] font-medium text-ink/75">
                {voice.checking
                  ? "Checking credentials"
                  : voice.configured
                    ? "Gnani connected"
                    : "Captions only"}
              </p>
              <span
                className={cx(
                  "rounded-full border px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.08em]",
                  voice.configured
                    ? "border-signal/40 bg-signal/10 text-ink/60"
                    : "border-line text-muted"
                )}
              >
                {voice.checking ? "checking" : voice.configured ? "live voice" : "captions only"}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              {voice.configured
                ? "Your Gnani key is stored server-side only. Every speech request passes through authenticated Next.js routes, so the key never reaches the browser."
                : "Calls use authored scripts and the rules engine. Add GNANI_API_KEY to .env.local and restart the server to switch on spoken callers and voice replies."}
            </p>
            <div className="mt-3 space-y-1.5 border-t border-line pt-2.5">
              <div className="flex items-center justify-between text-[9px] text-muted">
                <span>Text-to-speech</span>
                <span className="font-medium text-ink/60">
                  {voice.configured ? voice.ttsModel ?? "Timbre" : "Not configured"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-muted">
                <span>Speech-to-text</span>
                <span className="font-medium text-ink/60">
                  {voice.configured ? voice.sttModel ?? "Prisma" : "Not configured"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-signal/25 bg-signal/[0.05] p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Language note
            </p>
            <label htmlFor="assistant-language" className="sr-only">
              Assistant language
            </label>
            <select
              id="assistant-language"
              value={assistant.language}
              onChange={(event) => updateAssistant({ language: event.target.value })}
              className="input-base mt-2 h-9 py-0 text-[11.5px]"
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[9px] leading-relaxed text-muted">
              Sets the language for voice recognition and the scripted call. Spoken audio uses
              Gnani&apos;s automatic language detection; simulated scripts are in English.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3">
        <p className="text-[10px] text-muted">
          Changes save automatically to this browser. No settings are sent to a server.
        </p>
        <Button variant="outline" size="sm" onClick={resetGreeting}>
          <RotateCcw className="h-3 w-3" />
          Restore default greeting
        </Button>
      </div>
    </div>
  );
}
