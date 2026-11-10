"use client";

import { AlertTriangle, ArrowRight, Bot, MessageSquareText, PhoneIncoming, Radar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SCENARIOS } from "@/lib/scenarios";
import { useCallShield } from "@/lib/store";
import { cx } from "@/lib/utils";

export function IdleLive({ onOpenPicker }: { onOpenPicker: () => void }) {
  const { startSimulation, assistant } = useCallShield();

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Live screening · simulated
          </p>
          <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">
            Your assistant is ready to pick up.
          </h2>
          <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-muted">
            Choose a scripted caller to simulate an incoming call. Nothing rings a real phone — the
            entire screening runs in this browser.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenPicker}>
          <PhoneIncoming className="h-4 w-4" />
          Simulate Incoming Call
        </Button>
      </div>

      {!assistant.screeningEnabled && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-signal/35 bg-signal/[0.07] px-4 py-3">
          <p className="flex items-center gap-2 text-[11.5px] text-ink/70">
            <AlertTriangle className="h-3.5 w-3.5 text-signal" />
            AI screening is paused. You can still start a simulation, but the assistant won&apos;t
            answer until you enable it.
          </p>
          <Link
            href="/app/assistant"
            className="text-[10.5px] font-semibold text-ink underline decoration-signal underline-offset-4"
          >
            Enable screening
          </Link>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="relative overflow-hidden rounded-xl bg-ink p-6 text-ivory sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-[340px] w-[340px]">
            <span className="absolute inset-0 rounded-full border border-white/[0.07]" />
            <span className="absolute inset-12 rounded-full border border-white/[0.06]" />
            <span className="absolute inset-24 rounded-full border border-white/[0.05]" />
            <span className="absolute inset-[132px] rounded-full bg-signal/10" />
            <span className="absolute inset-[148px] animate-ring-pulse rounded-full bg-signal" />
            <span className="absolute inset-[156px] rounded-full bg-signal" />
          </div>
          <div className="relative max-w-[470px]">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory/40">
              Simulated calling environment
            </p>
            <h3 className="mt-3 font-display text-[26px] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[30px]">
              Answer with an assistant, not with your guard up.
            </h3>
            <p className="mt-3 text-[12px] leading-relaxed text-ivory/45">
              Each scenario has a caller script, an intent classification, and a set of suspicious
              signals that reveal themselves as the conversation moves.
            </p>
            <Button variant="primary" className="mt-5" onClick={onOpenPicker}>
              Simulate Incoming Call
            </Button>
            <p className="mt-3 text-[9px] uppercase tracking-[0.12em] text-ivory/25">
              No cellular interception · reversible decisions
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-paper p-5">
          <p className="label-micro">What happens in a screening</p>
          <div className="mt-4 space-y-4">
            {[
              {
                icon: Bot,
                title: "The assistant answers",
                body: "Introduces itself on your behalf and asks who is calling.",
              },
              {
                icon: MessageSquareText,
                title: "The call is transcribed",
                body: "Speaker-labelled lines appear progressively with timestamps.",
              },
              {
                icon: Radar,
                title: "Signals are assessed",
                body: "Credential, payment, and pressure patterns are surfaced live.",
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white">
                    <Icon className="h-3.5 w-3.5 text-ink/50" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-semibold text-ink/80">{step.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[9px] leading-relaxed text-muted">
            The assistant never makes the final decision. You allow, block, take over, or end every
            call yourself.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold">Six scripted callers</h3>
            <p className="mt-1 text-[11px] text-muted">
              Fictional names, numbers, and organisations. Pick one to begin ringing.
            </p>
          </div>
          <span className="hidden text-[9px] uppercase tracking-[0.12em] text-muted sm:block">
            Simulated callers
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => startSimulation(scenario.id)}
              className="group flex h-full flex-col rounded-xl border border-line bg-paper p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lift"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {scenario.category}
                </span>
                <RiskBadge level={scenario.expectedRisk} showIcon={false} />
              </div>
              <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-ink">
                {scenario.name}
              </p>
              <p className="mt-1.5 flex-1 text-[10.5px] leading-relaxed text-muted">
                {scenario.blurb}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-line/80 pt-2.5">
                <span className="font-display text-[10.5px] tabular-nums text-ink/50">
                  {scenario.number}
                </span>
                <span
                  className={cx(
                    "inline-flex items-center gap-1 text-[10px] font-medium text-ink/40 transition-colors group-hover:text-ink"
                  )}
                >
                  Start
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 border-t border-line pt-3 text-[9.5px] text-muted">
        Calls are simulated in-browser for demonstration. CallShield does not claim to intercept or
        screen real cellular calls in this prototype.
      </p>
    </div>
  );
}
