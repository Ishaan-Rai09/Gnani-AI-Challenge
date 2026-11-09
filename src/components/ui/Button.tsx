import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";

type Variant = "primary" | "ink" | "outline" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-signal text-ink hover:bg-[#ff7a49] active:bg-[#f05f28] shadow-signal",
  ink: "bg-ink text-ivory hover:bg-inkSoft active:bg-[#0f141c]",
  outline:
    "border border-ink/20 bg-transparent text-ink hover:border-ink/45 hover:bg-ink/[0.03]",
  ghost: "bg-transparent text-ink hover:bg-ink/[0.05]",
  quiet: "bg-white text-ink border border-line hover:border-ink/25 hover:bg-white",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5",
  md: "h-10 px-4 text-[13.5px] gap-2",
  lg: "h-12 px-6 text-[14.5px] gap-2.5",
};

const baseClass =
  "inline-flex select-none items-center justify-center rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "ink", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        baseClass,
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  );
});

export function ButtonLink({
  href,
  children,
  variant = "ink",
  size = "md",
  className,
  ...props
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link
      href={href}
      className={cx(baseClass, variantClass[variant], sizeClass[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
