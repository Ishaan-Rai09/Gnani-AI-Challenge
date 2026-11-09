import { Ban, Check, PhoneOff, X, UserCheck } from "lucide-react";
import type { CallAction } from "@/lib/types";
import { cx } from "@/lib/utils";

const META: Record<
  CallAction,
  { label: string; icon: typeof Ban; className: string }
> = {
  blocked: { label: "Blocked", icon: Ban, className: "border-ink bg-ink text-ivory" },
  allowed: { label: "Allowed", icon: Check, className: "border-ink/25 bg-white text-ink" },
  ended: { label: "Ended", icon: PhoneOff, className: "border-line bg-white text-ink/60" },
  declined: { label: "Declined", icon: X, className: "border-line bg-white text-ink/60" },
};

export function ActionTag({
  action,
  withIcon = true,
  className,
}: {
  action: CallAction;
  withIcon?: boolean;
  className?: string;
}) {
  const meta = META[action] ?? META.ended;
  const Icon = meta.icon ?? UserCheck;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
        meta.className,
        className
      )}
    >
      {withIcon && <Icon className="h-2.5 w-2.5" />}
      {meta.label}
    </span>
  );
}
