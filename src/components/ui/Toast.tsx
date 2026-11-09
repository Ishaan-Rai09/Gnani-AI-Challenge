"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useCallShield, type ToastTone } from "@/lib/store";
import { cx } from "@/lib/utils";

const toneIcon: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  risk: TriangleAlert,
  neutral: Info,
};

const toneAccent: Record<ToastTone, string> = {
  success: "text-ink",
  risk: "text-signal",
  neutral: "text-muted",
};

export function ToastViewport() {
  const { toasts, dismissToast } = useCallShield();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.3, 1] }}
              className={cx(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-ink px-4 py-3 text-ivory shadow-panel",
                toast.tone === "risk" ? "border-signal/60" : "border-white/10"
              )}
            >
              <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", toast.tone === "risk" ? "text-signal" : "text-ivory/70")} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ivory/60">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="rounded-full p-1 text-ivory/50 transition-colors hover:bg-white/10 hover:text-ivory"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
