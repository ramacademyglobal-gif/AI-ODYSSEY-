"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EVENT_CONFIG } from "@/config/event";
import { clsx } from "clsx";

const LINKS = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/challenges", label: "CHALLENGES" },
  { href: "/schedule", label: "SCHEDULE" },
  { href: "/rules", label: "RULES" },
  { href: "/prizes", label: "PRIZES" },
  { href: "/venue", label: "VENUE" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={clsx(
          "fixed top-0 inset-x-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "bg-[color-mix(in_srgb,var(--bg-primary)_94%,transparent)] border-[var(--border-primary)] backdrop-blur-md"
            : "bg-[color-mix(in_srgb,var(--bg-primary)_72%,transparent)] border-transparent backdrop-blur-sm"
        )}
      >
        <div className="content-wrap h-[68px] md:h-[72px] flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display font-light tracking-[0.14em] uppercase text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base shrink-0"
          >
            {EVENT_CONFIG.shortName}
          </Link>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Primary">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "nav-underline relative px-2.5 xl:px-3 py-2 font-mono-custom text-[10px] xl:text-[11px] tracking-[0.18em] uppercase transition-colors",
                    active
                      ? "text-[var(--accent)] is-active"
                      : "text-[var(--text-muted)] hover:text-[var(--accent)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="lg:hidden font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] min-h-10 px-2 border border-[var(--border-primary)]"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? "CLOSE" : "MENU"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[68px] z-[55] border-b border-[var(--border-primary)] bg-[var(--bg-primary)] lg:hidden"
          >
            <nav className="content-wrap py-3 flex flex-col" aria-label="Mobile">
              {LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "py-3.5 border-b border-[var(--border-primary)] last:border-b-0 font-mono-custom text-xs tracking-[0.2em] uppercase transition-colors",
                      active
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--accent)]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
