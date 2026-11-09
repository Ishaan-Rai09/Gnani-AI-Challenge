import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, Smartphone, Waves } from "lucide-react";
import { HeroCallDemo } from "@/components/landing/HeroCallDemo";
import { Button, ButtonLink } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="app-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-16 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-28 lg:pt-20">
        <div className="max-w-[600px]">
          <div className="inline-flex items-center gap-2 border border-ink/15 bg-paper/60 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-micro text-ink/60">
            <span className="h-1.5 w-1.5 bg-signal" />
            AI call screening · Interactive demo
          </div>

          <h1 className="mt-6 font-display text-[42px] font-bold leading-[0.98] tracking-[-0.045em] text-ink sm:text-[56px] lg:text-[62px]">
            Not every call deserves <span className="text-signal">your attention.</span>
          </h1>

          <p className="mt-6 max-w-[520px] text-[15px] leading-[1.75] text-ink/60 sm:text-base">
            Let your AI assistant screen unknown callers, understand their intent, and flag
            suspicious conversations — before they reach you.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/signin" variant="primary" size="lg" className="w-full sm:w-auto">
              Sign in to get started
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </a>
          </div>

          <p className="mt-4 text-[11.5px] text-muted">
            Free · sign in with Google to keep your calls and blocklist on your account.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5 text-[11px] text-ink/50">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-ink/40" />
              You approve every outcome
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-ink/40" />
              Installable PWA
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-ink/40" />
              Live transcript
            </span>
          </div>
        </div>

        <div className="relative lg:pl-2">
          <HeroCallDemo />
          <div className="mt-10 flex items-center justify-between text-[10.5px] text-muted sm:mt-12">
            <span>Product preview · fictional callers</span>
            <Link href="/signin" className="inline-flex items-center gap-1 font-medium text-ink/60 hover:text-ink">
              Open full experience
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
