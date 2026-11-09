"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, PhoneIncoming, Radio, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SCENARIOS } from "@/lib/scenarios";
import { useCallShield } from "@/lib/store";
import { formatClock } from "@/lib/format";
import { cx } from "@/lib/utils";

const quickIds = ["bank-impersonation", "kyc-expiry", "prize-claim"];

export function LivePanel({ onOpenPicker }: { onOpenPicker: () => void }) {
  const { session, startSimulation, assistant } = useCallShield();
  const router = useRouter();
  const active = Boolean(session && session.phase !== "ended");
  const latestLine = session?.transcript.at(-1);

  function quickStart(id: string) {
    if (startSimulation(id)) router.push("/app/live");
  }

  return (
    <section className="relative overflow-hidden rounded-xl bg-ink p-5 text-ivory sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px]">
        <span className="absolute inset-0 rounded-full border border-white/[0.07]" />
        <span className="absolute inset-10 rounded-full border border-white/[0.06]" />
        <span className="absolute inset-20 rounded-full border border-white/[0.05]" />
        <span className="absolute inset-[112px] rounded-full bg-signal/10" />
        <span className="absolute inset-[128px] animate-ring-pulse rounded-full bg-signal" />
        <span className="absolute inset-[136px] rounded-full bg-signal" />
      </div>

      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div className="max-w-[430px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              {active && <span className="absolute inline-flex h-full w-full animate-ring-pulse rounded-full bg-signal" />}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory/45">
              {active ? "Live screening" : "Live screening · ready"}
            </span>
            <span className="border border-white/15 px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.12em] text-ivory/35">
              Simulated
            </span>
          </div>

          {active && session ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-[24px] font-medium tracking-[-0.03em]">
                  {session.callerName ?? "Unknown caller"}
                </h2>
                <RiskBadge level={session.riskLevel} />
              </div>
              <p className="mt-1 font-display text-[12.5px] tabular-nums text-ivory/45">
                {SCENARIOS.find((item) => item.id === session.scenarioId)?.number} ·{" "}
                {formatClock(session.elapsedSec)}
              </p>
              {latestLine && (
                <div className="mt-4 border-l border-signal/40 pl-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ivory/30">
                    {latestLine.speaker === "caller" ? "Caller" : latestLine.speaker === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ivory/55">
                    {latestLine.text}
                  </p>
                </div>
              )}
              <ButtonLink href="/app/live" variant="primary" size="sm" className="mt-5">
                <Radio className="h-3.5 w-3.5" />
                Return to screening
              </ButtonLink>
            </>
          ) : (
            <>
              <h2 className="mt-4 max-w-[380px] font-display text-[25px] font-medium leading-[1.12] tracking-[-0.03em]">
                Unknown caller? Let the assistant answer first.
              </h2>
              <p className="mt-2 max-w-[390px] text-[12px] leading-relaxed text-ivory/45">
                Start a scripted scenario and watch the assistant collect identity, intent, and
                risk signals in real time.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {quickIds.map((id) => {
                  const scenario = SCENARIOS.find((item) => item.id === id);
                  if (!scenario) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => quickStart(id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1.5 text-[10.5px] text-ivory/60 transition-colors hover:border-white/30 hover:text-ivory"
                    >
                      <span
                        className={cx(
                          "h-1 w-1 rounded-full",
                          scenario.expectedRisk === "low" ? "bg-ivory/40" : "bg-signal"
                        )}
                      />
                      {scenario.category.replace(" fraud", "")}
                    </button>
                  );
                })}
                <span className="text-[9.5px] text-ivory/25">+3 more</span>
              </div>

              <div className="mt-5">
                <Button variant="primary" onClick={onOpenPicker}>
                  <PhoneIncoming className="h-4 w-4" />
                  Simulate Incoming Call
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 hidden w-[150px] shrink-0 sm:block">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-ivory/30">
              Shield status
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ivory/75">
              <ShieldCheck className="h-3 w-3 text-signal" />
              {assistant.screeningEnabled ? "Screening on" : "Screening paused"}
            </p>
            <p className="mt-1 text-[9.5px] leading-relaxed text-ivory/30">
              You approve every outcome.
            </p>
          </div>
          <Link
            href="/app/history?risk=high"
            className="mt-2 flex items-center justify-between border border-white/10 px-3 py-2 text-[10px] text-ivory/45 transition-colors hover:border-white/25 hover:text-ivory/80"
          >
            View reports
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <p className="relative mt-6 border-t border-white/10 pt-3 text-[9px] uppercase tracking-[0.12em] text-ivory/25">
        No cellular interception · scripted demo callers · reversible actions
      </p>
    </section>
  );
}
