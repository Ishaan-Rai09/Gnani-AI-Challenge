import type { Indicator, IndicatorKey, RiskLevel } from "@/lib/types";

export const INDICATOR_CATALOG: Record<IndicatorKey, Omit<Indicator, "key">> = {
  otp_request: {
    label: "One-time password requested",
    detail: "The caller asked for an OTP or verification code. Legitimate support staff do not ask for these.",
    severity: 3,
    category: "Credential request",
  },
  banking_credentials: {
    label: "Banking details requested",
    detail: "The caller asked for card, account, or UPI details during an unsolicited call.",
    severity: 3,
    category: "Credential request",
  },
  urgent_payment: {
    label: "Urgent payment demand",
    detail: "A payment or transfer was requested immediately, often with a penalty for waiting.",
    severity: 2,
    category: "Financial pressure",
  },
  account_suspension: {
    label: "Account suspension threat",
    detail: "The caller claimed the account or service will be suspended if the request is not followed.",
    severity: 2,
    category: "Coercion",
  },
  unrealistic_reward: {
    label: "Unrealistic reward",
    detail: "A prize, windfall, or guaranteed return was offered for an entry or investment the user did not make.",
    severity: 3,
    category: "Financial pressure",
  },
  institution_impersonation: {
    label: "Institution impersonation signal",
    detail: "The caller claimed to represent a bank or authority but offered no verifiable reference.",
    severity: 2,
    category: "Identity",
  },
  remote_access: {
    label: "Remote-access software requested",
    detail: "The caller asked the user to install software that would allow control of their device.",
    severity: 3,
    category: "Credential request",
  },
  pressure_tactics: {
    label: "Pressure and urgency",
    detail: "Repeated deadlines, warnings, and refusals to let the user verify the caller independently.",
    severity: 1,
    category: "Coercion",
  },
  link_click: {
    label: "Suspicious link request",
    detail: "The caller asked the user to open a link and complete a payment or verification outside an official app.",
    severity: 2,
    category: "Financial pressure",
  },
  secrecy_request: {
    label: "Secrecy requested",
    detail: "The caller asked the user to keep the call or transaction confidential.",
    severity: 2,
    category: "Coercion",
  },
  vague_identity: {
    label: "Unverifiable identity",
    detail: "The caller could not provide a verifiable name, team, or reference number.",
    severity: 1,
    category: "Identity",
  },
};

export const INTENT_LABELS: Record<string, string> = {
  appointment: "Appointment confirmation",
  bank_impersonation: "Impersonated bank fraud check",
  kyc_scam: "KYC expiration threat",
  delivery_scam: "Parcel redelivery payment",
  prize_scam: "Unsolicited prize claim",
  investment_scam: "High-return investment offer",
  unknown: "Not yet established",
};

export function toIndicators(keys: IndicatorKey[]): Indicator[] {
  return Array.from(new Set(keys)).map((key) => ({
    key,
    ...INDICATOR_CATALOG[key],
  }));
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  label: string;
  rationale: string;
}

/**
 * Structured scoring used by the demo engine. This is a heuristic assessment of
 * suspicious signals, not a fraud determination.
 */
export function assessRisk(keys: IndicatorKey[]): RiskAssessment {
  const indicators = toIndicators(keys);
  const score = indicators.reduce((total, indicator) => total + indicator.severity, 0);
  const hasCritical = indicators.some((indicator) => indicator.severity === 3);

  let level: RiskLevel = "low";
  if (score >= 6 || (hasCritical && score >= 4)) level = "high";
  else if (score >= 2) level = "attention";

  const label =
    level === "high" ? "High Risk" : level === "attention" ? "Needs Attention" : "Low Risk";

  const rationale =
    level === "high"
      ? `${indicators.length} suspicious signal${indicators.length === 1 ? "" : "s"} detected, including a high-severity request.`
      : level === "attention"
        ? "Some unusual signals detected. Verify the caller independently before sharing anything."
        : "No high-severity signals detected so far. The caller has remained within a normal enquiry.";

  return { score, level, label, rationale };
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; short: string; description: string }
> = {
  low: {
    label: "Low Risk",
    short: "Low",
    description: "Normal enquiry patterns. No credential or payment request detected.",
  },
  attention: {
    label: "Needs Attention",
    short: "Attention",
    description: "Unusual signals. Verify identity before sharing information.",
  },
  high: {
    label: "High Risk",
    short: "High",
    description: "Credential, payment, or coercion signals consistent with known scam patterns.",
  },
};
