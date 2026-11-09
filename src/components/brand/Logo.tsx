import { cx } from "@/lib/utils";

export function ShieldMark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 36"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 1.8 30.2 6.8v12.1c0 8.3-6.3 14.5-14.2 17.3C8.1 33.4 1.8 27.2 1.8 18.9V6.8L16 1.8Z"
        fill={inverted ? "#F5F3ED" : "#151B26"}
      />
      <path
        d="m9.6 18.4 4.5 4.5 8.6-9.4"
        stroke="#FF6B35"
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Logo({
  inverted = false,
  className,
  compact = false,
}: {
  inverted?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <ShieldMark className="h-[26px] w-[23px] shrink-0" inverted={inverted} />
      {!compact && (
        <span
          className={cx(
            "font-display text-[19px] font-bold tracking-[-0.04em]",
            inverted ? "text-ivory" : "text-ink"
          )}
        >
          CallShield
        </span>
      )}
    </span>
  );
}
