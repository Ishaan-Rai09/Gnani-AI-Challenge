"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { useCallShield } from "@/lib/store";
import { relativeTime } from "@/lib/format";
import { cx } from "@/lib/utils";

const toneIcon = {
  risk: ShieldAlert,
  info: Info,
  success: ShieldCheck,
};

export function NotificationMenu() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } =
    useCallShield();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openNotification(href?: string) {
    setOpen(false);
    if (href) router.push(href);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/[0.05] hover:text-ink"
      >
        <Bell className="h-[17px] w-[17px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-signal px-1 text-[8.5px] font-bold leading-none text-ink">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-xl border border-line bg-paper shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[12.5px] font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-signal/15 px-1.5 py-0.5 text-[9px] font-bold text-ink">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink/50 transition-colors hover:text-ink"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <Bell className="mx-auto h-5 w-5 text-ink/20" />
                  <p className="mt-2 text-[12px] text-muted">No notifications yet.</p>
                </div>
              )}
              {notifications.slice(0, 8).map((item) => {
                const Icon = toneIcon[item.tone];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(item.id);
                      openNotification(item.href ?? "/app/history");
                    }}
                    className={cx(
                      "flex w-full items-start gap-3 border-b border-line/70 px-4 py-3 text-left transition-colors hover:bg-ash/40",
                      !item.read && "bg-signal/[0.035]"
                    )}
                  >
                    <span
                      className={cx(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        item.tone === "risk"
                          ? "border-signal/30 bg-signal/10 text-signal"
                          : "border-line bg-white text-ink/45"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cx(
                            "text-[12px] leading-snug",
                            item.read ? "font-medium text-ink/70" : "font-semibold text-ink"
                          )}
                        >
                          {item.title}
                        </span>
                        {!item.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-[9.5px] uppercase tracking-[0.1em] text-ink/30">
                        {relativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-line bg-white/50 px-4 py-2.5">
              <Link
                href="/app/history"
                onClick={() => setOpen(false)}
                className="text-[10.5px] font-medium text-ink/50 transition-colors hover:text-ink"
              >
                View all screened calls →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
