"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, PhoneIncoming, PhoneOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LiveSession, Scenario } from "@/lib/types";

export function IncomingCall({
  session,
  scenario,
  screeningEnabled,
  onAnswer,
  onDecline,
}: {
  session: LiveSession;
  scenario: Scenario;
  screeningEnabled: boolean;
  onAnswer: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-10 text-center text-ivory sm:px-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-[320px] w-[320px] animate-ring-pulse rounded-full border border-signal/20" />
          <span
            className="absolute h-[440px] w-[440px] animate-ring-pulse rounded-full border border-white/[0.06]"
            style={{ animationDelay: "0.7s" }}
          />
          <span className="absolute h-[560px] w-[560px] rounded-full border border-white/[0.04]" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ring-pulse rounded-full bg-signal" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ivory/50">
              Incoming simulated call
            </p>
          </div>

          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
            className="mx-auto mt-7 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.05]"
          >
            <PhoneIncoming className="h-7 w-7 text-signal" strokeWidth={1.7} />
          </motion.div>

          <h2 className="mt-5 font-display text-[30px] font-medium leading-none tracking-[-0.03em] sm:text-[38px]">
            {scenario.number}
          </h2>
          <p className="mt-2.5 text-[12.5px] text-ivory/45">
            Caller identity: Unknown · not in your contacts
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5">
            <span className="text-[9px] uppercase tracking-[0.12em] text-ivory/30">Demo scenario</span>
            <span className="h-2.5 w-px bg-white/15" />
            <span className="text-[10.5px] text-ivory/60">{scenario.name}</span>
          </div>

          <div className="mx-auto mt-6 flex max-w-[380px] items-center justify-center gap-2 text-[10.5px] text-ivory/40">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              Ringing
            </span>
            <span className="h-2.5 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              AI screening {screeningEnabled ? "ready" : "paused"}
            </span>
          </div>

          <div className="mx-auto mt-8 grid max-w-[430px] gap-2.5 sm:grid-cols-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onAnswer}
              className="w-full"
              disabled={!screeningEnabled}
            >
              <Bot className="h-4 w-4" />
              Let AI Answer
            </Button>
            <button
              type="button"
              onClick={onDecline}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/25 text-[14.5px] font-medium text-ivory transition-colors hover:border-white/50 hover:bg-white/[0.05]"
            >
              <PhoneOff className="h-4 w-4" />
              Decline Call
            </button>
          </div>

          {!screeningEnabled && (
            <p className="mx-auto mt-4 max-w-[380px] text-[10.5px] leading-relaxed text-signal/90">
              AI screening is turned off.{" "}
              <Link href="/app/assistant" className="underline underline-offset-4">
                Turn it on
              </Link>{" "}
              to answer with the assistant, or decline this call.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">
        This is a scripted demo call from a fictional caller. CallShield cannot access your phone
        or cellular network.{" "}
        <Link href="/app/live" className="text-ink/50 underline underline-offset-4">
          Live screening
        </Link>{" "}
        starts only after you answer.
      </p>
    </div>
  );
}
