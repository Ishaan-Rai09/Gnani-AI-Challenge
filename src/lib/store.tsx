"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getScenario } from "@/lib/scenarios";
import {
  buildSeedBlocklist,
  buildSeedCalls,
  buildSeedNotifications,
  DEFAULT_ASSISTANT,
  DEFAULT_PROFILE,
} from "@/lib/seed";
import { callSimulationService } from "@/lib/services/callSimulationService";
import type {
  AssistantSettings,
  BlockedNumber,
  CallAction,
  CallRecord,
  LiveSession,
  NotificationItem,
  Profile,
  Scenario,
} from "@/lib/types";
import { uid } from "@/lib/utils";

const STORAGE_KEY = "callshield.v1";

export type ToastTone = "success" | "risk" | "neutral";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface PersistedData {
  calls: CallRecord[];
  blocklist: BlockedNumber[];
  notifications: NotificationItem[];
  assistant: AssistantSettings;
  profile: Profile;
}

interface CallShieldContextValue {
  hydrated: boolean;
  calls: CallRecord[];
  blocklist: BlockedNumber[];
  notifications: NotificationItem[];
  unreadCount: number;
  assistant: AssistantSettings;
  profile: Profile;
  session: LiveSession | null;
  toasts: Toast[];
  /** Held while call audio is playing so scripted lines stay in sync with the voices. */
  setSpeechHold: (hold: boolean) => void;
  startSimulation: (scenarioId: string) => boolean;
  answerWithAI: () => void;
  declineCall: () => void;
  takeOver: () => void;
  sendUserMessage: (text: string) => void;
  allowCaller: () => void;
  endCall: () => void;
  blockCaller: () => void;
  dismissSession: () => void;
  addBlockedNumber: (input: { number: string; label: string; reason: string; source?: "manual" | "call" }) => boolean;
  removeBlockedNumber: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateAssistant: (patch: Partial<AssistantSettings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  resetDemoData: () => void;
  seedHistory: () => void;
  clearHistory: () => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const CallShieldContext = createContext<CallShieldContextValue | null>(null);

function normalizeNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function CallShieldProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    const calls = buildSeedCalls();
    return {
      calls,
      blocklist: buildSeedBlocklist(),
      notifications: buildSeedNotifications(calls),
    };
  });

  const [hydrated, setHydrated] = useState(false);
  const [calls, setCalls] = useState<CallRecord[]>(initial.calls);
  const [blocklist, setBlocklist] = useState<BlockedNumber[]>(initial.blocklist);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initial.notifications
  );
  const [assistant, setAssistant] = useState<AssistantSettings>(DEFAULT_ASSISTANT);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notifiedSessions = useRef<Set<string>>(new Set());
  const speechHoldRef = useRef(false);

  const setSpeechHold = useCallback((hold: boolean) => {
    speechHoldRef.current = hold;
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedData>;
        if (Array.isArray(parsed.calls)) setCalls(parsed.calls);
        if (Array.isArray(parsed.blocklist)) setBlocklist(parsed.blocklist);
        if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
        if (parsed.assistant) {
          setAssistant({ ...DEFAULT_ASSISTANT, ...parsed.assistant });
        }
        if (parsed.profile) setProfile({ ...DEFAULT_PROFILE, ...parsed.profile });
      }
    } catch {
      // Corrupted storage should never block the demo.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const data: PersistedData = { calls, blocklist, notifications, assistant, profile };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage may be unavailable (private mode). The session still works in memory.
    }
  }, [hydrated, calls, blocklist, notifications, assistant, profile]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushNotification = useCallback(
    (input: Omit<NotificationItem, "id" | "createdAt" | "read">) => {
      setNotifications((prev) => [
        {
          ...input,
          id: uid("note"),
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    },
    []
  );

  /* ---------------------------- call scheduling ---------------------------- */

  useEffect(() => {
    if (!session) return;
    if (session.phase !== "screening" && session.phase !== "user") return;

    const interval = window.setInterval(() => {
      setSession((prev) => {
        if (!prev || (prev.phase !== "screening" && prev.phase !== "user")) return prev;
        const scenario = getScenario(prev.scenarioId);
        if (!scenario) return prev;
        // One line per tick; pause reveals entirely while a voice line plays.
        const maxSteps = speechHoldRef.current ? 0 : 1;
        return callSimulationService.tick(prev, scenario, prev.elapsedSec + 1, maxSteps);
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session?.id, session?.phase]);

  useEffect(() => {
    if (!session) return;
    if (
      session.answeredByAI &&
      session.riskLevel === "high" &&
      assistant.notifySuspicious &&
      !notifiedSessions.current.has(session.id)
    ) {
      notifiedSessions.current.add(session.id);
      pushNotification({
        title: "A suspicious caller was detected",
        body: `${session.callerName ?? "An unknown caller"} triggered high-risk signals during live screening.`,
        tone: "risk",
        href: "/app/live",
      });
      pushToast({
        title: "High-risk signals detected",
        description: "The intelligence panel has updated with new indicators.",
        tone: "risk",
      });
    }
  }, [session, assistant.notifySuspicious, pushNotification, pushToast]);

  /* ------------------------------- call actions ----------------------------- */

  const startSimulation = useCallback(
    (scenarioId: string) => {
      if (session && (session.phase === "ringing" || session.phase === "screening" || session.phase === "user")) {
        pushToast({
          title: "A simulated call is already active",
          description: "Finish or dismiss it before starting another one.",
          tone: "neutral",
        });
        return false;
      }
      const scenario = getScenario(scenarioId);
      if (!scenario) return false;
      setSession(callSimulationService.createSession(scenario));
      pushToast({
        title: "Simulated incoming call",
        description: `${scenario.number} is calling. No real phone line is involved.`,
        tone: "neutral",
      });
      return true;
    },
    [session, pushToast]
  );

  const answerWithAI = useCallback(() => {
    if (!session) return;
    if (!assistant.screeningEnabled) {
      pushToast({
        title: "AI screening is turned off",
        description: "Enable it in AI Assistant settings to let the assistant answer.",
        tone: "risk",
      });
      return;
    }
    setSession((prev) => (prev ? callSimulationService.answer(prev, assistant) : prev));
  }, [session, assistant, pushToast]);

  const finish = useCallback(
    (action: CallAction) => {
      if (!session) return;
      const scenario = getScenario(session.scenarioId);
      if (!scenario) return;
      const record = callSimulationService.finalize(session, scenario, action);
      setCalls((prev) => [record, ...prev]);
      setSession((prev) => (prev ? { ...prev, phase: "ended", outcome: action } : prev));

      if (action === "blocked") {
        setBlocklist((prev) => {
          const exists = prev.some(
            (item) => normalizeNumber(item.number) === normalizeNumber(record.number)
          );
          if (exists) return prev;
          return [
            {
              id: uid("blk"),
              number: record.number,
              label: record.claimedOrg ?? record.callerName ?? "Unknown caller",
              reason:
                record.riskLevel === "low"
                  ? "Blocked from live screening."
                  : `Blocked after screening. ${record.indicators
                      .slice(0, 2)
                      .map((indicator) => indicator.label.toLowerCase())
                      .join("; ")}.`,
              source: "call",
              blockedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
        if (assistant.notifyBlocked) {
          pushNotification({
            title: "Caller added to your blocklist",
            body: `${record.number} was blocked from live screening.`,
            tone: "risk",
            callId: record.id,
            href: `/app/history/${record.id}`,
          });
        }
        pushToast({ title: "Caller blocked", description: `${record.number} is now on your blocklist.`, tone: "risk" });
      }

      if (action === "allowed") {
        if (assistant.notifySummaries) {
          pushNotification({
            title: "Caller allowed through",
            body: `${record.callerName ?? record.claimedOrg ?? record.number} was marked as trusted.`,
            tone: "success",
            callId: record.id,
            href: `/app/history/${record.id}`,
          });
        }
        pushToast({ title: "Caller allowed", description: "The decision and transcript were saved.", tone: "success" });
      }

      if (action === "ended" || action === "declined") {
        if (assistant.notifySummaries) {
          pushNotification({
            title: action === "declined" ? "Call declined" : "Call screening report ready",
            body:
              action === "declined"
                ? `The simulated call from ${record.number} was declined.`
                : `A summary for ${record.number} is ready with ${record.indicators.length} recorded signal${record.indicators.length === 1 ? "" : "s"}.`,
            tone: record.riskLevel === "high" ? "risk" : "info",
            callId: record.id,
            href: `/app/history/${record.id}`,
          });
        }
        pushToast({
          title: action === "declined" ? "Call declined" : "Call ended",
          description: "The interaction was saved to call history.",
          tone: "neutral",
        });
      }
    },
    [session, assistant.notifyBlocked, assistant.notifySummaries, pushNotification, pushToast]
  );

  const declineCall = useCallback(() => finish("declined"), [finish]);
  const allowCaller = useCallback(() => finish("allowed"), [finish]);
  const endCall = useCallback(() => finish("ended"), [finish]);
  const blockCaller = useCallback(() => finish("blocked"), [finish]);

  const takeOver = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.phase !== "screening") return prev;
      return callSimulationService.takeOver(prev);
    });
    pushToast({
      title: "You are now handling this call",
      description: "The AI assistant has stopped speaking and is taking notes.",
      tone: "neutral",
    });
  }, [pushToast]);

  const sendUserMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSession((prev) => {
      if (!prev || prev.phase !== "user") return prev;
      return callSimulationService.speakAsUser(prev, trimmed);
    });
  }, []);

  const dismissSession = useCallback(() => {
    setSession((prev) => {
      if (prev && (prev.phase === "screening" || prev.phase === "user")) return prev;
      return null;
    });
  }, []);

  /* ------------------------------ blocklist -------------------------------- */

  const addBlockedNumber = useCallback(
    (input: { number: string; label: string; reason: string; source?: "manual" | "call" }) => {
      const number = input.number.trim();
      if (number.length < 6) {
        pushToast({ title: "Enter a valid phone number", tone: "risk" });
        return false;
      }
      if (
        blocklist.some(
          (item) => normalizeNumber(item.number) === normalizeNumber(number)
        )
      ) {
        pushToast({
          title: "Number already blocked",
          description: `${number} is already on your blocklist.`,
          tone: "neutral",
        });
        return false;
      }
      setBlocklist((prev) => [
        {
          id: uid("blk"),
          number,
          label: input.label.trim() || "Manually blocked number",
          reason: input.reason.trim() || "Added manually from the blocklist page.",
          source: input.source ?? "manual",
          blockedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      if (assistant.notifyBlocked) {
        pushNotification({
          title: "Number added to your blocklist",
          body: `${number} was added. You can remove it at any time.`,
          tone: "info",
          href: "/app/blocklist",
        });
      }
      pushToast({ title: "Number blocked", description: `${number} was added to your blocklist.`, tone: "success" });
      return true;
    },
    [assistant.notifyBlocked, blocklist, pushNotification, pushToast]
  );

  const removeBlockedNumber = useCallback(
    (id: string) => {
      setBlocklist((prev) => prev.filter((item) => item.id !== id));
      pushToast({ title: "Number removed from blocklist", tone: "neutral" });
    },
    [pushToast]
  );

  /* ----------------------------- notifications ----------------------------- */

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  /* ------------------------------- settings -------------------------------- */

  const updateAssistant = useCallback((patch: Partial<AssistantSettings>) => {
    setAssistant((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetDemoData = useCallback(() => {
    const nextCalls = buildSeedCalls();
    setCalls(nextCalls);
    setBlocklist(buildSeedBlocklist());
    setNotifications(buildSeedNotifications(nextCalls));
    setAssistant(DEFAULT_ASSISTANT);
    setProfile(DEFAULT_PROFILE);
    setSession(null);
    notifiedSessions.current.clear();
    speechHoldRef.current = false;
    pushToast({ title: "Demo data restored", description: "Calls, blocklist, and settings were reset.", tone: "success" });
  }, [pushToast]);

  const seedHistory = useCallback(() => {
    const nextCalls = buildSeedCalls();
    setCalls(nextCalls);
    pushToast({ title: "Demo history added", description: `${nextCalls.length} sample calls are ready to explore.`, tone: "success" });
  }, [pushToast]);

  const clearHistory = useCallback(() => {
    setCalls([]);
    pushToast({ title: "Call history cleared", description: "You can restore sample calls at any time.", tone: "neutral" });
  }, [pushToast]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo<CallShieldContextValue>(
    () => ({
      hydrated,
      calls,
      blocklist,
      notifications,
      unreadCount,
      assistant,
      profile,
      session,
      toasts,
      setSpeechHold,
      startSimulation,
      answerWithAI,
      declineCall,
      takeOver,
      sendUserMessage,
      allowCaller,
      endCall,
      blockCaller,
      dismissSession,
      addBlockedNumber,
      removeBlockedNumber,
      markNotificationRead,
      markAllNotificationsRead,
      updateAssistant,
      updateProfile,
      resetDemoData,
      seedHistory,
      clearHistory,
      pushToast,
      dismissToast,
    }),
    [
      hydrated,
      calls,
      blocklist,
      notifications,
      unreadCount,
      assistant,
      profile,
      session,
      toasts,
      setSpeechHold,
      startSimulation,
      answerWithAI,
      declineCall,
      takeOver,
      sendUserMessage,
      allowCaller,
      endCall,
      blockCaller,
      dismissSession,
      addBlockedNumber,
      removeBlockedNumber,
      markNotificationRead,
      markAllNotificationsRead,
      updateAssistant,
      updateProfile,
      resetDemoData,
      seedHistory,
      clearHistory,
      pushToast,
      dismissToast,
    ]
  );

  return <CallShieldContext.Provider value={value}>{children}</CallShieldContext.Provider>;
}

export function useCallShield(): CallShieldContextValue {
  const context = useContext(CallShieldContext);
  if (!context) throw new Error("useCallShield must be used inside CallShieldProvider");
  return context;
}

export function scenarioFor(session: LiveSession | null): Scenario | undefined {
  return session ? getScenario(session.scenarioId) : undefined;
}
