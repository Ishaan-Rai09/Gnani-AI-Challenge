"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueWithGoogle() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/providers", { cache: "no-store" });
      const providers = (await response.json()) as Record<string, unknown>;
      if (Object.keys(providers).length === 0) {
        setError(
          "Google sign-in isn't configured on this server yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env and restart."
        );
        setBusy(false);
        return;
      }
      void signIn("google", { callbackUrl: "/app" });
    } catch {
      setError("Sign-in is unavailable right now. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-[380px] rounded-2xl border border-line bg-ivory p-7 shadow-[0_24px_60px_-32px_rgba(15,18,25,0.35)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-none tracking-tight">CallShield</p>
            <p className="mt-1 text-[9.5px] uppercase tracking-[0.14em] text-muted">AI call screening</p>
          </div>
        </div>

        <h1 className="mt-6 text-[22px] font-semibold leading-tight tracking-[-0.03em]">
          Sign in to your account
        </h1>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
          Your call history and blocklist stay scoped to your account — each sign-in sees only its
          own data. All callers are simulated; no real phone line is involved.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg border border-signal/30 bg-signal/[0.06] px-3 py-2.5 text-[10.5px] leading-relaxed text-ink/70">
            {error}
          </p>
        ) : null}

        <div className="mt-5 space-y-2.5">
          <Button
            variant="ink"
            className="w-full justify-center"
            onClick={continueWithGoogle}
            disabled={busy}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81"
              />
            </svg>
            {busy ? "Redirecting…" : "Continue with Google"}
          </Button>
        </div>

        <p className="mt-5 border-t border-line pt-4 text-[9px] leading-relaxed text-muted">
          Prototype · Google sign-in stores your name, email, and photo. Call data is saved per
          account; assistant preferences stay on this device.
        </p>
      </div>
    </main>
  );
}
