import {
  Ban,
  Bot,
  History,
  LayoutDashboard,
  Radio,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  short: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/app", icon: LayoutDashboard, short: "Overview" },
  { label: "Live Screening", href: "/app/live", icon: Radio, short: "Live" },
  { label: "Call History", href: "/app/history", icon: History, short: "History" },
  { label: "Blocklist", href: "/app/blocklist", icon: Ban, short: "Blocklist" },
  { label: "AI Assistant", href: "/app/assistant", icon: Bot, short: "Assistant" },
  { label: "Settings", href: "/app/settings", icon: Settings, short: "Settings" },
];

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}
