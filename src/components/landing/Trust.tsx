import { Check, Lock, ShieldCheck, UserCheck } from "lucide-react";

const principles = [
  {
    icon: UserCheck,
    title: "The AI never makes the final call",
    body: "It asks questions, collects signals, and writes a summary. Accepting, rejecting, taking over, or blocking is always your action.",
  },
  {
    icon: ShieldCheck,
    title: "Signals are not accusations",
    body: "A high-risk label means the conversation matched known scam patterns. It is not a determination that a crime occurred.",
  },
  {
    icon: Lock,
    title: "Your data stays on your device",
    body: "This prototype stores calls, settings, and blocklist entries in local storage. Nothing is uploaded to a server.",
  },
];

export function Trust() {
  return (
    <section id="security" className="bg-ink text-ivory">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-micro text-ivory/40">
              Control &amp; trust
            </p>
            <h2 className="mt-4 max-w-[520px] text-[36px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[52px]">
              You stay in control. <span className="text-signal">Always.</span>
            </h2>
            <p className="mt-5 max-w-[480px] text-[14px] leading-[1.75] text-ivory/55">
              CallShield is designed to inform a decision, not replace it. Nothing is forwarded,
              approved, or blocked without an action from you — and every decision is reversible.
            </p>

            <div className="mt-10 space-y-0 border-t border-white/10">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div key={principle.title} className="flex gap-4 border-b border-white/10 py-5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" strokeWidth={1.8} />
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-ivory/90">{principle.title}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ivory/45">
                        {principle.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:pt-14">
            <div className="border border-white/12 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ivory/35">
                    Screening complete
                  </p>
                  <p className="mt-1.5 font-display text-[19px] font-medium">High Risk</p>
                </div>
                <span className="rounded-full border border-signal/40 bg-signal/10 px-2.5 py-1 text-[10px] font-semibold text-signal">
                  5 signals
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  "Asked for a one-time password",
                  "Could not provide a case reference",
                  "Threatened account suspension",
                ].map((signal) => (
                  <div key={signal} className="flex items-center gap-2.5 text-[12px] text-ivory/60">
                    <span className="h-1 w-1 shrink-0 bg-signal" />
                    {signal}
                  </div>
                ))}
              </div>

              <p className="mt-4 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-ivory/35">
                AI recommendation: do not share information. Verify through an official number.
              </p>

              <p className="mt-5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ivory/30">
                Your decision
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled
                  className="flex h-10 cursor-default items-center justify-center gap-1.5 rounded-full border border-white/20 text-[11px] font-medium text-ivory/80"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Take over
                </button>
                <button
                  type="button"
                  disabled
                  className="flex h-10 cursor-default items-center justify-center gap-1.5 rounded-full border border-white/20 text-[11px] font-medium text-ivory/50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Allow
                </button>
                <button
                  type="button"
                  disabled
                  className="flex h-10 cursor-default items-center justify-center rounded-full bg-signal text-[11px] font-semibold text-ink"
                >
                  Block
                </button>
              </div>
              <p className="mt-3 text-center text-[9.5px] text-ivory/25">
                Preview only · decisions are made inside the dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
