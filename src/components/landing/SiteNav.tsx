"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cx } from "@/lib/utils";

const links = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 w-full border-b transition-colors duration-200",
        scrolled ? "border-line bg-ivory/95" : "border-transparent bg-ivory"
      )}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="CallShield home" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13.5px] font-medium text-ink/70 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/signin"
            className="text-[13.5px] font-medium text-ink/70 transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <ButtonLink href="/signin" variant="ink" size="sm" className="h-9 px-4">
            Get started
          </ButtonLink>
        </div>

        <button
          type="button"
          className="rounded-full p-2 text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-ivory px-5 pb-6 pt-3 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/70 py-3 text-sm font-medium text-ink/80"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="border-b border-line/70 py-3 text-sm font-medium text-ink/80"
            >
              Sign in
            </Link>
          </nav>
          <ButtonLink href="/signin" variant="primary" className="mt-5 w-full">
            Get started
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
