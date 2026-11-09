import { Bot, PhoneIncoming, SlidersHorizontal } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PhoneIncoming,
    title: "Unknown caller calls",
    body: "An unrecognised number reaches your line. Instead of ringing through, CallShield sends it to your assistant first.",
    preview: (
      <div className="flex items-center justify-between gap-3 border border-line bg-white px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink">
            <PhoneIncoming className="h-3.5 w-3.5 text-signal" />
          </div>
          <div>
            <p className="font-display text-[13px] font-medium leading-none">+91 80 4712 9931</p>
            <p className="mt-1 text-[9.5px] uppercase tracking-[0.12em] text-muted">Unknown caller</p>
          </div>
        </div>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
      </div>
    ),
  },
  {
    number: "02",
    icon: Bot,
    title: "AI screens the conversation",
    body: "Your assistant introduces itself, asks who is calling and why, then listens for credential, payment, and pressure signals.",
    preview: (
      <div className="space-y-1.5 border border-line bg-white px-3 py-2.5">
        <p className="text-[10px] leading-relaxed text-ink/70">
          <span className="mr-1.5 font-semibold text-signal">AI</span>
          Who&apos;s calling, and what is this regarding?
        </p>
        <p className="text-[10px] leading-relaxed text-ink/45">
          <span className="mr-1.5 font-semibold text-ink/40">Caller</span>
          I need the OTP to stop a pending debit…
        </p>
        <div className="flex gap-1 pt-1">
          <span className="border border-signal/30 bg-signal/10 px-1.5 py-0.5 text-[8.5px] text-signal">
            OTP request
          </span>
          <span className="border border-line px-1.5 py-0.5 text-[8.5px] text-muted">High risk</span>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    icon: SlidersHorizontal,
    title: "You decide what happens next",
    body: "Read the summary and signals, take over the call yourself, allow the caller, end the screening, or block the number.",
    preview: (
      <div className="border border-line bg-white px-3 py-2.5">
        <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">Your decision</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <span className="rounded-full bg-ink py-1 text-center text-[9px] font-medium text-ivory">Take over</span>
          <span className="rounded-full border border-line py-1 text-center text-[9px] font-medium text-ink/60">Allow</span>
          <span className="rounded-full bg-signal py-1 text-center text-[9px] font-medium text-ink">Block</span>
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-paper/50">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-[560px]">
            <p className="label-micro">How it works</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[40px]">
              Three steps. One decision that stays yours.
            </h2>
          </div>
          <p className="max-w-[310px] text-[13px] leading-relaxed text-muted">
            The assistant handles the awkward part — asking who is calling and why — so you can
            decide with context instead of guesswork.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={
                  index === 0
                    ? "md:pr-8"
                    : "md:border-l md:border-line md:pl-8 md:pr-8 lg:pl-10"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[13px] font-semibold tabular-nums text-signal">
                    {step.number}
                  </span>
                  <Icon className="h-4 w-4 text-ink/35" />
                </div>
                <div className="mt-8 border-t border-ink/15 pt-3">
                  <h3 className="text-[17px] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 min-h-[66px] text-[13px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                  <div className="mt-5">{step.preview}</div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 border-t border-line pt-4 text-[10.5px] uppercase tracking-[0.12em] text-muted">
          Prototype note — all calls and callers shown are simulated. CallShield does not intercept
          cellular calls in this demo.
        </p>
      </div>
    </section>
  );
}
