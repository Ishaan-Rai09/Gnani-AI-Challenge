import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/app" },
      { label: "Live screening", href: "/app/live" },
      { label: "Call history", href: "/app/history" },
      { label: "Blocklist", href: "/app/blocklist" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Privacy", href: "/legal#privacy" },
      { label: "Security", href: "/legal#security" },
      { label: "Contact", href: "/legal#contact" },
      { label: "Terms", href: "/legal#terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ivory">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.6fr_0.6fr]">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-[300px] text-[12.5px] leading-relaxed text-ivory/45">
              Your calls. Your control. An AI screening layer for the calls you would rather not
              take blind.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 border border-white/12 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ivory/40">
              <span className="h-1 w-1 bg-signal" />
              Demo prototype
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory/35">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[12.5px] text-ivory/60 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10.5px] text-ivory/30">
            © {new Date().getFullYear()} CallShield. All rights reserved.
          </p>
          <p className="max-w-[560px] text-[10px] leading-relaxed text-ivory/30">
            Simulated calling environment. CallShield does not intercept real cellular calls, and is
            not affiliated with any bank, telecom provider, or courier service shown in the demo.
            Risk labels are heuristics, not fraud determinations.
          </p>
        </div>
      </div>
    </footer>
  );
}
