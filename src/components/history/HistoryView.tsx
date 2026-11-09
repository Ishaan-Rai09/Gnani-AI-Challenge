"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronRight,
  History,
  Search,
  X,
} from "lucide-react";
import { ActionTag } from "@/components/app/ActionTag";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCallShield } from "@/lib/store";
import { formatDateTime, formatDuration } from "@/lib/format";
import { RISK_META } from "@/lib/risk";
import type { RiskLevel } from "@/lib/types";
import { cx } from "@/lib/utils";

type RiskFilter = "all" | RiskLevel;

const FILTERS: Array<{ key: RiskFilter; label: string }> = [
  { key: "all", label: "All calls" },
  { key: "low", label: "Low Risk" },
  { key: "attention", label: "Needs Attention" },
  { key: "high", label: "High Risk" },
];

function validRisk(value?: string): RiskFilter {
  return value === "low" || value === "attention" || value === "high" ? value : "all";
}

export function HistoryView({ initialRisk }: { initialRisk?: string }) {
  const { calls, seedHistory } = useCallShield();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskFilter>(validRisk(initialRisk));
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const counts = useMemo(
    () => ({
      all: calls.length,
      low: calls.filter((call) => call.riskLevel === "low").length,
      attention: calls.filter((call) => call.riskLevel === "attention").length,
      high: calls.filter((call) => call.riskLevel === "high").length,
    }),
    [calls]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = calls.filter((call) => {
      if (risk !== "all" && call.riskLevel !== risk) return false;
      if (!needle) return true;
      return [call.number, call.callerName ?? "", call.claimedOrg ?? "", call.intent, call.summary]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return list.sort((a, b) => {
      const delta = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      return sort === "newest" ? delta : -delta;
    });
  }, [calls, query, risk, sort]);

  const hasFilters = query.trim().length > 0 || risk !== "all";

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Records · stored on this device
          </p>
          <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">
            Every screened call, on the record.
          </h2>
          <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-muted">
            Search transcripts and summaries, filter by assessed risk, and open any call for the
            full conversation and decision timeline.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted">
            {counts.all} calls
          </span>
          <Link
            href="/app/live"
            className="rounded-full border border-line bg-paper px-3 py-1.5 text-[10.5px] font-medium text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
          >
            Start a simulation
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-paper">
        <div className="border-b border-line p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search number, name, summary, or intent…"
                aria-label="Search screened calls"
                className="input-base h-9 py-0 pl-9 pr-9 text-[12px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-thin lg:flex-none">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setRisk(filter.key)}
                    aria-pressed={risk === filter.key}
                    className={cx(
                      "shrink-0 rounded-full border px-2.5 py-1.5 text-[10.5px] font-medium transition-colors",
                      risk === filter.key
                        ? "border-ink bg-ink text-ivory"
                        : "border-line bg-white text-ink/55 hover:border-ink/25 hover:text-ink"
                    )}
                  >
                    {filter.label}
                    <span
                      className={cx(
                        "ml-1.5 tabular-nums",
                        risk === filter.key ? "text-ivory/50" : "text-muted"
                      )}
                    >
                      {counts[filter.key]}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSort((value) => (value === "newest" ? "oldest" : "newest"))}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-[10.5px] font-medium text-ink/55 transition-colors hover:border-ink/25 hover:text-ink"
              >
                {sort === "newest" ? (
                  <ArrowDownWideNarrow className="h-3 w-3" />
                ) : (
                  <ArrowUpNarrowWide className="h-3 w-3" />
                )}
                {sort === "newest" ? "Newest first" : "Oldest first"}
              </button>
            </div>
          </div>
        </div>

        {calls.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="No calls on record"
            description="Screened calls, transcripts, and decisions will appear here. Load sample data to explore the experience."
            action={<Button onClick={seedHistory}>Try Demo Data</Button>}
            className="m-4 border-0 bg-transparent"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="No calls match those filters"
            description="Try a different search term or reset the risk filter to see the full record."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setRisk("all");
                }}
              >
                Clear filters
              </Button>
            }
            className="m-4 border-0 bg-transparent"
          />
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.05fr)_minmax(0,1.5fr)_108px_84px_78px_16px] items-center gap-4 border-b border-line/70 bg-white/40 px-4 py-2 lg:grid">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Caller</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">AI summary</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">When</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Risk</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Action</span>
              <span />
            </div>

            <div className="divide-y divide-line/70">
              {filtered.map((call) => (
                <Link
                  key={call.id}
                  href={`/app/history/${call.id}`}
                  className="table-row-hover block px-4 py-3.5"
                >
                  <div className="hidden grid-cols-[minmax(0,1.05fr)_minmax(0,1.5fr)_108px_84px_78px_16px] items-center gap-4 lg:grid">
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

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-ink/65">
                        {call.summary}
                      </p>
                      <p className="mt-0.5 text-[9px] text-muted">{call.intent}</p>
                    </div>

                    <div>
                      <p className="text-[10.5px] text-ink/60">{formatDateTime(call.startedAt)}</p>
                      <p className="mt-0.5 text-[9px] text-muted">{formatDuration(call.durationSec)}</p>
                    </div>

                    <RiskBadge level={call.riskLevel} showIcon={false} />

                    <ActionTag action={call.action} withIcon={false} />

                    <ChevronRight className="h-3.5 w-3.5 text-ink/25" />
                  </div>

                  <div className="lg:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CallerAvatar name={call.callerName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-display text-[12.5px] font-medium tabular-nums text-ink">
                            {call.number}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-muted">
                            {call.callerName ?? call.claimedOrg ?? "Unknown caller"}
                          </p>
                        </div>
                      </div>
                      <RiskBadge level={call.riskLevel} showIcon={false} />
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-[10.5px] leading-relaxed text-ink/60">
                      {call.summary}
                    </p>
                    <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[9.5px] text-muted">
                      <span className="flex items-center gap-2">
                        <ActionTag action={call.action} withIcon={false} />
                        <span>{formatDuration(call.durationSec)}</span>
                      </span>
                      <span>{formatDateTime(call.startedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 bg-white/40 px-4 py-2.5">
              <p className="text-[9.5px] text-muted">
                Showing {filtered.length} of {calls.length} calls
                {hasFilters ? " · filters applied" : ""}
              </p>
              <p className="text-[9px] uppercase tracking-[0.1em] text-muted">
                {risk === "all" ? "All risk levels" : RISK_META[risk].label}
              </p>
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-[9.5px] leading-relaxed text-muted">
        Risk classifications are heuristic assessments of conversation signals, not determinations
        that fraud occurred. All demo callers are fictional.
      </p>
    </div>
  );
}
