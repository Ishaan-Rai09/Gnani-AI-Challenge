"use client";

import { cx } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-40",
        size === "md" ? "h-6 w-11 p-[3px]" : "h-5 w-9 p-[2px]",
        checked ? "border-signal bg-signal" : "border-ink/15 bg-ink/10"
      )}
    >
      <span
        className={cx(
          "block rounded-full bg-white shadow-sm transition-transform duration-200",
          size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4",
          checked
            ? size === "md"
              ? "translate-x-5"
              : "translate-x-4"
            : "translate-x-0"
        )}
      />
    </button>
  );
}
