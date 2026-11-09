import {
  Ban,
  FileText,
  Fingerprint,
  History,
  MessagesSquare,
  Radar,
  ScanLine,
  UserCheck,
} from "lucide-react";
import { OrangeRule } from "@/components/landing/OrangeRule";

const features = [
  {
    icon: ScanLine,
    title: "AI call screening",
    body: "An assistant answers unknown numbers, introduces itself, and asks who is calling before anything reaches you.",
  },
  {
    icon: MessagesSquare,
    title: "Live conversation transcription",
    body: "Follow the exchange as it happens, with speaker labels and timestamps for every line.",
  },
  {
    icon: Radar,
    title: "Suspicious intent detection",
    body: "Credential requests, payment pressure, and impersonation signals are surfaced as they appear.",
  },
  {
    icon: Fingerprint,
    title: "Caller identity collection",
    body: "Names, organisations, and references are captured, with a confidence score that updates as claims are checked.",
  },
  {
    icon: UserCheck,
    title: "Real-time takeover",
    body: "Step into the conversation at any point. The assistant stops speaking and keeps taking notes.",
  },
  {
    icon: FileText,
    title: "Call summaries",
    body: "A plain-language report after every screening: intent, signals, what was requested, and what happened.",
  },
  {
    icon: History,
    title: "Complete call history",
    body: "Search, filter, and revisit full transcripts. Every decision is saved locally on your device.",
  },
  {
    icon: Ban,
    title: "Personal blocklist",
    body: "Block from live screening or history. Review the reason and remove a number whenever you change your mind.",
  },
];

export function Features() {
  return (
    <section id="product" className="relative">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="label-micro">The product</p>
            <h2 className="mt-3 max-w-[440px] text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[42px]">
              Everything between you and an unknown caller.
            </h2>
            <p className="mt-5 max-w-[390px] text-[13.5px] leading-relaxed text-muted">
              CallShield is not a spam label. It is a screening layer that gathers context, shows
              its reasoning, and hands the decision back to you.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <OrangeRule className="w-10" />
              <span className="text-[10px] font-semibold uppercase tracking-micro text-ink/50">
                Signal-based, never a verdict
              </span>
            </div>
          </div>

          <div className="border-l border-t border-line">
            <div className="grid sm:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative border-b border-r border-line bg-paper/40 px-6 py-7 transition-colors duration-200 hover:bg-paper sm:px-7"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center border border-line bg-white text-ink/70 transition-colors group-hover:border-ink/25 group-hover:text-ink">
                        <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                      </div>
                      <span className="font-display text-[10px] tabular-nums text-ink/25">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[14px] font-semibold text-ink">{feature.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{feature.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
