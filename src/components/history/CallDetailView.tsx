"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Check,
  Clock,
  FileText,
  Fingerprint,
  History,
  Info,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { ActionTag } from "@/components/app/ActionTag";
import { useCallShield } from "@/lib/store";
import { formatClock, formatDateTime, formatDuration } from "@/lib/format";
import { RISK_META } from "@/lib/risk";
import type { Speaker } from "@/lib/types";
import { cx } from "@/lib/utils";

const speakerLabel: Record<Speaker, string> = {
  ai: "CallShield AI",
  caller: "Unknown caller",
  user: "You",
  system: "System",
};

function normalize(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function CallDetailView({ id }: { id: string }) {
  const { calls, blocklist, addBlockedNumber, hydrated } = useCallShield();
  const call = calls.find((item) => item.id === id);

  if (!call) {
    if (!hydrated) {
      return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-4 w-28 animate-pulse rounded bg-ink/10" />
          <div className="mt-4 h-8 w-72 animate-pulse rounded bg-ink/10" />
          <div className="mt-6 h-[320px] animate-pulse rounded-xl border border-line bg-paper" />
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 py-16 sm:px-6">
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title="Call record not found"
          description="This call isn't in your account history. It may have been cleared, or it was saved on another device."
          action={<ButtonLink href="/app/history" variant="outline">Back to call history</ButtonLink>}
        />
      </div>
    );
  }

  const alreadyBlocked = blocklist.some(
    (item) => normalize(item.number) === normalize(call.number)
  );

  function blockNumber() {
    if (!call || alreadyBlocked) return;
    addBlockedNumber({
      number: call.number,
      label: call.claimedOrg ?? call.callerName ?? "Unknown caller",
      reason: call.indicators.length
        ? `Blocked from call history: ${call.indicators
            .slice(0, 2)
            .map((indicator) => indicator.label.toLowerCase())
            .join("; ")}.`
        : "Blocked from call history after review.",
      source: "call",
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Link
        href="/app/history"
        className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-ink/45 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" />
        Call history
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex items-start gap-3.5">
          <CallerAvatar name={call.callerName} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em] sm:text-[30px]">
                {call.number}
              </h2>
              <RiskBadge level={call.riskLevel} />
              <ActionTag action={call.action} />
            </div>
            <p className="mt-2 text-[12px] text-muted">
              {call.callerName ?? "Unknown caller"}
              {call.claimedOrg ? ` · claims ${call.claimedOrg}` : " · no organisation claimed"}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
              <span>{formatDateTime(call.startedAt)}</span>
              <span className="h-2.5 w-px bg-ink/15" />
              <span>{formatDuration(call.durationSec)}</span>
              <span className="h-2.5 w-px bg-ink/15" />
              <span>{call.liveScreened ? "Screened by AI assistant" : "Declined before screening"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {alreadyBlocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3 py-2 text-[11px] font-medium text-ivory">
              <Ban className="h-3 w-3" />
              Number blocked
            </span>
          ) : (
            <Button variant="primary" onClick={blockNumber}>
              <Ban className="h-3.5 w-3.5" />
              Block this number
            </Button>
          )}
          <Link
            href="/app/blocklist"
            className="rounded-full border border-line bg-paper px-3 py-2 text-[11px] font-medium text-ink/55 transition-colors hover:border-ink/25 hover:text-ink"
          >
            View blocklist
          </Link>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[12.5px] font-semibold">Full transcript</h3>
            </div>
            <span className="text-[9.5px] text-muted">
              {call.transcript.length} lines · simulated
            </span>
          </div>

          {call.transcript.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <PhoneOff className="mx-auto h-5 w-5 text-ink/20" />
              <p className="mt-3 text-[12px] font-medium">No conversation took place</p>
              <p className="mt-1 text-[10.5px] text-muted">
                The call was declined before the assistant answered.
              </p>
            </div>
          ) : (
            <div className="space-y-4 px-4 py-4">
              {call.transcript.map((entry) => {
                const isAi = entry.speaker === "ai";
                const isUser = entry.speaker === "user";
                if (entry.speaker === "system") {
                  return (
                    <div key={entry.id} className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-line" />
                      <p className="max-w-[85%] text-center text-[9px] text-muted">{entry.text}</p>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  );
                }
                return (
                  <div key={entry.id} className={cx("flex gap-2.5", !isAi && !isUser && "flex-row-reverse")}>
                    <span
                      className={cx(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold",
                        isAi && "border-signal/40 bg-signal/10 text-signal",
                        isUser && "border-ink bg-ink text-ivory",
                        !isAi && !isUser && "border-line bg-ash text-ink/50"
                      )}
                    >
                      {isAi ? "AI" : isUser ? "You" : "?"}
                    </span>
                    <div className={cx("max-w-[85%]", !isAi && !isUser && "text-right")}>
                      <div className={cx("mb-1 flex items-baseline gap-2", !isAi && !isUser && "justify-end")}>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                          {speakerLabel[entry.speaker]}
                        </span>
                        <span className="font-display text-[8.5px] tabular-nums text-ink/25">
                          {formatClock(entry.at)}
                        </span>
                      </div>
                      <div
                        className={cx(
                          "rounded-lg border px-3 py-2.5 text-left text-[12px] leading-relaxed",
                          isAi && "rounded-tl-none border-line bg-white text-ink/80",
                          isUser && "rounded-tl-none border-ink/20 bg-signal/[0.08] text-ink/80",
                          !isAi && !isUser && "rounded-tr-none border-line bg-ash/70 text-ink/75"
                        )}
                      >
                        {entry.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-line bg-white/50 px-4 py-2.5">
            <p className="text-[9px] text-muted">
              Transcript captured during a simulated call. No audio was recorded.
            </p>
          </div>
        </section>

        <div className="space-y-3">
          <section className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-signal" />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                AI summary
              </h3>
            </div>
            <p className="mt-2 border-l-2 border-signal/50 pl-3 text-[11.5px] leading-[1.75] text-ink/70">
              {call.summary || "No summary was generated for this call."}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
              <span className="text-[9px] uppercase tracking-[0.1em] text-muted">Intent</span>
              <span className="text-[10.5px] font-medium text-ink/70">{call.intent}</span>
            </div>
            <p className="mt-2 text-[8.5px] leading-relaxed text-muted">
              Signal-based assessment, not proof of fraud.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-ink/40" />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Risk assessment
                </h3>
              </div>
              <RiskBadge level={call.riskLevel} showIcon={false} />
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
              {RISK_META[call.riskLevel].description}
            </p>

            <div className="mt-3 space-y-2.5">
              {call.indicators.length === 0 ? (
                <p className="rounded border border-dashed border-line px-3 py-2.5 text-[10px] text-muted">
                  No suspicious signals were recorded in this conversation.
                </p>
              ) : (
                call.indicators.map((indicator) => (
                  <div key={indicator.key} className="flex items-start gap-2.5">
                    <span className="mt-1 flex shrink-0 gap-[2px]" aria-hidden="true">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className={cx(
                            "h-2.5 w-[2px]",
                            level <= indicator.severity ? "bg-signal" : "bg-ink/10"
                          )}
                        />
                      ))}
                    </span>
                    <div>
                      <p className="text-[11px] font-medium leading-snug text-ink/75">
                        {indicator.label}
                      </p>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                        {indicator.detail}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {call.infoRequested.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Information requested
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {call.infoRequested.map((item) => (
                    <span
                      key={item}
                      className="border border-line bg-white px-2 py-1 text-[9px] text-ink/55"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Caller identity
              </h3>
            </div>
            <p className="mt-2 text-[11.5px] font-medium text-ink/75">
              {call.callerName ?? "Name not provided"}
            </p>
            <p className="text-[10px] text-muted">
              {call.claimedOrg ?? "No organisation claimed"}
            </p>
            <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-ink/[0.06]">
              <div
                className="h-full bg-ink/50"
                style={{ width: `${Math.max(2, call.identityConfidence)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[9px] text-muted">
              {call.identityConfidence}% confidence · self-reported claims, not verified
            </p>
          </section>

          <section className="rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Event timeline
              </h3>
            </div>
            <div className="mt-3 space-y-0">
              {call.events.map((event, index) => (
                <div key={event.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                  {index < call.events.length - 1 && (
                    <span className="absolute left-[3px] top-2 h-full w-px bg-line" aria-hidden="true" />
                  )}
                  <span
                    className={cx(
                      "relative mt-1 h-[7px] w-[7px] shrink-0 rounded-full",
                      event.tone === "signal" && "bg-signal",
                      event.tone === "positive" && "bg-ink",
                      (!event.tone || event.tone === "neutral") && "border border-ink/30 bg-paper"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-medium text-ink/75">{event.label}</p>
                    <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-xl border border-line bg-white/70 p-4">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-ink/40" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Final action
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <ActionTag action={call.action} />
              <span className="text-[9px] text-muted">{formatDateTime(call.startedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
