"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Smartphone } from "lucide-react";
import { NotificationMenu } from "@/components/app/NotificationMenu";
import { useCallShield } from "@/lib/store";
import { initials } from "@/lib/format";

const titles: Array<{ match: (pathname: string) => boolean; eyebrow: string; title: string }> = [
  { match: (p) => p === "/app", eyebrow: "Workspace", title: "Overview" },
  { match: (p) => p.startsWith("/app/live"), eyebrow: "Real-time", title: "Live Screening" },
  { match: (p) => p.startsWith("/app/history"), eyebrow: "Records", title: "Call History" },
  { match: (p) => p.startsWith("/app/blocklist"), eyebrow: "Control", title: "Blocklist" },
  { match: (p) => p.startsWith("/app/assistant"), eyebrow: "Configure", title: "AI Assistant" },
  { match: (p) => p.startsWith("/app/settings"), eyebrow: "Account", title: "Settings" },
];

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { profile, account } = useCallShield();
  const page = titles.find((item) => item.match(pathname)) ?? titles[0];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ivory/95">
      <div className="flex h-[64px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.05] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
              {page.eyebrow}
            </p>
            <h1 className="truncate text-[16px] font-semibold leading-tight text-ink">
              {page.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink/45 sm:inline-flex">
            <Smartphone className="h-3 w-3" />
            Simulated calls
          </span>
          <NotificationMenu />
          <span className="hidden h-6 w-px bg-line sm:block" />
          <Link
            href="/app/settings"
            className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-ink/[0.04]"
            aria-label="Open profile settings"
          >
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt=""
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full border border-line object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-ivory">
                {initials(profile.name)}
              </span>
            )}
            <span className="hidden text-left md:block">
              <span className="block text-[11.5px] font-medium leading-none text-ink/80">
                {profile.name.split(" ")[0]}
              </span>
              <span className="mt-1 block text-[9px] leading-none text-muted">
                {account ? "Google account" : "Demo account"}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
