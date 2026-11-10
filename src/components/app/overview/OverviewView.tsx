"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, PhoneIncoming } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScenarioPicker } from "@/components/app/ScenarioPicker";
import { StatsGrid } from "@/components/app/overview/StatsGrid";
import { LivePanel } from "@/components/app/overview/LivePanel";
import { RecentActivity } from "@/components/app/overview/RecentActivity";
import { ShieldRail } from "@/components/app/overview/ShieldRail";
import { useCallShield } from "@/lib/store";
import { formatDate } from "@/lib/format";

export function OverviewView() {
  const { calls, assistant, profile } = useCallShield();
  const [pickerOpen, setPickerOpen] = useState(false);

  const attention = calls.filter(
    (call) => call.riskLevel !== "low" && call.action === "ended"
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span>Workspace overview</span>
            <span className="h-2.5 w-px bg-ink/15" />
            <span>
              {formatDate(new Date().toISOString())}
            </span>
            <span className="border border-line bg-paper px-1.5 py-0.5 text-[8.5px] tracking-[0.1em]">
              Simulated calls
            </span>
          </div>
          <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">
            Your line, under control.
          </h2>
          <p className="mt-2 text-[12.5px] text-muted">
            Welcome back, {profile.name.split(" ")[0]}.{" "}
            {attention > 0
              ? `${attention} screened ${attention === 1 ? "call is" : "calls are"} waiting for your decision.`
              : "Every screened call has a decision. Nothing is waiting on you."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/app/history" variant="outline" size="md">
            Review history
          </ButtonLink>
          <Button variant="primary" onClick={() => setPickerOpen(true)}>
            <PhoneIncoming className="h-4 w-4" />
            Simulate Incoming Call
          </Button>
        </div>
      </div>

      {!assistant.screeningEnabled && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-signal/35 bg-signal/[0.07] px-4 py-3">
          <p className="flex items-center gap-2 text-[11.5px] text-ink/70">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-signal" />
            AI screening is paused. Unknown callers will not be screened while it is off.
          </p>
          <Link
            href="/app/assistant"
            className="text-[10.5px] font-semibold text-ink underline decoration-signal underline-offset-4"
          >
            Turn screening on
          </Link>
        </div>
      )}

      <div className="mt-6">
        <StatsGrid calls={calls} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="min-w-0 space-y-4">
          <LivePanel onOpenPicker={() => setPickerOpen(true)} />
          <RecentActivity />
        </div>
        <div className="min-w-0">
          <ShieldRail />
        </div>
      </div>

      <p className="mt-6 border-t border-line pt-3 text-[9.5px] text-muted">
        All callers, numbers, and organisations in this workspace are fictional. CallShield is a
        simulated prototype and does not access your carrier or phone.
      </p>

      <ScenarioPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
