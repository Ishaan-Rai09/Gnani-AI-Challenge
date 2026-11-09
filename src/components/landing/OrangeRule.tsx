import { cx } from "@/lib/utils";

export function OrangeRule({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("block h-[2px] bg-signal", className)} />;
}
