export type RiskLevel = "low" | "attention" | "high";

export type Speaker = "ai" | "caller" | "user" | "system";

export type CallAction = "blocked" | "allowed" | "ended" | "declined";

export type ScreeningMode = "strict" | "balanced" | "relaxed";

export type IntentKey =
  | "appointment"
  | "bank_impersonation"
  | "kyc_scam"
  | "delivery_scam"
  | "prize_scam"
  | "investment_scam"
  | "unknown";

export type IndicatorKey =
  | "otp_request"
  | "banking_credentials"
  | "urgent_payment"
  | "account_suspension"
  | "unrealistic_reward"
  | "institution_impersonation"
  | "remote_access"
  | "pressure_tactics"
  | "link_click"
  | "secrecy_request"
  | "vague_identity";

export interface Indicator {
  key: IndicatorKey;
  label: string;
  detail: string;
  severity: 1 | 2 | 3;
  category: "Credential request" | "Financial pressure" | "Identity" | "Coercion";
}

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  text: string;
  /** Seconds since the simulated call connected. */
  at: number;
}

export interface TimelineEvent {
  id: string;
  at: string;
  label: string;
  detail: string;
  tone?: "neutral" | "signal" | "positive";
}

export interface CallRecord {
  id: string;
  scenarioId: string;
  number: string;
  callerName: string | null;
  claimedOrg: string | null;
  startedAt: string;
  durationSec: number;
  riskLevel: RiskLevel;
  intent: string;
  summary: string;
  action: CallAction;
  transcript: TranscriptEntry[];
  indicators: Indicator[];
  infoRequested: string[];
  identityConfidence: number;
  events: TimelineEvent[];
  liveScreened: boolean;
}

export interface BlockedNumber {
  id: string;
  number: string;
  label: string;
  reason: string;
  source: "manual" | "call";
  blockedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  callId?: string;
  href?: string;
  tone: "risk" | "info" | "success";
}

export interface AssistantSettings {
  screeningEnabled: boolean;
  screeningMode: ScreeningMode;
  greeting: string;
  language: string;
  /** Play caller and assistant lines aloud through Gnani TTS. */
  voiceEnabled: boolean;
  /** Gnani Timbre voice id used for the assistant. */
  voice: string;
  questions: {
    name: boolean;
    organisation: boolean;
    purpose: boolean;
    reference: boolean;
  };
  handling: "notify" | "screen_and_hold" | "voicemail";
  notifySuspicious: boolean;
  notifySummaries: boolean;
  notifyBlocked: boolean;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  plan: string;
}

export interface ListenerEvent {
  id: string;
  kind: "info" | "risk" | "success" | "neutral";
  title: string;
  detail: string;
}

export type SessionPhase = "idle" | "ringing" | "screening" | "user" | "ended";

export interface LiveSession {
  id: string;
  scenarioId: string;
  phase: SessionPhase;
  startedAt: string;
  elapsedSec: number;
  answeredByAI: boolean;
  userTookOver: boolean;
  transcript: TranscriptEntry[];
  scriptCursor: number;
  revealedIndicators: IndicatorKey[];
  infoRequested: string[];
  intentKey: IntentKey;
  callerName: string | null;
  claimedOrg: string | null;
  identityConfidence: number;
  riskLevel: RiskLevel;
  riskScore: number;
  summary: string;
  events: TimelineEvent[];
  activity: ListenerEvent[];
  outcome: CallAction | null;
}

export interface ScriptStep {
  at: number;
  speaker: Speaker;
  text: string;
  reveals?: IndicatorKey[];
  infoRequested?: string[];
  intentKey?: IntentKey;
  identityConfidence?: number;
}

export interface Scenario {
  id: string;
  name: string;
  blurb: string;
  number: string;
  callerName: string | null;
  claimedOrg: string | null;
  intentKey: IntentKey;
  intentLabel: string;
  expectedRisk: RiskLevel;
  identityConfidence: number;
  summary: string;
  infoRequested: string[];
  script: ScriptStep[];
  durationSec: number;
  category: "Safe enquiry" | "Bank fraud" | "KYC fraud" | "Delivery fraud" | "Prize fraud" | "Investment fraud";
}
