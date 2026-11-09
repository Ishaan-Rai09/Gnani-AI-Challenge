import type {
  AssistantSettings,
  BlockedNumber,
  CallRecord,
  NotificationItem,
  Profile,
  TranscriptEntry,
} from "@/lib/types";
import { toIndicators } from "@/lib/risk";

const DAY = 86_400_000;
const HOUR = 3_600_000;

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - days * DAY - hours * HOUR).toISOString();
}

function lines(entries: Array<[TranscriptEntry["speaker"], string, number]>): TranscriptEntry[] {
  return entries.map(([speaker, text, at], index) => ({
    id: `seed-line-${index}-${speaker}`,
    speaker,
    text,
    at,
  }));
}

function call(
  partial: Pick<CallRecord, "id" | "scenarioId" | "number" | "callerName" | "claimedOrg"> &
    Partial<CallRecord> & {
      indicatorKeys?: Parameters<typeof toIndicators>[0];
      startedAt: string;
    }
): CallRecord {
  const { indicatorKeys, ...rest } = partial;
  return {
    durationSec: 40,
    riskLevel: "low",
    intent: "Appointment confirmation",
    summary: "",
    action: "ended",
    transcript: [],
    infoRequested: [],
    identityConfidence: 60,
    events: [],
    liveScreened: true,
    ...rest,
    indicators: toIndicators(indicatorKeys ?? []),
  };
}

export function buildSeedCalls(): CallRecord[] {
  return [
    call({
      id: "seed-bank-1",
      scenarioId: "bank-impersonation",
      number: "+91 80 4712 9931",
      callerName: null,
      claimedOrg: "Northbridge Bank (claimed)",
      startedAt: ago(0, 2),
      durationSec: 52,
      riskLevel: "high",
      intent: "Impersonated bank fraud check",
      summary:
        "Caller claimed to be a bank fraud officer and requested a card number and OTP to stop a ₹48,500 debit. No case reference was provided and the account holder was warned of suspension. AI did not share any information.",
      action: "blocked",
      identityConfidence: 30,
      infoRequested: ["Card number", "One-time password (OTP)"],
      indicatorKeys: [
        "institution_impersonation",
        "banking_credentials",
        "otp_request",
        "account_suspension",
        "pressure_tactics",
      ],
      transcript: lines([
        ["ai", "Hello, this is the call assistant speaking for the account holder. May I know who's calling and what this is regarding?", 0],
        ["caller", "Good afternoon. I'm calling from Northbridge Bank's fraud prevention desk. Am I speaking with the account holder?", 3],
        ["ai", "This is the call assistant. May I take your name, department, and the reason for the call?", 8],
        ["caller", "Rahul Mehta, senior fraud officer. We've flagged a debit of ₹48,500. I need the 16-digit card number and the OTP to stop it.", 15],
        ["ai", "The assistant can't share card details or one-time codes on an unverified call. Is there a case reference?", 24],
        ["caller", "No case number yet. If this isn't done in ten minutes the account will be suspended.", 34],
        ["ai", "I won't share any codes. I'll end the screening here and pass this to the account holder.", 45],
      ]),
      events: [
        { id: "e1", at: ago(0, 2), label: "AI answered", detail: "Screening started on the account holder's behalf.", tone: "neutral" },
        { id: "e2", at: ago(0, 2), label: "Credential request detected", detail: "Caller asked for card number and OTP.", tone: "signal" },
        { id: "e3", at: ago(0, 2), label: "High risk assessed", detail: "Five suspicious signals recorded.", tone: "signal" },
        { id: "e4", at: ago(0, 2), label: "Number blocked", detail: "Account holder blocked the caller after review.", tone: "positive" },
      ],
    }),
    call({
      id: "seed-delivery-1",
      scenarioId: "delivery-fee",
      number: "+91 90045 11872",
      callerName: "Ravi (claimed)",
      claimedOrg: "SwiftShip Couriers (claimed)",
      startedAt: ago(0, 6),
      durationSec: 45,
      riskLevel: "attention",
      intent: "Parcel redelivery payment",
      summary:
        "A courier asked for a ₹35 redelivery fee via a WhatsApp payment link or UPI collect request within an hour. Sender details could not be confirmed. No payment was made.",
      action: "ended",
      identityConfidence: 26,
      infoRequested: ["₹35 redelivery fee", "Payment link"],
      indicatorKeys: ["link_click", "urgent_payment", "pressure_tactics"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling and what this is regarding?", 0],
        ["caller", "Hi, this is SwiftShip Couriers. Your parcel is on hold over an unpaid redelivery charge.", 3],
        ["ai", "Could I take your name, branch, and tracking number?", 8],
        ["caller", "Ravi from the local hub. Tracking QS-8841. The charge is ₹35 — I'll send a link now.", 13],
        ["ai", "The assistant can't open payment links on an unverified call. Can you confirm the sender and address?", 24],
        ["caller", "I can't see the sender details. Just approve the UPI request before it expires.", 34],
        ["ai", "I'll pass this on without a payment. The parcel can be tracked in the official app.", 40],
      ]),
      events: [
        { id: "d1", at: ago(0, 6), label: "AI answered", detail: "Screening started automatically.", tone: "neutral" },
        { id: "d2", at: ago(0, 6), label: "Payment pressure detected", detail: "Caller requested a payment link and a UPI approval.", tone: "signal" },
        { id: "d3", at: ago(0, 6), label: "Screening ended", detail: "No payment information was shared.", tone: "neutral" },
      ],
    }),
    call({
      id: "seed-dental-1",
      scenarioId: "dental-confirmation",
      number: "+91 80 4120 7781",
      callerName: "Priya Nair",
      claimedOrg: "Bright Lane Dental",
      startedAt: ago(1, 3),
      durationSec: 32,
      riskLevel: "low",
      intent: "Appointment confirmation",
      summary:
        "Bright Lane Dental confirmed an appointment for 4:30 pm tomorrow with a matching reference (BL-2041). No information beyond a confirmation was requested.",
      action: "allowed",
      identityConfidence: 88,
      infoRequested: ["Appointment reference"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling and what this is regarding?", 0],
        ["caller", "Hi, this is Priya Nair from Bright Lane Dental. I'm confirming tomorrow's 4:30 appointment.", 3],
        ["ai", "Could you confirm the reference and the name on the booking?", 8],
        ["caller", "Reference BL-2041, booked last Tuesday. We sent an email confirmation too.", 13],
        ["ai", "Thanks. I'll pass the confirmation on.", 22],
        ["caller", "Perfect, thank you.", 28],
      ]),
      events: [
        { id: "t1", at: ago(1, 3), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "t2", at: ago(1, 3), label: "Identity verified", detail: "Appointment reference matched caller's claim.", tone: "positive" },
        { id: "t3", at: ago(1, 3), label: "Caller allowed", detail: "Marked as trusted after screening.", tone: "positive" },
      ],
    }),
    call({
      id: "seed-kyc-1",
      scenarioId: "kyc-expiry",
      number: "+91 99714 22086",
      callerName: null,
      claimedOrg: "TeleLink Mobile (claimed)",
      startedAt: ago(2, 1),
      durationSec: 47,
      riskLevel: "high",
      intent: "KYC expiration threat",
      summary:
        "Caller claimed KYC had expired and asked for an Aadhaar number, OTP, and remote access via QuickAssist. No employee ID or reference was provided. Number disconnection was threatened.",
      action: "blocked",
      identityConfidence: 22,
      infoRequested: ["Aadhaar number", "OTP", "Remote access"],
      indicatorKeys: ["vague_identity", "otp_request", "remote_access", "account_suspension", "pressure_tactics"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling and what this is regarding?", 0],
        ["caller", "TeleLink Mobile compliance. Your KYC expired yesterday. The number will be disconnected tonight.", 3],
        ["ai", "Can you share your name, employee ID, and a reference for this notice?", 9],
        ["caller", "My name is Arjun, no reference — it's automated. Just the Aadhaar number and the OTP I'll trigger.", 16],
        ["ai", "The assistant can't share identity numbers or install remote-access tools.", 27],
        ["caller", "If you hang up, the number is gone by midnight.", 35],
        ["ai", "I'll record that warning. Verification can happen in the official app.", 41],
      ]),
      events: [
        { id: "k1", at: ago(2, 1), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "k2", at: ago(2, 1), label: "Remote-access request detected", detail: "Caller asked to install QuickAssist.", tone: "signal" },
        { id: "k3", at: ago(2, 1), label: "Number blocked", detail: "Number added to blocklist.", tone: "positive" },
      ],
    }),
    call({
      id: "seed-prize-1",
      scenarioId: "prize-claim",
      number: "+91 88267 45019",
      callerName: null,
      claimedOrg: null,
      startedAt: ago(3, 5),
      durationSec: 47,
      riskLevel: "high",
      intent: "Unsolicited prize claim",
      summary:
        "Caller claimed a ₹12,50,000 prize and requested a ₹4,999 processing fee by gift card. The call was to be kept confidential until transfer. No registration details were provided.",
      action: "declined",
      identityConfidence: 15,
      infoRequested: ["₹4,999 processing fee", "Gift card code"],
      indicatorKeys: ["unrealistic_reward", "vague_identity", "institution_impersonation", "urgent_payment", "secrecy_request", "pressure_tactics"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling and what this is regarding?", 0],
        ["caller", "National Reward Centre. Your number has won ₹12,50,000 in our annual draw!", 3],
        ["ai", "The account holder didn't enter a draw. Could you share your registration and claim reference?", 9],
        ["caller", "Vikram, claims team. Reference NR-77219. The draw is automatic.", 15],
        ["ai", "What happens next to release the prize?", 21],
        ["caller", "A ₹4,999 processing fee by gift card, then the transfer within an hour.", 25],
        ["ai", "The assistant won't arrange a payment for an unverified prize.", 36],
        ["caller", "The offer expires at 6 pm. Keep this confidential.", 41],
      ]),
      events: [
        { id: "p1", at: ago(3, 5), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "p2", at: ago(3, 5), label: "Prize claim flagged", detail: "Unsolicited reward with an upfront fee.", tone: "signal" },
        { id: "p3", at: ago(3, 5), label: "Call declined", detail: "Account holder declined the caller.", tone: "neutral" },
      ],
    }),
    call({
      id: "seed-invest-1",
      scenarioId: "investment-offer",
      number: "+91 70219 33428",
      callerName: "Kabir Sethi (claimed)",
      claimedOrg: "Vertex Capital Advisors (claimed)",
      startedAt: ago(4, 2),
      durationSec: 46,
      riskLevel: "high",
      intent: "High-return investment offer",
      summary:
        "A caller promised a 40% guaranteed return in 60 days and asked for a ₹50,000 transfer before sharing any registration documents. The offer was described as closing the same day.",
      action: "ended",
      identityConfidence: 27,
      infoRequested: ["₹50,000 transfer", "Bank account details"],
      indicatorKeys: ["unrealistic_reward", "vague_identity", "urgent_payment", "pressure_tactics"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling and what this is regarding?", 0],
        ["caller", "Kabir from Vertex Capital Advisors. A private allocation is opening today.", 3],
        ["ai", "Could you share your registration and how you got this number?", 9],
        ["caller", "Registered advisory, partner database. 40% guaranteed return in 60 days.", 15],
        ["ai", "What is the minimum, and who holds the funds?", 22],
        ["caller", "₹50,000 to our collection account. Slots close once the book is full.", 26],
        ["ai", "The assistant won't arrange a transfer without verifiable documents.", 38],
        ["caller", "By the time you verify, the allocation will be gone.", 43],
      ]),
      events: [
        { id: "i1", at: ago(4, 2), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "i2", at: ago(4, 2), label: "Guaranteed-return claim flagged", detail: "Unrealistic reward with same-day payment pressure.", tone: "signal" },
        { id: "i3", at: ago(4, 2), label: "Screening ended", detail: "No transfer or account details were shared.", tone: "neutral" },
      ],
    }),
    call({
      id: "seed-wrong-number-1",
      scenarioId: "manual",
      number: "+91 99103 55620",
      callerName: null,
      claimedOrg: null,
      startedAt: ago(6, 4),
      durationSec: 18,
      riskLevel: "low",
      intent: "Wrong number",
      summary:
        "A caller asked for someone who does not live at this number. The assistant confirmed the number was incorrect and the caller apologised and hung up.",
      action: "ended",
      identityConfidence: 55,
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling?", 0],
        ["caller", "Is Meera there? I think I have the wrong number.", 4],
        ["ai", "This number doesn't belong to Meera. I can pass on a message if needed.", 8],
        ["caller", "No, that's fine. Sorry to bother you.", 13],
      ]),
      events: [
        { id: "w1", at: ago(6, 4), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "w2", at: ago(6, 4), label: "Wrong number", detail: "Caller ended the call after confirmation.", tone: "neutral" },
      ],
    }),
    call({
      id: "seed-otp-1",
      scenarioId: "manual",
      number: "+91 73820 99514",
      callerName: null,
      claimedOrg: "Aegis Health (claimed)",
      startedAt: ago(8, 1),
      durationSec: 39,
      riskLevel: "high",
      intent: "Credential phishing",
      summary:
        "Caller claimed to be from a health service and asked for an OTP to 'reactivate an insurance policy'. A callback number did not match the claimed organisation. No code was shared.",
      action: "blocked",
      identityConfidence: 18,
      infoRequested: ["OTP", "Policy number"],
      indicatorKeys: ["otp_request", "institution_impersonation", "vague_identity"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling and what this is regarding?", 0],
        ["caller", "Aegis Health. Your insurance policy is inactive and will lapse. I need an OTP to reactivate it.", 4],
        ["ai", "Can you provide a policy reference and a callback number?", 14],
        ["caller", "Just read the OTP. The policy number doesn't matter right now.", 22],
        ["ai", "The assistant can't share one-time codes on an unverified call.", 30],
        ["caller", "Then the policy will lapse today.", 34],
      ]),
      events: [
        { id: "o1", at: ago(8, 1), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "o2", at: ago(8, 1), label: "OTP request detected", detail: "Caller requested a one-time password.", tone: "signal" },
        { id: "o3", at: ago(8, 1), label: "Number blocked", detail: "Number added to blocklist.", tone: "positive" },
      ],
    }),
    call({
      id: "seed-doctor-1",
      scenarioId: "manual",
      number: "+91 98450 22107",
      callerName: "Dr. Ananya Rao",
      claimedOrg: "Lakeside Clinic",
      startedAt: ago(11, 7),
      durationSec: 27,
      riskLevel: "low",
      intent: "Rescheduling",
      summary:
        "Lakeside Clinic called to move a check-up from Friday to Monday. The caller gave a verifiable reference and the assistant noted the change.",
      action: "allowed",
      identityConfidence: 82,
      infoRequested: ["Appointment reference"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling?", 0],
        ["caller", "Dr. Ananya Rao from Lakeside Clinic. I need to move Friday's check-up to Monday at 10.", 3],
        ["ai", "Could you share the appointment reference?", 11],
        ["caller", "LC-5519, under the same name. The front desk will email the new slot.", 15],
        ["ai", "I'll pass that on. Thank you.", 23],
      ]),
      events: [
        { id: "c1", at: ago(11, 7), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "c2", at: ago(11, 7), label: "Caller allowed", detail: "Verified clinic caller marked as trusted.", tone: "positive" },
      ],
    }),
    call({
      id: "seed-robocall-1",
      scenarioId: "manual",
      number: "+91 60031 77702",
      callerName: null,
      claimedOrg: null,
      startedAt: ago(14, 2),
      durationSec: 11,
      riskLevel: "attention",
      intent: "Silent / automated call",
      summary:
        "An automated recording about a 'limited insurance offer' played without identifying the organisation. The assistant ended the screening after 11 seconds.",
      action: "ended",
      identityConfidence: 10,
      infoRequested: [],
      indicatorKeys: ["vague_identity", "pressure_tactics"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling?", 0],
        ["caller", "This is an automated message about a limited insurance offer. Press 1 to continue.", 3],
        ["ai", "The assistant doesn't respond to automated menus. Ending the screening.", 8],
      ]),
      events: [
        { id: "r1", at: ago(14, 2), label: "Automated call detected", detail: "Pre-recorded message with no organisation name.", tone: "signal" },
        { id: "r2", at: ago(14, 2), label: "Screening ended", detail: "No interaction with the menu.", tone: "neutral" },
      ],
    }),
    call({
      id: "seed-bank-2",
      scenarioId: "manual",
      number: "+91 80671 44320",
      callerName: null,
      claimedOrg: "Northbridge Bank (claimed)",
      startedAt: ago(19, 9),
      durationSec: 58,
      riskLevel: "high",
      intent: "Account takeover attempt",
      summary:
        "Caller claimed there was a suspicious login and asked the user to install a 'security helper' app. The assistant refused and ended the call. The number was blocked.",
      action: "blocked",
      identityConfidence: 24,
      infoRequested: ["Remote access", "Account PIN"],
      indicatorKeys: ["remote_access", "institution_impersonation", "account_suspension", "pressure_tactics"],
      transcript: lines([
        ["ai", "Hello, this is the call assistant. May I know who's calling?", 0],
        ["caller", "Northbridge Bank security. There's a login from another city. Install SecureHelper so we can protect the account.", 4],
        ["ai", "Which department and case reference is this call linked to?", 15],
        ["caller", "No case reference. Just install the app and share the PIN when prompted.", 24],
        ["ai", "The assistant won't install remote-access software or share a PIN.", 35],
        ["caller", "Your account will be locked. This is the only warning.", 44],
        ["ai", "I'll end the screening and flag this number.", 51],
      ]),
      events: [
        { id: "b1", at: ago(19, 9), label: "AI answered", detail: "Screening started.", tone: "neutral" },
        { id: "b2", at: ago(19, 9), label: "Remote-access request", detail: "Caller asked to install SecureHelper.", tone: "signal" },
        { id: "b3", at: ago(19, 9), label: "Number blocked", detail: "Number added to blocklist.", tone: "positive" },
      ],
    }),
  ];
}

export function buildSeedBlocklist(): BlockedNumber[] {
  return [
    {
      id: "blk-1",
      number: "+91 80 4712 9931",
      label: "Claimed Northbridge Bank fraud desk",
      reason: "Asked for card number and OTP, then threatened account suspension.",
      source: "call",
      blockedAt: ago(0, 1),
    },
    {
      id: "blk-2",
      number: "+91 99714 22086",
      label: "Claimed TeleLink Mobile compliance",
      reason: "Fake KYC expiry; requested Aadhaar, OTP, and remote access.",
      source: "call",
      blockedAt: ago(2, 1),
    },
    {
      id: "blk-3",
      number: "+91 73820 99514",
      label: "Claimed Aegis Health",
      reason: "OTP phishing for a policy that could not be verified.",
      source: "call",
      blockedAt: ago(8, 1),
    },
  ];
}

export function buildSeedNotifications(calls: CallRecord[]): NotificationItem[] {
  const bank = calls.find((item) => item.id === "seed-bank-1");
  const kyc = calls.find((item) => item.id === "seed-kyc-1");
  const dental = calls.find((item) => item.id === "seed-dental-1");
  const unread = new Date(Date.now() - 2 * HOUR).toISOString();
  const read = new Date(Date.now() - 20 * HOUR).toISOString();

  return [
    {
      id: "note-1",
      title: "High-risk caller blocked",
      body: "+91 80 4712 9931 asked for a card number and OTP. The number is now blocked.",
      createdAt: unread,
      read: false,
      callId: bank?.id,
      href: bank ? `/app/history/${bank.id}` : "/app/history",
      tone: "risk",
    },
    {
      id: "note-2",
      title: "A caller requested banking credentials",
      body: "Screening paused on a request for a one-time password. Review the transcript.",
      createdAt: new Date(Date.now() - 5 * HOUR).toISOString(),
      read: false,
      callId: bank?.id,
      href: bank ? `/app/history/${bank.id}` : "/app/history",
      tone: "risk",
    },
    {
      id: "note-3",
      title: "Call screening report ready",
      body: "KYC expiry call assessed as high risk. Three signals recorded.",
      createdAt: read,
      read: true,
      callId: kyc?.id,
      href: kyc ? `/app/history/${kyc.id}` : "/app/history",
      tone: "info",
    },
    {
      id: "note-4",
      title: "Trusted caller passed through",
      body: "Bright Lane Dental was marked safe and allowed through.",
      createdAt: new Date(Date.now() - 25 * HOUR).toISOString(),
      read: true,
      callId: dental?.id,
      href: dental ? `/app/history/${dental.id}` : "/app/history",
      tone: "success",
    },
  ];
}

export const DEFAULT_ASSISTANT: AssistantSettings = {
  screeningEnabled: true,
  screeningMode: "balanced",
  greeting:
    "Hello, this is the call assistant speaking on behalf of the account holder. May I know who's calling and what this call is regarding?",
  language: "English (India)",
  voiceEnabled: true,
  voice: "Kaveri",
  hinglish: true,
  questions: {
    name: true,
    organisation: true,
    purpose: true,
    reference: false,
  },
  handling: "screen_and_hold",
  notifySuspicious: true,
  notifySummaries: true,
  notifyBlocked: true,
};

export const DEFAULT_PROFILE: Profile = {
  name: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "+91 98•••• 2140",
  plan: "CallShield Demo",
};
