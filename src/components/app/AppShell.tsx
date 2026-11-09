"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { DesktopSidebar, SidebarContent } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { MobileTabBar } from "@/components/app/MobileTabBar";
import { RingingBanner } from "@/components/app/RingingBanner";
import { CallVoiceDriver } from "@/lib/voice/CallVoiceDriver";
import { AppSkeleton } from "@/components/app/AppSkeleton";
import { useCallShield } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { hydrated } = useCallShield();

  // The app is account-only: signed-out visitors go straight to sign-in.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [status, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-ivory">
      <DesktopSidebar />

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 pb-24 lg:pb-8">
          {hydrated ? children : <AppSkeleton />}
        </main>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-ink/50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: [0.2, 0.7, 0.3, 1] }}
              className="absolute inset-y-0 left-0 w-[280px] shadow-panel"
              aria-label="Navigation menu"
            >
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="absolute -right-11 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-ink/70 text-ivory"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <MobileTabBar />
      <RingingBanner />
      <CallVoiceDriver />
    </div>
  );
}
