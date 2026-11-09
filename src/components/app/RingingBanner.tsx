"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, PhoneIncoming, Radio } from "lucide-react";
import { useCallShield } from "@/lib/store";
import { formatClock } from "@/lib/format";

export function RingingBanner() {
  const { session } = useCallShield();
  const pathname = usePathname();

  const visible =
    session && session.phase !== "ended" && pathname !== "/app/live" && session.phase !== "idle";

  return (
    <AnimatePresence>
      {visible && session && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.24 }}
          className="fixed bottom-[76px] left-4 right-4 z-40 lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]"
        >
          <Link
            href="/app/live"
            className="flex items-center gap-3 rounded-xl border border-ink bg-ink px-4 py-3 text-ivory shadow-panel"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
              {session.phase === "ringing" ? (
                <>
                  <span className="absolute inset-0 animate-ring-pulse rounded-full border border-signal/40" />
                  <PhoneIncoming className="h-4 w-4 text-signal" />
                </>
              ) : (
                <Radio className="h-4 w-4 text-signal" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-signal">
                {session.phase === "ringing" ? "Incoming simulated call" : session.phase === "user" ? "You are handling this call" : "Live screening in progress"}
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] font-medium">
                {session.callerName ?? "Unknown caller"} · {formatClock(session.elapsedSec)}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ivory/40" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
