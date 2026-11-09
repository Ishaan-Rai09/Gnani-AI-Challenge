import { INDICATOR_CATALOG, assessRisk, toIndicators } from "@/lib/risk";
import { conversationService } from "@/lib/services/conversationService";
import { riskAnalysisService } from "@/lib/services/riskAnalysisService";
import type {
  AssistantSettings,
  CallAction,
  CallRecord,
  IndicatorKey,
  LiveSession,
  Scenario,
  TimelineEvent,
} from "@/lib/types";
import { uid } from "@/lib/utils";

const ACTION_LABEL: Record<CallAction, string> = {
  blocked: "Number blocked",
  allowed: "Caller allowed",
  ended: "Call ended by account holder",
  declined: "Incoming call declined",
};

const ACTION_DETAIL: Record<CallAction, string> = {
  blocked: "The number was added to the blocklist and the interaction saved.",
  allowed: "The caller was marked as trusted and saved in call history.",
  ended: "The screening was ended and a summary was saved.",
  declined: "The call was declined before the assistant answered.",
};

function baseEvent(label: string, detail: string, tone: TimelineEvent["tone"] = "neutral"): TimelineEvent {
  return { id: uid("evt"), at: new Date().toISOString(), label, detail, tone };
}

/** Pure orchestration for the simulated calling environment. */
export const callSimulationService = {
  createSession(scenario: Scenario): LiveSession {
    return {
      id: uid("call"),
      scenarioId: scenario.id,
      phase: "ringing",
      startedAt: new Date().toISOString(),
      elapsedSec: 0,
      answeredByAI: false,
      userTookOver: false,
      transcript: [],
      scriptCursor: 0,
      revealedIndicators: [],
      infoRequested: [],
      intentKey: scenario.intentKey,
      callerName: scenario.callerName,
      claimedOrg: scenario.claimedOrg,
      identityConfidence: 20,
      riskLevel: "low",
      riskScore: 0,
      summary: "Waiting for the assistant to answer.",
      events: [baseEvent("Incoming call received", `Unknown caller ${scenario.number} is calling.`)],
      activity: [],
      outcome: null,
    };
  },

  answer(session: LiveSession, settings: AssistantSettings): LiveSession {
    const now = new Date().toISOString();
    return {
      ...session,
      phase: "screening",
      answeredByAI: true,
      transcript: [conversationService.greetingLine(settings, 0)],
      events: [
        ...session.events,
        { id: uid("evt"), at: now, label: "AI answered", detail: "The assistant introduced itself and asked who is calling.", tone: "neutral" },
      ],
      activity: [
        { id: uid("act"), kind: "info", title: "AI screening started", detail: "The assistant is asking for the caller's name and purpose." },
      ],
      summary: "The assistant is establishing who is calling. No suspicious signals have been detected yet.",
    };
  },

  tick(
    session: LiveSession,
    scenario: Scenario,
    elapsed: number,
    maxSteps = Number.POSITIVE_INFINITY
  ): LiveSession {
    if (session.phase !== "screening" && session.phase !== "user") return session;
    if (elapsed === session.elapsedSec) return session;

    const dueAll = scenario.script
      .slice(session.scriptCursor)
      .filter((step) => step.at <= elapsed)
      .slice(0, maxSteps);
    if (dueAll.length === 0) {
      return { ...session, elapsedSec: elapsed };
    }

    // Once the account holder takes over, the assistant no longer speaks; its
    // remaining lines are skipped so the simulated caller keeps the floor.
    const due = session.phase === "user" ? dueAll.filter((step) => step.speaker !== "ai") : dueAll;

    const next: LiveSession = {
      ...session,
      elapsedSec: elapsed,
      scriptCursor: session.scriptCursor + dueAll.length,
    };

    if (due.length === 0) {
      return next;
    }

    const newIndicators: IndicatorKey[] = [];
    const newActivity = [...session.activity];
    let intentKey = session.intentKey;
    let confidence = session.identityConfidence;

    for (const step of due) {
      next.transcript = [
        ...next.transcript,
        {
          id: uid("line"),
          speaker: step.speaker,
          text: step.text,
          at: step.at,
        },
      ];
      if (step.reveals) {
        for (const key of step.reveals) {
          if (!next.revealedIndicators.includes(key) && !newIndicators.includes(key)) {
            newIndicators.push(key);
            newActivity.push({
              id: uid("act"),
              kind: key === "vague_identity" ? "info" : "risk",
              title: INDICATOR_CATALOG[key].label,
              detail: INDICATOR_CATALOG[key].detail,
            });
          }
        }
      }
      if (step.infoRequested) {
        for (const item of step.infoRequested) {
          if (!next.infoRequested.includes(item)) next.infoRequested = [...next.infoRequested, item];
        }
      }
      if (step.intentKey) intentKey = step.intentKey;
      if (typeof step.identityConfidence === "number") confidence = step.identityConfidence;
    }

    next.revealedIndicators = [...next.revealedIndicators, ...newIndicators];
    next.intentKey = intentKey;
    next.identityConfidence = confidence;
    next.activity = newActivity;

    const assessment = assessRisk(next.revealedIndicators);
    next.riskLevel = assessment.level;
    next.riskScore = assessment.score;
    next.summary = riskAnalysisService.draftSummary(
      scenario,
      next.revealedIndicators,
      next.infoRequested
    );

    if (newIndicators.length > 0) {
      next.events = [
        ...next.events,
        {
          id: uid("evt"),
          at: new Date().toISOString(),
          label: `${newIndicators.length} new signal${newIndicators.length === 1 ? "" : "s"} detected`,
          detail: newIndicators.map((key) => INDICATOR_CATALOG[key].label).join(", "),
          tone: "signal",
        },
      ];
    }

    const lastAt = scenario.script[scenario.script.length - 1]?.at ?? 0;
    if (elapsed >= lastAt && !session.events.some((event) => event.label === "Screening complete")) {
      next.events = [
        ...next.events,
        {
          id: uid("evt"),
          at: new Date().toISOString(),
          label: "Screening complete",
          detail: "The scripted conversation has finished. The account holder can decide what happens next.",
          tone: "neutral",
        },
      ];
      next.activity = [
        ...next.activity,
        {
          id: uid("act"),
          kind: "success",
          title: "Screening complete",
          detail: "A summary and signal list are ready for review.",
        },
      ];
    }

    return next;
  },

  takeOver(session: LiveSession): LiveSession {
    const at = session.elapsedSec;
    return {
      ...session,
      phase: "user",
      userTookOver: true,
      transcript: [
        ...session.transcript,
        conversationService.systemLine("You joined the call. The AI assistant is listening and taking notes.", at),
      ],
      events: [
        ...session.events,
        {
          id: uid("evt"),
          at: new Date().toISOString(),
          label: "Account holder took over",
          detail: "The AI stopped speaking and handed the call to the account holder.",
          tone: "neutral",
        },
      ],
      activity: [
        ...session.activity,
        { id: uid("act"), kind: "info", title: "You are handling this call", detail: "Type a reply below to continue the conversation." },
      ],
    };
  },

  speakAsUser(session: LiveSession, text: string): LiveSession {
    return {
      ...session,
      transcript: [...session.transcript, conversationService.userLine(text, session.elapsedSec)],
    };
  },

  finalize(
    session: LiveSession,
    scenario: Scenario,
    action: CallAction
  ): CallRecord {
    const untouched = session.phase === "ringing" || (action === "declined" && !session.answeredByAI);
    const indicators = untouched ? [] : toIndicators(session.revealedIndicators);
    const assessment = untouched ? null : assessRisk(session.revealedIndicators);
    const completedScript = session.scriptCursor >= scenario.script.length;
    const summary = untouched
      ? `Call from ${scenario.number} was declined before the assistant answered. No conversation took place and no information was shared.`
      : completedScript
        ? scenario.summary
        : `${riskAnalysisService.draftSummary(
            scenario,
            session.revealedIndicators,
            session.infoRequested
          )} The account holder ended the screening before the full scripted conversation was reached.`;

    return {
      id: session.id,
      scenarioId: scenario.id,
      number: scenario.number,
      callerName: scenario.callerName,
      claimedOrg: scenario.claimedOrg,
      startedAt: session.startedAt,
      durationSec: Math.max(session.elapsedSec, session.transcript.at(-1)?.at ?? 0),
      riskLevel: assessment?.level ?? scenario.expectedRisk,
      intent: untouched ? "Not screened" : scenario.intentLabel,
      summary,
      action,
      transcript: session.transcript,
      indicators,
      infoRequested: session.infoRequested,
      identityConfidence: untouched ? 0 : session.identityConfidence,
      events: [
        ...session.events,
        {
          id: uid("evt"),
          at: new Date().toISOString(),
          label: ACTION_LABEL[action],
          detail: ACTION_DETAIL[action],
          tone: action === "blocked" || action === "allowed" ? "positive" : "neutral",
        },
      ],
      liveScreened: !untouched,
    };
  },
};
