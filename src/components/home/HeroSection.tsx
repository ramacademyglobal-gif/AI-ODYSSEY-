"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "framer-motion";
import EventCountdown from "@/components/common/EventCountdown";
import { EVENT_CONFIG } from "@/config/event";

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const place =
    EVENT_CONFIG.venueName?.split(" ").slice(0, 2).join(" ") ?? "RIT";

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--px", `${x * 8}px`);
    el.style.setProperty("--py", `${y * 6}px`);
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };

  return (
    <section
      id="hero"
      ref={ref}
      onMouseMove={onMove}
      className="relative min-h-screen w-full flex flex-col items-center justify-between px-6 py-12 overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none"
      style={
        {
          "--px": "0px",
          "--py": "0px",
          "--gx": "50%",
          "--gy": "40%",
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at var(--gx) var(--gy), rgba(255,77,28,0.16), transparent 32%),
            linear-gradient(to right, rgba(42,42,42,0.55) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(42,42,42,0.55) 1px, transparent 1px)
          `,
          backgroundSize: "auto, 48px 48px, 48px 48px",
        }}
      />

      <div className="w-full pt-20 md:pt-24 flex justify-center items-center z-10 pointer-events-none">
        <div className="font-mono-custom text-[10px] sm:text-xs text-[var(--text-muted)] tracking-[0.3em] uppercase flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/80" />
          <span>
            {place} · {EVENT_CONFIG.city} {"//"} 2026
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/80" />
        </div>
      </div>

      <div className="relative z-20 my-auto text-center w-[94vw] max-w-none flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative px-1 sm:px-2 w-full"
          style={{ transform: "translate3d(var(--px), var(--py), 0)" }}
        >
          <p className="font-mono-custom text-[10px] tracking-[0.35em] uppercase text-[var(--text-muted)] mb-3">
            AI ODYSSEY 24
          </p>
          <h1 className="font-display font-light uppercase select-none origin-gradient-text text-hero inline-flex items-baseline justify-center gap-[0.2em] whitespace-nowrap max-[430px]:flex-col max-[430px]:items-center max-[430px]:gap-0 max-[430px]:whitespace-normal">
            <span>AI</span>
            <span>ODYSSEY</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-mono-custom text-[10px] sm:text-xs text-[var(--text-muted)] tracking-[0.25em] sm:tracking-[0.4em] uppercase mt-2 md:mt-4 max-w-xl"
        >
          {EVENT_CONFIG.tagline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="mt-4 font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[var(--text-secondary)]"
        >
          28–29 September 2026 · {EVENT_CONFIG.venueName} · {EVENT_CONFIG.city}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 z-20"
        >
          <Link
            href="#prizes"
            className="font-mono-custom text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] tracking-widest uppercase transition-colors flex items-center gap-2"
          >
            <span>Explore</span>
            <span>✦</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <EventCountdown compact />
        </motion.div>
      </div>

      <div className="w-full pb-4 flex flex-col items-center justify-center gap-2 z-20">
        <a
          href="#prizes"
          className="group flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] group-hover:scale-150 transition-transform" />
          <span className="font-mono-custom text-[9px] tracking-[0.25em] uppercase group-hover:text-[var(--text-primary)]">
            Scroll to explore
          </span>
        </a>
      </div>
    </section>
  );
}
