"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/components/app/navItems";
import { useCallShield } from "@/lib/store";
import { cx } from "@/lib/utils";

const items = NAV_ITEMS.filter((item) => item.href !== "/app/settings");

export function MobileTabBar() {
  const pathname = usePathname();
  const { session } = useCallShield();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/98 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = isNavActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center gap-1 py-2.5"
            >
              <span className="relative">
                <Icon
                  className={cx("h-[18px] w-[18px]", active ? "text-signal" : "text-ink/40")}
                  strokeWidth={active ? 2.1 : 1.8}
                />
                {item.href === "/app/live" && session && session.phase !== "ended" && (
                  <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-signal ring-2 ring-paper" />
                )}
              </span>
              <span
                className={cx(
                  "text-[9px] font-medium",
                  active ? "text-ink" : "text-ink/40"
                )}
              >
                {item.short}
              </span>
              {active && <span className="absolute -top-px h-0.5 w-7 bg-signal" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
