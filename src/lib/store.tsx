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
import { useSession } from "next-auth/react";
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
  NotificationItem,
  Profile,
  LiveSession,
  Scenario,
} from "@/lib/types";
import { uid } from "@/lib/utils";

const STORAGE_KEY = "callshield.v1";
/** Signed-in users keep device-local prefs (assistant, notifications) separately
 * so signing out never hands server data to the guest demo, and vice versa. */
const ACCOUNT_PREFS_KEY = "callshield.v1.account";

export type ToastTone = "success" | "risk" | "neutral";

export type AccountStatus = "loading" | "google" | "guest";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  image: string | null;
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
  /** "loading" while the session resolves; "google" when signed in; "guest" otherwise. */
  accountStatus: AccountStatus;
  /** The signed-in Google account, or null in guest/demo mode. */
  account: Account | null;
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
  const { data: sessionData, status: sessionStatus } = useSession();
  const account = useMemo<Account | null>(() => {
    const user = sessionData?.user;
    if (sessionStatus !== "authenticated" || !user?.id || !user.email) return null;
    return {
      id: user.id,
      name: user.name ?? "CallShield user",
      email: user.email,
      image: user.image ?? null,
    };
  }, [sessionData, sessionStatus]);

  const accountStatus: AccountStatus =
    sessionStatus === "loading" ? "loading" : account ? "google" : "guest";

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
  const [demoProfile, setDemoProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notifiedSessions = useRef<Set<string>>(new Set());
  const speechHoldRef = useRef(false);

  const setSpeechHold = useCallback((hold: boolean) => {
    speechHoldRef.current = hold;
  }, []);

  /* ------------------------------ data source ------------------------------ */

  // Guests: hydrate the original local-storage demo blob once.
  useEffect(() => {
    if (sessionStatus !== "unauthenticated") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedData>;
        if (Array.isArray(parsed.calls)) setCalls(parsed.calls);
        if (Array.isArray(parsed.blocklist)) setBlocklist(parsed.blocklist);
        if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
        if (parsed.assistant) setAssistant({ ...DEFAULT_ASSISTANT, ...parsed.assistant });
        if (parsed.profile) setDemoProfile({ ...DEFAULT_PROFILE, ...parsed.profile });
      }
    } catch {
      // Corrupted storage should never block the demo.
    }
    setHydrated(true);
  }, [sessionStatus]);

  // Signed-in users: hydrate per-user history and blocklist from the database.
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !account) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/user/state", { cache: "no-store" });
        if (!response.ok) throw new Error("state fetch failed");
        const data = (await response.json()) as {
          calls: CallRecord[];
          blocklist: BlockedNumber[];
        };
        if (cancelled) return;
        setCalls(data.calls);
        setBlocklist(data.blocklist);
        try {
          const raw = window.localStorage.getItem(ACCOUNT_PREFS_KEY);
          if (raw) {
            const prefs = JSON.parse(raw) as {
              assistant?: AssistantSettings;
              notifications?: NotificationItem[];
              phone?: string;
            };
            if (prefs.assistant) setAssistant({ ...DEFAULT_ASSISTANT, ...prefs.assistant });
            if (Array.isArray(prefs.notifications)) setNotifications(prefs.notifications);
            if (typeof prefs.phone === "string") {
              setDemoProfile((prev) => ({ ...prev, phone: prefs.phone as string }));
            }
          }
        } catch {
          // Ignore malformed prefs.
        }
      } catch {
        if (!cancelled) {
          setCalls([]);
          setBlocklist([]);
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, account]);

  // Guests persist the full demo blob; signed-in users persist only their
  // device-local assistant settings and notifications.
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (sessionStatus === "unauthenticated") {
        const data: PersistedData = { calls, blocklist, notifications, assistant, profile: demoProfile };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else if (sessionStatus === "authenticated") {
        window.localStorage.setItem(
          ACCOUNT_PREFS_KEY,
          JSON.stringify({ assistant, notifications, phone: demoProfile.phone })
        );
      }
    } catch {
      // Storage may be unavailable (private mode). The session still works in memory.
    }
  }, [hydrated, sessionStatus, calls, blocklist, notifications, assistant, demoProfile]);

  /** Best-effort server sync for signed-in users; local state already updated. */
  const syncServer = useCallback(
    (input: string, init?: RequestInit) => {
      if (sessionStatus !== "authenticated") return;
      void fetch(input, { cache: "no-store", ...init }).catch(() => {
        // The local session keeps working; the next sign-in re-syncs from the DB.
      });
    },
    [sessionStatus]
  );

  /* --------------------------------- toasts -------------------------------- */

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

  /* -------------------------------- profile -------------------------------- */

  // Signed-in users see their real Google identity, not the demo profile.
  const profile = useMemo<Profile>(
    () =>
      account
        ? {
            name: account.name,
            email: account.email,
            phone: demoProfile.phone,
            plan: "Google account",
            image: account.image,
          }
        : demoProfile,
    [account, demoProfile]
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      if (account) {
        // Name and email come from Google and cannot be edited here, but the
        // phone label is device-local and stays editable.
        const identityChanged =
          (patch.name !== undefined && patch.name !== account.name) ||
          (patch.email !== undefined && patch.email !== account.email);
        if (identityChanged) {
          pushToast({
            title: "Profile managed by Google",
            description: "Your name and photo come from your Google account.",
            tone: "neutral",
          });
        }
        if (patch.phone !== undefined) {
          const phone = patch.phone;
          setDemoProfile((prev) => ({ ...prev, phone }));
        }
        return;
      }
      setDemoProfile((prev) => ({ ...prev, ...patch }));
    },
    [account, pushToast]
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
      syncServer("/api/user/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      setSession((prev) => (prev ? { ...prev, phase: "ended", outcome: action } : prev));

      if (action === "blocked") {
        const entry: BlockedNumber = {
          id: record.id,
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
        };
        setBlocklist((prev) => {
          const exists = prev.some(
            (item) => normalizeNumber(item.number) === normalizeNumber(record.number)
          );
          if (exists) return prev;
          return [entry, ...prev];
        });
        syncServer("/api/user/blocklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
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
    [session, assistant.notifyBlocked, assistant.notifySummaries, pushNotification, pushToast, syncServer]
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
      const scenario = getScenario(prev.scenarioId);
      return callSimulationService.speakAsUser(prev, trimmed, scenario);
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
      const entry: BlockedNumber = {
        id: uid("blk"),
        number,
        label: input.label.trim() || "Manually blocked number",
        reason: input.reason.trim() || "Added manually from the blocklist page.",
        source: input.source ?? "manual",
        blockedAt: new Date().toISOString(),
      };
      setBlocklist((prev) => [entry, ...prev]);
      syncServer("/api/user/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
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
    [assistant.notifyBlocked, blocklist, pushNotification, pushToast, syncServer]
  );

  const removeBlockedNumber = useCallback(
    (id: string) => {
      setBlocklist((prev) => prev.filter((item) => item.id !== id));
      syncServer(`/api/user/blocklist?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      pushToast({ title: "Number removed from blocklist", tone: "neutral" });
    },
    [pushToast, syncServer]
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

  const resetDemoData = useCallback(() => {
    notifiedSessions.current.clear();
    speechHoldRef.current = false;
    if (account) {
      syncServer("/api/user/state", { method: "POST" });
      const nextCalls = buildSeedCalls();
      setCalls(nextCalls);
      setBlocklist(buildSeedBlocklist());
      setNotifications(buildSeedNotifications(nextCalls));
      setAssistant(DEFAULT_ASSISTANT);
      setSession(null);
      pushToast({ title: "Account data restored", description: "Calls and blocklist were reset to the seeded demo state.", tone: "success" });
      return;
    }
    const nextCalls = buildSeedCalls();
    setCalls(nextCalls);
    setBlocklist(buildSeedBlocklist());
    setNotifications(buildSeedNotifications(nextCalls));
    setAssistant(DEFAULT_ASSISTANT);
    setDemoProfile(DEFAULT_PROFILE);
    setSession(null);
    pushToast({ title: "Demo data restored", description: "Calls, blocklist, and settings were reset.", tone: "success" });
  }, [account, pushToast, syncServer]);

  const seedHistory = useCallback(() => {
    if (account) {
      syncServer("/api/user/calls/seed", { method: "POST" });
      const nextCalls = [...buildSeedCalls(), ...calls];
      setCalls(nextCalls);
      pushToast({ title: "Sample calls added", description: `${nextCalls.length} calls are in your account history.`, tone: "success" });
      return;
    }
    const nextCalls = buildSeedCalls();
    setCalls(nextCalls);
    pushToast({ title: "Demo history added", description: `${nextCalls.length} sample calls are ready to explore.`, tone: "success" });
  }, [account, calls, pushToast, syncServer]);

  const clearHistory = useCallback(() => {
    setCalls([]);
    syncServer("/api/user/calls", { method: "DELETE" });
    pushToast({ title: "Call history cleared", description: "You can reload sample calls at any time.", tone: "neutral" });
  }, [pushToast, syncServer]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo<CallShieldContextValue>(
    () => ({
      hydrated,
      accountStatus,
      account,
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
      accountStatus,
      account,
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
