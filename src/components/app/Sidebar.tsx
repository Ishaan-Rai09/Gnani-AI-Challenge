"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS, isNavActive } from "@/components/app/navItems";
import { useCallShield } from "@/lib/store";
import { initials } from "@/lib/format";
import { cx } from "@/lib/utils";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile, assistant, session } = useCallShield();

  return (
    <div className="flex h-full flex-col bg-ink text-ivory">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Link href="/app" onClick={onNavigate} aria-label="CallShield dashboard">
          <Logo inverted />
        </Link>
        <span className="border border-white/15 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-ivory/40">
          Demo
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-ivory/30">
          Workspace
        </p>
        <nav className="mt-3 space-y-0.5" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150",
                  active
                    ? "bg-signal text-ink"
                    : "text-ivory/55 hover:bg-white/[0.05] hover:text-ivory"
                )}
              >
                <Icon
                  className={cx(
                    "h-[16px] w-[16px] shrink-0",
                    active ? "text-ink" : "text-ivory/40 group-hover:text-ivory/70"
                  )}
                  strokeWidth={1.9}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/app/live" && session && session.phase !== "ended" && !active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                )}
                {active && <ChevronRight className="h-3.5 w-3.5 text-ink/50" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 border-t border-white/10 pt-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ivory/35">
                Shield status
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-signal" />
            </div>
            <p className="mt-2 text-[12.5px] font-medium text-ivory/85">
              {assistant.screeningEnabled ? "AI screening is on" : "AI screening is paused"}
            </p>
            <p className="mt-0.5 text-[10.5px] text-ivory/35">
              {assistant.screeningEnabled
                ? "Unknown callers are answered by your assistant."
                : "Unknown callers will ring through to you."}
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  assistant.screeningEnabled ? "bg-signal" : "bg-white/25"
                )}
              />
              <span className="text-[9.5px] uppercase tracking-[0.12em] text-ivory/30">
                {assistant.screeningMode} mode
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/app/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.05]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory text-[10.5px] font-bold text-ink">
            {initials(profile.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium text-ivory/90">
              {profile.name}
            </span>
            <span className="block truncate text-[10px] text-ivory/35">{profile.plan}</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-ivory/25" />
        </Link>
        <p className="mt-2 flex items-center justify-center gap-1.5 px-2 text-[9px] text-ivory/20">
          <Lock className="h-2.5 w-2.5" />
          Simulated environment · data stays on device
        </p>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/5 lg:block">
      <SidebarContent />
    </aside>
  );
}
