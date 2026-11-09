import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ShieldMark } from "@/components/brand/Logo";

export function DemoCta() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between lg:py-20">
        <div className="flex items-start gap-5">
          <ShieldMark className="mt-1 hidden h-9 w-8 sm:block" />
          <div>
            <h2 className="max-w-[560px] text-[27px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[34px]">
              Unknown callers talk to your AI first.
              <span className="block text-ink/40">You decide who gets through.</span>
            </h2>
            <p className="mt-3 text-[12.5px] text-muted">
              Six realistic scenarios. Full transcripts. One decision that stays yours.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
          <ButtonLink href="/signin" variant="primary" size="lg">
            Sign in with Google
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <span className="text-[10.5px] text-muted">Free · simulated callers, no real telephony</span>
        </div>
      </div>
    </section>
  );
}
