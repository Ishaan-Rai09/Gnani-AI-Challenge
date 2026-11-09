import { Phone } from "lucide-react";
import { cx } from "@/lib/utils";

export function CallerAvatar({
  name,
  size = "md",
  className,
}: {
  name: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    ?.split(" ")
    .filter((part) => !part.startsWith("("))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-ash font-display font-semibold text-ink/60",
        size === "sm" && "h-8 w-8 text-[10px]",
        size === "md" && "h-9 w-9 text-[11px]",
        size === "lg" && "h-12 w-12 text-[13px]",
        className
      )}
    >
      {initials || <Phone className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={1.7} />}
    </span>
  );
}
