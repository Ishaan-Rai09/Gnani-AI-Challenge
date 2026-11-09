"use client";

import Link from "next/link";
import { ArrowUpRight, Ban, Bot, Radar } from "lucide-react";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { Toggle } from "@/components/ui/Toggle";
import { useCallShield } from "@/lib/store";
import { formatDate } from "@/lib/format";

const CATEGORIES = [
  { key: "Credential request", short: "Credential" },
  { key: "Financial pressure", short: "Payment" },
  { key: "Coercion", short: "Pressure" },
  { key: "Identity", short: "Identity" },
] as const;

export function ShieldRail() {
  const { calls, blocklist, assistant, updateAssistant } = useCallShield();

  const counts = CATEGORIES.map((category) => ({
    ...category,
    count: calls.reduce(
      (sum, call) =>
        sum + call.indicators.filter((indicator) => indicator.category === category.key).length,
      0
    ),
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));
  const totalSignals = counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-w-0 space-y-3">
      <section className="rounded-xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-ink/40" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              AI assistant
            </h2>
          </div>
          <Toggle
            size="sm"
            checked={assistant.screeningEnabled}
            onChange={(value) => updateAssistant({ screeningEnabled: value })}
            label="Toggle AI call screening"
          />
        </div>

        <p className="mt-3 text-[12.5px] font-semibold text-ink">
          {assistant.screeningEnabled ? "Screening unknown callers" : "Screening paused"}
        </p>
        <p className="mt-0.5 text-[10.5px] text-muted">
          {assistant.screeningEnabled
            ? `${assistant.screeningMode} mode · ${assistant.language}`
            : "Unknown callers will ring through until you turn this back on."}
        </p>

        <div className="mt-3 rounded-lg border border-line bg-white/70 px-3 py-2.5">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-ink/30">
            Live greeting
          </p>
          <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-ink/60">
            &ldquo;{assistant.greeting}&rdquo;
          </p>
        </div>

        <Link
          href="/app/assistant"
          className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium text-ink/50 transition-colors hover:text-ink"
        >
          Configure assistant
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </section>

      <section className="rounded-xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="h-3.5 w-3.5 text-ink/40" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Signal mix
            </h2>
          </div>
          <span className="font-display text-[13px] tabular-nums text-ink/60">{totalSignals}</span>
        </div>
        <p className="mt-1 text-[9.5px] text-muted">Across all screened calls</p>

        <div className="mt-3 space-y-2.5">
          {counts.map((item, index) => (
            <div key={item.key}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-ink/60">{item.short}</span>
                <span className="tabular-nums text-muted">{item.count}</span>
              </div>
              <div className="mt-1 h-[3px] w-full overflow-hidden bg-ink/[0.06]">
                <div
                  className={index === 0 ? "h-full bg-signal" : "h-full bg-ink/30"}
                  style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-line/70 pt-2 text-[9px] leading-relaxed text-muted">
          Heuristic signals, not confirmed fraud.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="h-3.5 w-3.5 text-ink/40" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Blocklist
            </h2>
          </div>
          <span className="font-display text-[15px] tabular-nums text-ink/70">{blocklist.length}</span>
        </div>

        <div className="mt-3 space-y-2">
          {blocklist.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              <CallerAvatar name={item.label} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[10.5px] tabular-nums text-ink/80">
                  {item.number}
                </p>
                <p className="truncate text-[9px] text-muted">
                  {item.label} · {formatDate(item.blockedAt)}
                </p>
              </div>
            </div>
          ))}
          {blocklist.length === 0 && (
            <p className="text-[10.5px] text-muted">No numbers blocked.</p>
          )}
        </div>

        <Link
          href="/app/blocklist"
          className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium text-ink/50 transition-colors hover:text-ink"
        >
          Manage blocklist
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </section>
    </div>
  );
}
