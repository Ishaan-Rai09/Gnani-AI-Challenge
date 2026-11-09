import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Privacy, security & terms",
  description: "How the CallShield demo handles data, plus plain-language product terms and contact details.",
};

const sections = [
  {
    id: "privacy",
    title: "Privacy",
    body: [
      "This is a prototype. Call logs, transcripts, blocklist entries, settings, and notifications are stored in your browser's local storage on this device. They are not sent to a CallShield server.",
      "Simulated callers, phone numbers, and organisations are fictional. Do not enter real sensitive information into the demo. Clearing your browser storage removes everything CallShield saved.",
      "When a Gnani key is configured, caller and assistant lines are synthesised by Gnani, and any reply you record is sent to Gnani for transcription. CallShield does not store those audio clips; the resulting text stays in your browser. Without a key, no audio is captured or sent.",
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "CallShield does not access your phone, contacts, or cellular network, and there is no real call interception. The microphone is requested only when you tap Speak during a simulated call, so your reply can be transcribed. API credentials live in server-side environment variables and are never included in client code.",
      "The app ships as a Progressive Web App with a scoped service worker that caches static assets and an offline fallback. No API credentials are included in client-side code.",
      "Risk levels are heuristic signals based on the conversation, not verified findings. A 'High Risk' label does not prove fraud, and a 'Low Risk' label does not guarantee legitimacy.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [
      "Questions about the prototype, the design system, or a future integration can be directed to the project maintainer through the repository where this demo was built.",
      "CallShield is a demonstration product and does not operate a customer support line.",
    ],
  },
  {
    id: "terms",
    title: "Terms",
    body: [
      "This prototype is provided for demonstration purposes only, without warranties of any kind. It must not be used as the sole basis for a real safety or financial decision.",
      "No affiliation is claimed with any bank, telecom operator, courier, advisory firm, or government body. All caller identities and organisations in the demo are fictional.",
      "The AI assistant does not accept or reject calls on your behalf without an explicit action from you. All prototype actions are reversible.",
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-line">
        <div className="mx-auto flex h-[68px] w-full max-w-[900px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="CallShield home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink/60 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[760px] px-5 py-14 sm:px-8 sm:py-20">
        <p className="label-micro">CallShield · Prototype policy</p>
        <h1 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[46px]">
          Plain language, no fine print.
        </h1>
        <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-muted">
          CallShield is a simulated product prototype. These notes explain what the demo does with
          data, what it does not do, and where the limits are.
        </p>

        <div className="mt-10 flex flex-wrap gap-2 border-y border-line py-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-medium text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
            >
              {section.title}
            </a>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-[12px] tabular-nums text-signal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{section.title}</h2>
              </div>
              <div className="mt-4 space-y-3 border-l border-line pl-4 sm:ml-[26px] sm:pl-6">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[13.5px] leading-[1.8] text-ink/60">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border border-line bg-paper p-5">
          <p className="text-[11px] leading-relaxed text-muted">
            Last updated for the CallShield demo build. If this prototype is developed into a real
            product, these notes must be replaced with reviewed legal, privacy, and security
            documentation.
          </p>
        </div>
      </main>
    </div>
  );
}
