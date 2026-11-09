"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Download,
  Info,
  Lock,
  LogOut,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCallShield } from "@/lib/store";
import { initials } from "@/lib/format";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function SettingsView() {
  const {
    profile,
    accountStatus,
    updateProfile,
    calls,
    blocklist,
    notifications,
    assistant,
    resetDemoData,
    clearHistory,
    seedHistory,
    pushToast,
  } = useCallShield();

  const [phone, setPhone] = useState(profile.phone);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPhone(profile.phone);
  }, [profile]);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      pushToast({
        title: "Install from your browser",
        description: "Use the browser menu and choose Install app or Add to Home Screen.",
        tone: "neutral",
      });
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      pushToast({ title: "CallShield installed", tone: "success" });
      setInstalled(true);
    }
    setInstallPrompt(null);
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      assistant,
      calls,
      blocklist,
      notifications,
      note: "CallShield demo export. All callers are fictional.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "callshield-demo-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast({ title: "Data exported", description: "A JSON file was downloaded.", tone: "success" });
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
          Account · Google
        </p>
        <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">
          Your account, your data.
        </h2>
        <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-muted">
          You're signed in with Google. Your call history and blocklist are saved to your account
          and follow you across devices.
        </p>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-3">
          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">Profile</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              Your name, email, and photo come straight from your Google account.
            </p>

            <div className="mt-4 flex items-center gap-3 border-b border-line pb-4">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-ivory">
                  {initials(profile.name || "CallShield")}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold">{profile.name || "Your name"}</p>
                <p className="truncate text-[10px] text-muted">{profile.email}</p>
              </div>
              {accountStatus === "loading" ? null : (
                <span className="ml-auto shrink-0 rounded-full border border-line bg-white px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted">
                  Google account
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="account-name" className="mb-1.5 block text-[11px] font-medium text-ink/70">
                  Full name
                </label>
                <input id="account-name" value={profile.name} readOnly className="input-base opacity-70" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="account-email" className="mb-1.5 block text-[11px] font-medium text-ink/70">
                    Email
                  </label>
                  <input id="account-email" value={profile.email} readOnly className="input-base opacity-70" />
                </div>
                <div>
                  <label htmlFor="account-phone" className="mb-1.5 block text-[11px] font-medium text-ink/70">
                    Phone label
                  </label>
                  <input
                    id="account-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    onBlur={() => updateProfile({ phone: phone.trim() })}
                    className="input-base"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[9.5px] text-muted">Manage your photo and name at myaccount.google.com.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">Data controls</h3>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              These controls affect the data saved to your account. Sample callers are fictional.
            </p>

            <div className="mt-3 divide-y divide-line/70">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[11.5px] font-medium text-ink/80">Restore sample data</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Reset calls, blocklist, notifications, and assistant to their seeded state.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                  Reset everything
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[11.5px] font-medium text-ink/80">Call history</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {calls.length} saved calls. Clearing keeps your blocklist and settings.
                  </p>
                </div>
                {calls.length === 0 ? (
                  <Button variant="outline" size="sm" onClick={seedHistory}>
                    Load sample calls
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setConfirmClear(true)}>
                    <Trash2 className="h-3 w-3" />
                    Clear history
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[11.5px] font-medium text-ink/80">Export data</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Download a JSON snapshot of calls, blocklist, settings, and notifications.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-3 w-3" />
                  Export JSON
                </Button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-3">
          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">Install the app</h3>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              CallShield is a Progressive Web App. Install it for a standalone, mobile-first view
              with an offline fallback.
            </p>
            <Button variant="ink" size="sm" className="mt-3" onClick={install} disabled={installed}>
              <MonitorSmartphone className="h-3 w-3" />
              {installed ? "App installed" : "Install CallShield"}
            </Button>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3">
              <p className="flex items-center justify-between text-[9.5px] text-muted">
                <span>Manifest &amp; icons</span>
                <span className="text-ink/55">Ready</span>
              </p>
              <p className="flex items-center justify-between text-[9.5px] text-muted">
                <span>Service worker</span>
                <span className="text-ink/55">Caching enabled</span>
              </p>
              <p className="flex items-center justify-between text-[9.5px] text-muted">
                <span>Offline fallback</span>
                <span className="text-ink/55">Available</span>
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-ink/40" />
              <h3 className="text-[13.5px] font-semibold">Privacy &amp; storage</h3>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Calls, transcripts, and blocklist entries are saved to your account on the CallShield
              server. Assistant settings stay on this device. No call audio is captured.
            </p>
            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">Saved calls</span>
                <span className="font-display text-[11px] tabular-nums">{calls.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">Blocked numbers</span>
                <span className="font-display text-[11px] tabular-nums">{blocklist.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">Notifications</span>
                <span className="font-display text-[11px] tabular-nums">{notifications.length}</span>
              </div>
            </div>
            <Link
              href="/legal#privacy"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-ink/50 transition-colors hover:text-ink"
            >
              <Info className="h-3 w-3" />
              Read the prototype privacy notes
            </Link>
          </section>

          <section className="rounded-xl border border-signal/25 bg-signal/[0.05] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-signal" />
              <h3 className="text-[13.5px] font-semibold">Prototype reminder</h3>
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-ink/60">
              CallShield does not intercept real cellular calls, and no caller in this workspace is
              a real person or organisation. Risk labels are heuristic signals, not proof of fraud.
            </p>
            <Link
              href="/app/assistant"
              className="mt-3 inline-flex text-[10px] font-medium text-ink/55 underline decoration-signal/60 underline-offset-4 hover:text-ink"
            >
              Review assistant settings
            </Link>
          </section>

          <p className="px-1 text-[9px] text-muted">
            CallShield prototype · v0.1 · Google account mode
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDemoData}
        title="Reset account data?"
        description="Calls, blocklist entries, notifications, and settings will be replaced with the seeded state."
        confirmLabel="Reset account data"
        cancelLabel="Keep my data"
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearHistory}
        title="Clear call history?"
        description="All saved calls and transcripts will be removed. Your blocklist and settings stay. You can reload sample calls later."
        confirmLabel="Clear history"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  );
}
