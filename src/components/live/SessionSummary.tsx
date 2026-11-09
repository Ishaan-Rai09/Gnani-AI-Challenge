"use client";

import Link from "next/link";
import { ArrowRight, Ban, Check, PhoneOff, RotateCcw, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { toIndicators } from "@/lib/risk";
import { formatDuration } from "@/lib/format";
import type { CallAction, LiveSession, Scenario } from "@/lib/types";

const OUTCOME: Record<CallAction, { label: string; icon: typeof Check }> = {
  blocked: { label: "Caller blocked", icon: Ban },
  allowed: { label: "Caller allowed", icon: Check },
  ended: { label: "Screening ended", icon: PhoneOff },
  declined: { label: "Call declined", icon: PhoneOff },
};

export function SessionSummary({
  session,
  scenario,
  onRestart,
}: {
  session: LiveSession;
  scenario: Scenario;
  onRestart: () => void;
}) {
  const outcome = OUTCOME[session.outcome ?? "ended"];
  const Icon = outcome.icon;
  const indicators = toIndicators(session.revealedIndicators);
  const declined = session.outcome === "declined";
  const summary = declined
    ? `The simulated call from ${scenario.number} was declined before the assistant answered. No conversation took place and no information was shared.`
    : scenario.summary;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
        <ShieldCheck className="h-3.5 w-3.5" />
        Screening complete · saved to history
      </div>
      <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[32px]">
        A decision was recorded.
      </h2>
      <p className="mt-1.5 text-[12.5px] text-muted">
        The transcript, signals, and your final action are stored locally on this device.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-line bg-paper p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <CallerAvatar name={session.callerName} size="lg" />
              <div>
                <p className="font-display text-[20px] font-semibold leading-none tabular-nums">
                  {scenario.number}
                </p>
                <p className="mt-1.5 text-[11px] text-muted">
                  {session.callerName ?? "Unknown caller"}
                  {scenario.claimedOrg ? ` · ${scenario.claimedOrg}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={session.riskLevel} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-2.5 py-1 text-[10px] font-medium text-ivory">
                <Icon className="h-3 w-3" />
                {outcome.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-line py-4 sm:grid-cols-4">
            <div>
              <p className="label-micro">Duration</p>
              <p className="mt-1 font-display text-[16px] tabular-nums">
                {formatDuration(session.elapsedSec)}
              </p>
            </div>
            <div>
              <p className="label-micro">Signals</p>
              <p className="mt-1 font-display text-[16px] tabular-nums">
                {String(indicators.length).padStart(2, "0")}
              </p>
            </div>
            <div>
              <p className="label-micro">Transcript</p>
              <p className="mt-1 font-display text-[16px] tabular-nums">
                {session.transcript.length} lines
              </p>
            </div>
            <div>
              <p className="label-micro">Intent</p>
              <p className="mt-1 truncate text-[11px] font-medium text-ink/70">
                {declined ? "Not screened" : scenario.intentLabel}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <p className="label-micro">AI summary</p>
            <p className="mt-2 border-l-2 border-signal/50 pl-3 text-[12px] leading-[1.75] text-ink/70">
              {summary}
            </p>
            <p className="mt-2 text-[9px] text-muted">
              Signal-based summary, not a fraud determination.
            </p>
          </div>

          {indicators.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="label-micro">Recorded signals</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {indicators.map((indicator) => (
                  <span
                    key={indicator.key}
                    className="border border-line bg-white px-2 py-1 text-[9.5px] text-ink/60"
                  >
                    {indicator.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-paper p-5">
            <p className="label-micro">What happens now</p>
            <p className="mt-2 text-[12px] leading-relaxed text-ink/65">
              {session.outcome === "blocked"
                ? "This number is on your blocklist. You can remove it at any time, and the full transcript is available in call history."
                : session.outcome === "allowed"
                ? "The caller is marked as trusted for this simulation. Their transcript and your decision are saved."
                : "The report is saved. Nothing was shared with the caller by the assistant, and every decision can be revisited."}
            </p>

            <div className="mt-4 space-y-2">
              <ButtonLink href={`/app/history/${session.id}`} variant="ink" className="w-full">
                View full report
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
              <Button variant="outline" className="w-full" onClick={onRestart}>
                <RotateCcw className="h-3.5 w-3.5" />
                Start another simulation
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3 text-[10px] font-medium">
              <Link href="/app/history" className="text-ink/50 hover:text-ink">
                Call history
              </Link>
              {session.outcome === "blocked" && (
                <Link href="/app/blocklist" className="text-ink/50 hover:text-ink">
                  Blocklist
                </Link>
              )}
              <Link href="/app" className="text-ink/50 hover:text-ink">
                Overview
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-signal/25 bg-signal/[0.05] p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Prototype reminder
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink/55">
              This call was simulated. CallShield does not intercept real cellular calls, and the
              caller is fictional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
