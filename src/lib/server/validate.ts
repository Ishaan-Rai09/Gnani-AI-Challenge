import type {
  BlockedNumber,
  CallAction,
  CallRecord,
  Indicator,
  IndicatorKey,
  RiskLevel,
  Speaker,
  TimelineEvent,
  TranscriptEntry,
} from "@/lib/types";

/**
 * Server-side validation for data the browser sends us. Nothing is trusted:
 * list sizes, string lengths, ids, and enum fields are all bounded before the
 * document is written to MongoDB (and again after it is read back).
 */

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const SPEAKERS: readonly Speaker[] = ["ai", "caller", "user", "system"];
const RISK_LEVELS: readonly RiskLevel[] = ["low", "attention", "high"];
const ACTIONS: readonly CallAction[] = ["blocked", "allowed", "ended", "declined"];
const INDICATOR_KEYS: readonly IndicatorKey[] = [
  "otp_request",
  "banking_credentials",
  "urgent_payment",
  "account_suspension",
  "unrealistic_reward",
  "institution_impersonation",
  "remote_access",
  "pressure_tactics",
  "link_click",
  "secrecy_request",
  "vague_identity",
];
const INDICATOR_CATEGORIES = [
  "Credential request",
  "Financial pressure",
  "Identity",
  "Coercion",
] as const;

const MAX_TRANSCRIPT = 300;
const MAX_INDICATORS = 60;
const MAX_INFO = 40;
const MAX_EVENTS = 150;

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function optionalString(value: unknown, max: number): string | null {
  return boundedString(value, max);
}

function boundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value.slice(0, maxItems)) {
    const text = boundedString(item, maxLength);
    if (text) out.push(text);
  }
  return out;
}

export function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

function sanitizeTranscriptEntry(value: unknown): TranscriptEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && ID_RE.test(raw.id) ? raw.id : null;
  const speaker = SPEAKERS.includes(raw.speaker as Speaker) ? (raw.speaker as Speaker) : null;
  const text = boundedString(raw.text, 2_000);
  if (!id || !speaker || !text) return null;
  return {
    id,
    speaker,
    text,
    at: boundedNumber(raw.at, 0, 86_400, 0),
  };
}

function sanitizeIndicator(value: unknown): Indicator | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const key = INDICATOR_KEYS.includes(raw.key as IndicatorKey)
    ? (raw.key as IndicatorKey)
    : null;
  const label = boundedString(raw.label, 160);
  const detail = boundedString(raw.detail, 600);
  const category = INDICATOR_CATEGORIES.includes(
    raw.category as (typeof INDICATOR_CATEGORIES)[number]
  )
    ? (raw.category as Indicator["category"])
    : null;
  if (!key || !label || !detail || !category) return null;
  const severity = Math.round(boundedNumber(raw.severity, 1, 3, 1)) as Indicator["severity"];
  return { key, label, detail, category, severity };
}

function sanitizeEvent(value: unknown): TimelineEvent | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && ID_RE.test(raw.id) ? raw.id : null;
  const label = boundedString(raw.label, 160);
  const detail = boundedString(raw.detail, 600);
  const at = boundedString(raw.at, 64);
  if (!id || !label || !detail || !at) return null;
  const tone =
    raw.tone === "signal" || raw.tone === "positive" || raw.tone === "neutral"
      ? raw.tone
      : undefined;
  return { id, label, detail, at, tone };
}

export function sanitizeCallRecord(value: unknown): CallRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const id = typeof raw.id === "string" && ID_RE.test(raw.id) ? raw.id : null;
  const number = boundedString(raw.number, 32);
  const startedAt = isoDate(raw.startedAt);
  if (!id || !number || !startedAt || digitsOf(number).length < 6) return null;

  const riskLevel = RISK_LEVELS.includes(raw.riskLevel as RiskLevel)
    ? (raw.riskLevel as RiskLevel)
    : "low";
  const action = ACTIONS.includes(raw.action as CallAction)
    ? (raw.action as CallAction)
    : "ended";

  const transcript = Array.isArray(raw.transcript)
    ? (raw.transcript
        .slice(0, MAX_TRANSCRIPT)
        .map(sanitizeTranscriptEntry)
        .filter(Boolean) as TranscriptEntry[])
    : [];
  const indicators = Array.isArray(raw.indicators)
    ? (raw.indicators
        .slice(0, MAX_INDICATORS)
        .map(sanitizeIndicator)
        .filter(Boolean) as Indicator[])
    : [];
  const events = Array.isArray(raw.events)
    ? (raw.events.slice(0, MAX_EVENTS).map(sanitizeEvent).filter(Boolean) as TimelineEvent[])
    : [];

  return {
    id,
    scenarioId: boundedString(raw.scenarioId, 64) ?? "unknown",
    number,
    callerName: optionalString(raw.callerName, 120),
    claimedOrg: optionalString(raw.claimedOrg, 160),
    startedAt,
    durationSec: boundedNumber(raw.durationSec, 0, 86_400, 0),
    riskLevel,
    intent: boundedString(raw.intent, 160) ?? "Unknown intent",
    summary: boundedString(raw.summary, 2_000) ?? "No summary recorded.",
    action,
    transcript,
    indicators,
    infoRequested: stringList(raw.infoRequested, MAX_INFO, 160),
    identityConfidence: Math.round(boundedNumber(raw.identityConfidence, 0, 100, 0)),
    events,
    liveScreened: raw.liveScreened === true,
  };
}

export function sanitizeBlockedNumber(value: unknown): BlockedNumber | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const id = typeof raw.id === "string" && ID_RE.test(raw.id) ? raw.id : null;
  const number = boundedString(raw.number, 32);
  if (!id || !number || digitsOf(number).length < 6) return null;

  return {
    id,
    number,
    label: boundedString(raw.label, 160) ?? "Blocked number",
    reason: boundedString(raw.reason, 600) ?? "Blocked.",
    source: raw.source === "call" ? "call" : "manual",
    blockedAt: isoDate(raw.blockedAt) ?? new Date().toISOString(),
  };
}
