"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PhoneIncoming, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SCENARIOS } from "@/lib/scenarios";
import { useCallShield } from "@/lib/store";
import { cx } from "@/lib/utils";

export function ScenarioPicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { startSimulation } = useCallShield();
  const router = useRouter();
  const [selected, setSelected] = useState("bank-impersonation");

  useEffect(() => {
    if (open) setSelected("bank-impersonation");
  }, [open]);

  function launch() {
    if (startSimulation(selected)) {
      onClose();
      router.push("/app/live");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Simulate an incoming call"
      description="Pick a scripted caller. The assistant will answer on your behalf — no real phone line is involved."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10.5px] text-muted">
            Simulated call · fictional caller · no cellular access
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={launch}>
              Start simulated call
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    >
      <div
        role="radiogroup"
        aria-label="Call scenario"
        className="grid gap-2 sm:grid-cols-2"
      >
        {SCENARIOS.map((scenario) => {
          const active = selected === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(scenario.id)}
              className={cx(
                "group relative rounded-lg border p-3.5 text-left transition-all duration-150",
                active
                  ? "border-ink bg-ivory shadow-[inset_0_0_0_1px_#151B26]"
                  : "border-line bg-white hover:border-ink/25"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {scenario.category}
                </span>
                <RiskBadge level={scenario.expectedRisk} size="sm" showIcon={false} />
              </div>
              <p className="mt-2 text-[13px] font-semibold text-ink">{scenario.name}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                {scenario.blurb}
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-line/80 pt-2">
                <span className="font-display text-[11px] tabular-nums text-ink/60">
                  {scenario.number}
                </span>
                <span
                  className={cx(
                    "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                    active ? "border-signal bg-signal" : "border-ink/20 bg-white"
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-signal/25 bg-signal/[0.06] px-3.5 py-3">
        {selected ? (
          <>
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
            <p className="text-[10.5px] leading-relaxed text-ink/60">
              <span className="font-semibold text-ink">Demo note:</span> these are fictional callers
              and scripts. CallShield cannot answer or intercept real calls in this prototype.
            </p>
          </>
        ) : (
          <p className="flex items-center gap-2 text-[11px] text-muted">
            <PhoneIncoming className="h-3.5 w-3.5" />
            Select a scenario to continue.
          </p>
        )}
      </div>
    </Modal>
  );
}
