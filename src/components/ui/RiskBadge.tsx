import { ShieldCheck, CircleAlert, TriangleAlert } from "lucide-react";
import { RISK_META } from "@/lib/risk";
import type { RiskLevel } from "@/lib/types";
import { cx } from "@/lib/utils";

const style: Record<RiskLevel, string> = {
  low: "border-line bg-white/70 text-ink/70",
  attention: "border-signal/45 bg-signal/10 text-ink",
  high: "border-ink bg-ink text-ivory",
};

const dot: Record<RiskLevel, string> = {
  low: "bg-ink/35",
  attention: "bg-signal",
  high: "bg-signal",
};

const Icon: Record<RiskLevel, typeof ShieldCheck> = {
  low: ShieldCheck,
  attention: CircleAlert,
  high: TriangleAlert,
};

export function RiskBadge({
  level,
  size = "sm",
  showIcon = true,
  className,
}: {
  level: RiskLevel;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}) {
  const Glyph = Icon[level];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        style[level],
        className
      )}
    >
      {showIcon ? (
        <Glyph className="h-3 w-3 shrink-0" strokeWidth={2.2} />
      ) : (
        <span className={cx("h-1.5 w-1.5 rounded-full", dot[level])} />
      )}
      {RISK_META[level].label}
    </span>
  );
}

export function RiskDot({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cx(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        level === "low" && "bg-ink/25",
        level === "attention" && "bg-signal",
        level === "high" && "bg-signal ring-2 ring-signal/25",
        className
      )}
    />
  );
}
