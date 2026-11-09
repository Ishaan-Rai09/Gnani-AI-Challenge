import { assessRisk, RISK_META, toIndicators } from "@/lib/risk";
import type { Indicator, IndicatorKey, Scenario, RiskLevel } from "@/lib/types";

export interface CallAnalysis {
  level: RiskLevel;
  label: string;
  score: number;
  rationale: string;
  indicators: Indicator[];
  summary: string;
}

/**
 * Rules-based analysis for the prototype. Each scripts step declares the
 * signals it introduces; this service turns them into a transparent,
 * explainable risk assessment. It never claims to prove fraud.
 */
export const riskAnalysisService = {
  analyze(revealed: IndicatorKey[]): CallAnalysis {
    const assessment = assessRisk(revealed);
    return {
      level: assessment.level,
      label: assessment.label,
      score: assessment.score,
      rationale: assessment.rationale,
      indicators: toIndicators(revealed),
      summary: assessment.rationale,
    };
  },

  draftSummary(scenario: Scenario, revealed: IndicatorKey[], infoRequested: string[]): string {
    if (revealed.length === 0) {
      return "The assistant is establishing who is calling. No suspicious signals have been detected yet.";
    }
    const risk = assessRisk(revealed);
    const strongest = toIndicators(revealed)
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 2)
      .map((indicator) => indicator.label.toLowerCase());
    const asked = infoRequested.length
      ? ` The caller has requested ${infoRequested.join(", ").toLowerCase()}.`
      : "";
    return `${risk.label} so far. Signals include ${strongest.join(" and ")}.${asked} This is a signal-based assessment, not a fraud determination.`;
  },

  finalSummary(scenario: Scenario, revealed: IndicatorKey[]): string {
    if (revealed.length === 0) return scenario.summary;
    return scenario.summary;
  },

  riskMeta(level: RiskLevel) {
    return RISK_META[level];
  },
};
