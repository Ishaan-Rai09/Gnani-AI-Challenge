"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Fingerprint, Info, ShieldQuestion, Sparkles } from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RISK_META, toIndicators } from "@/lib/risk";
import type { LiveSession, Scenario } from "@/lib/types";
import { cx } from "@/lib/utils";

function Meter({ level }: { level: LiveSession["riskLevel"] }) {
  const filled = level === "high" ? 3 : level === "attention" ? 2 : 1;
  return (
    <div className="flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cx(
            "h-1 flex-1 rounded-full",
            index < filled
              ? level === "low"
                ? "bg-ink/30"
                : "bg-signal"
              : "bg-ink/[0.08]"
          )}
        />
      ))}
    </div>
  );
}

export function IntelligencePanel({
  session,
  scenario,
}: {
  session: LiveSession;
  scenario: Scenario;
}) {
  const indicators = toIndicators(session.revealedIndicators);
  const confidence = session.identityConfidence;
  const confidenceLabel = confidence >= 65 ? "Moderate" : confidence >= 35 ? "Low" : "Very low";
  const stillListening = session.phase === "screening" && session.riskLevel !== "high";

  return (
    <aside className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-signal" />
          <h2 className="text-[12px] font-semibold">AI intelligence</h2>
        </div>
        <span
          className={cx(
            "rounded-full border px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em]",
            stillListening
              ? "border-line text-muted"
              : "border-signal/30 bg-signal/[0.07] text-ink/60"
          )}
        >
          {stillListening ? "Assessing" : "Updated"}
        </span>
      </div>

      <div className="space-y-0">
        <div className="border-b border-line px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-micro">Risk assessment</p>
              <div className="mt-2">
                <RiskBadge level={session.riskLevel} size="md" />
              </div>
            </div>
            <div className="w-[76px] pt-1">
              <Meter level={session.riskLevel} />
              <p className="mt-1.5 text-right font-display text-[9px] tabular-nums text-muted">
                {session.riskScore} pts
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
            {RISK_META[session.riskLevel].description}
          </p>
        </div>

        <div className="border-b border-line px-4 py-4">
          <p className="label-micro">Caller intent</p>
          <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-ink">
            {session.transcript.length > 1 ? scenario.intentLabel : "Not yet established"}
          </p>
        </div>

        <div className="border-b border-line px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="label-micro">Suspicious indicators</p>
            <span className="font-display text-[11px] tabular-nums text-ink/40">
              {String(indicators.length).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-2.5 space-y-2.5">
            <AnimatePresence initial={false}>
              {indicators.map((indicator) => (
                <motion.div
                  key={indicator.key}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-1 flex shrink-0 gap-[2px]" aria-hidden="true">
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={cx(
                          "h-2.5 w-[2px]",
                          level <= indicator.severity ? "bg-signal" : "bg-ink/10"
                        )}
                      />
                    ))}
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium leading-snug text-ink/80">
                      {indicator.label}
                    </p>
                    <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
                      {indicator.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {indicators.length === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-line px-3 py-3">
                <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/25" />
                <p className="text-[10px] leading-relaxed text-muted">
                  No suspicious signals yet. The assistant is still asking questions.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-line px-4 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-3 w-3 text-ink/35" />
            <p className="label-micro">Information requested</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {session.infoRequested.length === 0 ? (
              <span className="text-[10.5px] text-muted">Nothing requested yet.</span>
            ) : (
              session.infoRequested.map((item) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-line bg-white px-2 py-1 text-[9.5px] font-medium text-ink/60"
                >
                  {item}
                </motion.span>
              ))
            )}
          </div>
        </div>

        <div className="border-b border-line px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-3 w-3 text-ink/35" />
              <p className="label-micro">Caller identity</p>
            </div>
            <span className="text-[9px] font-medium text-muted">
              {confidenceLabel} confidence
            </span>
          </div>
          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className="h-full bg-ink/50 transition-[width] duration-500"
              style={{ width: `${Math.max(4, confidence)}%` }}
            />
          </div>
          <p className="mt-2 text-[10.5px] text-ink/60">
            {session.callerName ?? "No name provided"}
            {session.claimedOrg ? ` · ${session.claimedOrg}` : ""}
          </p>
          <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
            Self-reported claims. Not verified against a directory.
          </p>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3 text-signal" />
            <p className="label-micro">AI summary</p>
          </div>
          <div className="mt-2 border-l-2 border-signal/50 pl-3">
            <p className="text-[10.5px] leading-[1.7] text-ink/65">{session.summary}</p>
          </div>
          <p className="mt-2.5 text-[8.5px] leading-relaxed text-muted">
            Signal-based analysis, not proof of fraud. Verify independently before acting.
          </p>
        </div>
      </div>
    </aside>
  );
}
