"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Check,
  PhoneOff,
  Radio,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { TranscriptPanel } from "@/components/live/TranscriptPanel";
import { IntelligencePanel } from "@/components/live/IntelligencePanel";
import { formatClock } from "@/lib/format";
import type { LiveSession, Scenario } from "@/lib/types";

export function ScreeningRoom({
  session,
  scenario,
  onTakeOver,
  onAllow,
  onEnd,
  onBlock,
  onSend,
}: {
  session: LiveSession;
  scenario: Scenario;
  onTakeOver: () => void;
  onAllow: () => void;
  onEnd: () => void;
  onBlock: () => void;
  onSend: (text: string) => void;
}) {
  const handling = session.phase === "user";

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3 w-3" />
          Overview
        </Link>
        <div className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.12em] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            Simulated call in progress
          </span>
          <span className="h-2.5 w-px bg-ink/15" />
          <span>{scenario.category}</span>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3.5">
            <CallerAvatar name={session.callerName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-[21px] font-semibold leading-none tabular-nums tracking-[-0.02em] sm:text-[24px]">
                  {scenario.number}
                </h2>
                <RiskBadge level={session.riskLevel} />
                {handling ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-ink px-2 py-0.5 text-[9.5px] font-medium text-ivory">
                    <UserCheck className="h-2.5 w-2.5" />
                    You are handling
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-signal/30 bg-signal/[0.07] px-2 py-0.5 text-[9.5px] font-medium text-ink/60">
                    <Radio className="h-2.5 w-2.5 text-signal" />
                    AI screening
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11.5px] text-muted">
                {session.callerName ?? "Unknown caller"}
                {session.claimedOrg ? ` · claims ${session.claimedOrg}` : " · no organisation provided"}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[9.5px] text-muted">
                <ShieldAlert className="h-3 w-3 text-signal/70" />
                Scenario: {scenario.name} · fictional caller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-line pt-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <p className="label-micro">Duration</p>
              <p className="mt-1 font-display text-[24px] leading-none tabular-nums tracking-[-0.02em]">
                {formatClock(session.elapsedSec)}
              </p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="label-micro">Signals</p>
              <p className="mt-1 font-display text-[24px] leading-none tabular-nums tracking-[-0.02em]">
                {String(session.revealedIndicators.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>

        {handling && (
          <div className="mt-4 rounded-lg border border-signal/30 bg-signal/[0.07] px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-ink/70">
              You are now handling this call. The assistant has stopped speaking and is taking
              notes for the final summary.
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-4 lg:max-w-[640px]">
          <Button variant="ink" onClick={onTakeOver} disabled={handling} className="w-full">
            <UserCheck className="h-3.5 w-3.5" />
            {handling ? "Handling call" : "Take Over Call"}
          </Button>
          <Button variant="quiet" onClick={onAllow} className="w-full">
            <Check className="h-3.5 w-3.5" />
            Allow Caller
          </Button>
          <Button variant="quiet" onClick={onEnd} className="w-full">
            <PhoneOff className="h-3.5 w-3.5" />
            End Call
          </Button>
          <Button variant="primary" onClick={onBlock} className="w-full">
            <Ban className="h-3.5 w-3.5" />
            Block Caller
          </Button>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <TranscriptPanel session={session} onSend={onSend} />
        </div>
        <div className="min-w-0">
          <IntelligencePanel session={session} scenario={scenario} />
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-[9.5px] leading-relaxed text-muted">
        AI assessments flag patterns, not proven fraud. Your decisions update the saved record and
        can be changed later from the blocklist or call history.
      </p>
    </div>
  );
}
