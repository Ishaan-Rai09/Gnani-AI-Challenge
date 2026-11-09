"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, PhoneIncoming, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { assessRisk, INDICATOR_CATALOG, RISK_META, toIndicators } from "@/lib/risk";
import type { IndicatorKey, Speaker } from "@/lib/types";
import { cx } from "@/lib/utils";

interface DemoLine {
  speaker: Speaker;
  text: string;
  reveals?: IndicatorKey[];
}

interface DemoScenario {
  id: string;
  tab: string;
  number: string;
  claimed: string;
  intent: string;
  confidence: number;
  lines: DemoLine[];
}

const DEMOS: DemoScenario[] = [
  {
    id: "bank",
    tab: "Bank scam",
    number: "+91 80 4712 9931",
    claimed: "Claims: Northbridge Bank fraud desk",
    intent: "Impersonated bank fraud check",
    confidence: 34,
    lines: [
      { speaker: "ai", text: "Hello, this is the call assistant. May I know who's calling and what this is regarding?" },
      { speaker: "caller", text: "Northbridge Bank fraud prevention. There's a ₹48,500 debit pending on your account.", reveals: ["institution_impersonation"] },
      { speaker: "ai", text: "What do you need from the account holder to verify this?" },
      { speaker: "caller", text: "The 16-digit card number and the OTP being sent now. Read them back and I'll stop the transaction.", reveals: ["banking_credentials", "otp_request"] },
      { speaker: "caller", text: "If this isn't done in ten minutes the account will be suspended.", reveals: ["account_suspension", "pressure_tactics"] },
    ],
  },
  {
    id: "kyc",
    tab: "KYC fraud",
    number: "+91 99714 22086",
    claimed: "Claims: TeleLink Mobile compliance",
    intent: "KYC expiration threat",
    confidence: 22,
    lines: [
      { speaker: "ai", text: "Hello, this is the call assistant. May I know who's calling and what this is regarding?" },
      { speaker: "caller", text: "TeleLink compliance. Your KYC expired yesterday — the number will be disconnected tonight." },
      { speaker: "ai", text: "Can you share an employee ID and a reference for this notice?" },
      { speaker: "caller", text: "No reference. Just your Aadhaar number and the OTP I'll trigger.", reveals: ["vague_identity", "otp_request"] },
      { speaker: "caller", text: "If the OTP fails, install QuickAssist so I can see your screen.", reveals: ["remote_access", "account_suspension"] },
    ],
  },
  {
    id: "prize",
    tab: "Prize scam",
    number: "+91 88267 45019",
    claimed: "Claims: National Reward Centre",
    intent: "Unsolicited prize claim",
    confidence: 15,
    lines: [
      { speaker: "ai", text: "Hello, this is the call assistant. May I know who's calling and what this is regarding?" },
      { speaker: "caller", text: "Congratulations! Your number has won ₹12,50,000 in our annual draw.", reveals: ["unrealistic_reward"] },
      { speaker: "ai", text: "The account holder didn't enter a draw. Could you share a claim reference?" },
      { speaker: "caller", text: "Reference NR-77219. The processing fee is ₹4,999 by gift card, then we transfer the prize.", reveals: ["urgent_payment", "vague_identity"] },
      { speaker: "caller", text: "Keep this confidential until the transfer — otherwise the claim is void.", reveals: ["secrecy_request"] },
    ],
  },
];

const LINE_INTERVAL = 2100;

export function HeroCallDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scenario = DEMOS[scenarioIndex];
  const shown = scenario.lines.slice(0, visible);
  const revealed = useMemo(
    () => shown.flatMap((line) => line.reveals ?? []),
    [shown]
  );
  const risk = assessRisk(revealed);
  const complete = visible >= scenario.lines.length;
  const elapsed = 8 + visible * 4;

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      if (visible < scenario.lines.length) {
        setVisible((value) => value + 1);
      } else {
        setScenarioIndex((value) => (value + 1) % DEMOS.length);
        setVisible(1);
      }
    }, complete ? 4200 : LINE_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [visible, scenario.lines.length, paused, complete, scenarioIndex]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible, scenarioIndex]);

  function selectScenario(index: number) {
    setScenarioIndex(index);
    setVisible(1);
  }

  function replay() {
    if (complete) {
      setVisible(1);
    } else {
      setVisible(scenario.lines.length);
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="absolute -right-3 -top-3 hidden h-full w-full rounded-2xl border border-signal/35 sm:block" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-2xl border border-ink bg-ink shadow-panel">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ring-pulse rounded-full bg-signal" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-micro text-ivory/70">
              Live screening
            </span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ivory/45">
              Simulated
            </span>
          </div>
          <span className="font-display text-[11px] tabular-nums text-ivory/45">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
              <PhoneIncoming className="h-4 w-4 text-signal" />
            </div>
            <div>
              <p className="font-display text-[20px] font-medium leading-none tracking-tight text-ivory">
                {scenario.number}
              </p>
              <p className="mt-1.5 text-[11px] text-ivory/45">{scenario.claimed}</p>
            </div>
          </div>
          <span
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold",
              risk.level === "high" && "border-signal/60 bg-signal/15 text-ivory",
              risk.level === "attention" && "border-signal/40 bg-signal/10 text-ivory",
              risk.level === "low" && "border-white/15 text-ivory/60"
            )}
          >
            {risk.level === "high" ? (
              <TriangleAlert className="h-3 w-3 text-signal" />
            ) : (
              <ShieldCheck className="h-3 w-3 text-ivory/50" />
            )}
            {RISK_META[risk.level].label}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="scrollbar-thin h-[224px] overflow-y-auto border-y border-white/10 px-5 py-4"
        >
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {shown.map((line, index) => (
                <motion.div
                  key={`${scenario.id}-${index}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cx("flex gap-3", line.speaker === "caller" && "flex-row-reverse")}
                >
                  <div
                    className={cx(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                      line.speaker === "ai"
                        ? "bg-signal text-ink"
                        : "border border-white/20 text-ivory/60"
                    )}
                  >
                    {line.speaker === "ai" ? <Bot className="h-3 w-3" /> : "C"}
                  </div>
                  <div
                    className={cx(
                      "max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed",
                      line.speaker === "ai"
                        ? "bg-white/[0.06] text-ivory/80"
                        : "border border-white/10 text-ivory/65"
                    )}
                  >
                    <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-ivory/35">
                      {line.speaker === "ai" ? "CallShield AI" : "Unknown caller"}
                    </span>
                    {line.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!complete && visible > 1 && (
              <div className="flex items-center gap-1.5 pl-8 pt-1" aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1 w-1 animate-pulse rounded-full bg-ivory/30"
                    style={{ animationDelay: `${dot * 160}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ivory/35">
                Caller intent
              </p>
              <p className="mt-1 text-[12.5px] text-ivory/80">{scenario.intent}</p>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ivory/35">
                Signals
              </p>
              <p className="mt-1 font-display text-[15px] tabular-nums text-ivory">
                {toIndicators(revealed).length.toString().padStart(2, "0")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex min-h-[24px] flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {toIndicators(revealed)
                .slice(-3)
                .map((indicator) => (
                  <motion.span
                    key={indicator.key}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded border border-signal/30 bg-signal/10 px-1.5 py-1 text-[9.5px] font-medium text-signal"
                  >
                    {INDICATOR_CATALOG[indicator.key].label}
                  </motion.span>
                ))}
            </AnimatePresence>
            {revealed.length === 0 && (
              <span className="text-[10.5px] text-ivory/30">Listening for suspicious requests…</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Demo scenario">
            {DEMOS.map((demo, index) => (
              <button
                key={demo.id}
                type="button"
                role="tab"
                aria-selected={index === scenarioIndex}
                aria-label={`Preview ${demo.tab}`}
                onClick={() => selectScenario(index)}
                className={cx(
                  "rounded-full px-2 py-1 text-[9.5px] font-medium transition-colors",
                  index === scenarioIndex ? "bg-white/10 text-ivory/80" : "text-ivory/30 hover:text-ivory/60"
                )}
              >
                {demo.tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={replay}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] text-ivory/40 transition-colors hover:text-ivory"
            aria-label="Replay screener demo"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="absolute -bottom-7 -left-5 hidden w-[232px] rounded-xl border border-line bg-paper p-3.5 shadow-lift sm:block"
      >
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">
            Screening report
          </span>
          <span className={cx("h-1.5 w-1.5 rounded-full", complete ? "bg-signal" : "bg-ink/20")} />
        </div>
        <p className="mt-1.5 text-[12px] font-semibold text-ink">
          {complete ? "Ready for your decision" : "Screening in progress"}
        </p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
          {complete
            ? `${toIndicators(revealed).length} signals recorded. The caller cannot reach you until you decide.`
            : "The assistant is asking who is calling and why."}
        </p>
      </motion.div>
    </div>
  );
}
