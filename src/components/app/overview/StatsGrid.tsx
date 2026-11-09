import { ArrowUpRight, Radar, ShieldCheck, BellRing } from "lucide-react";
import Link from "next/link";
import type { CallRecord } from "@/lib/types";

function buildWeek(calls: CallRecord[]): number[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    return calls.filter((call) => new Date(call.startedAt).toDateString() === key).length;
  });
}

export function StatsGrid({ calls }: { calls: CallRecord[] }) {
  const total = calls.length;
  const suspicious = calls.filter((call) => call.riskLevel !== "low").length;
  const handled = calls.filter(
    (call) =>
      call.action === "blocked" ||
      call.action === "allowed" ||
      call.action === "declined" ||
      (call.action === "ended" && call.riskLevel === "low")
  ).length;
  const attention = calls.filter(
    (call) => call.riskLevel !== "low" && call.action === "ended"
  ).length;
  const week = buildWeek(calls);
  const weekMax = Math.max(1, ...week);
  const lastWeekTotal = week.reduce((sum, value) => sum + value, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.45fr_1fr_1fr_1fr]">
      <div className="relative overflow-hidden rounded-xl bg-ink p-5 text-ivory">
        <div className="flex items-start justify-between">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory/40">
            Calls screened
          </p>
          <ArrowUpRight className="h-3.5 w-3.5 text-ivory/30" />
        </div>
        <p className="mt-5 font-display text-[44px] font-medium leading-none tabular-nums tracking-[-0.04em]">
          {total}
        </p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] text-ivory/35">Last 7 days</p>
            <p className="mt-0.5 text-[11px] font-medium text-ivory/70">{lastWeekTotal} simulated calls</p>
          </div>
          <div className="flex h-8 items-end gap-1" aria-hidden="true">
            {week.map((value, index) => (
              <span
                key={index}
                className={
                  index === week.length - 1
                    ? "w-[5px] bg-signal"
                    : "w-[5px] bg-ivory/20"
                }
                style={{ height: `${Math.max(3, (value / weekMax) * 32)}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="flex items-start justify-between">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Suspicious callers
          </p>
          <Radar className="h-3.5 w-3.5 text-ink/25" />
        </div>
        <p className="mt-5 font-display text-[34px] font-medium leading-none tabular-nums tracking-[-0.03em]">
          {suspicious}
        </p>
        <p className="mt-3 text-[10.5px] text-muted">
          {total ? `${Math.round((suspicious / total) * 100)}% of screened calls` : "No calls yet"}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="flex items-start justify-between">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Safely handled
          </p>
          <ShieldCheck className="h-3.5 w-3.5 text-ink/25" />
        </div>
        <p className="mt-5 font-display text-[34px] font-medium leading-none tabular-nums tracking-[-0.03em]">
          {handled}
        </p>
        <p className="mt-3 text-[10.5px] text-muted">Blocked, allowed, or declined</p>
      </div>

      <div className="relative rounded-xl border border-signal/35 bg-signal/[0.07] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink/55">
            Needs attention
          </p>
          <BellRing className="h-3.5 w-3.5 text-signal" />
        </div>
        <p className="mt-5 font-display text-[34px] font-medium leading-none tabular-nums tracking-[-0.03em]">
          {attention}
        </p>
        <Link
          href="/app/history"
          className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink/70 transition-colors hover:text-ink"
        >
          Review reports
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
