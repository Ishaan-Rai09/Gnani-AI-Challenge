"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, History } from "lucide-react";
import { ActionTag } from "@/components/app/ActionTag";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { useCallShield } from "@/lib/store";
import { formatDuration, formatTime, relativeTime } from "@/lib/format";

export function RecentActivity() {
  const { calls, seedHistory } = useCallShield();
  const recent = [...calls]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[13.5px] font-semibold text-ink">Recent activity</h2>
          <span className="rounded-full border border-line px-1.5 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted">
            Simulated
          </span>
        </div>
        <Link
          href="/app/history"
          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink/50 transition-colors hover:text-ink"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <History className="h-5 w-5 text-ink/25" />
          <p className="mt-3 text-[13px] font-semibold">No screened calls yet</p>
          <p className="mt-1 max-w-xs text-[11.5px] text-muted">
            Load sample calls to explore transcripts, summaries, and decisions.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={seedHistory}>
            Try Sample Calls
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1.6fr)_110px_70px_86px_82px_16px] items-center gap-3 border-b border-line/70 bg-white/40 px-5 py-2 md:grid">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Caller</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Risk</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Length</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Action</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">When</span>
            <span />
          </div>

          <div className="divide-y divide-line/70">
            {recent.map((call) => (
              <Link
                key={call.id}
                href={`/app/history/${call.id}`}
                className="table-row-hover block px-4 py-3 sm:px-5"
              >
                <div className="hidden grid-cols-[minmax(0,1.6fr)_110px_70px_86px_82px_16px] items-center gap-3 md:grid">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CallerAvatar name={call.callerName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-[12px] font-medium tabular-nums text-ink">
                        {call.number}
                      </p>
                      <p className="truncate text-[10px] text-muted">
                        {call.callerName ?? call.claimedOrg ?? "Unknown caller"}
                      </p>
                    </div>
                  </div>
                  <RiskBadge level={call.riskLevel} showIcon={false} />
                  <span className="font-display text-[11px] tabular-nums text-ink/55">
                    {formatDuration(call.durationSec)}
                  </span>
                  <ActionTag action={call.action} />
                  <span className="text-[10px] text-muted">{relativeTime(call.startedAt)}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-ink/25" />
                </div>

                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CallerAvatar name={call.callerName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[12px] font-medium tabular-nums text-ink">
                          {call.number}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-muted">
                          {call.callerName ?? call.claimedOrg ?? "Unknown caller"}
                        </p>
                      </div>
                    </div>
                    <RiskBadge level={call.riskLevel} showIcon={false} />
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[9.5px] text-muted">
                    <span className="flex items-center gap-2">
                      <ActionTag action={call.action} />
                      <span>{formatDuration(call.durationSec)}</span>
                    </span>
                    <span>{formatTime(call.startedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-line/70 bg-white/40 px-5 py-2.5">
            <p className="text-[9.5px] text-muted">
              Stored locally on this device · transcripts and decisions are fully reversible
            </p>
          </div>
        </>
      )}
    </section>
  );
}
