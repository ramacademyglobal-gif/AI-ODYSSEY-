"use client";

import { useRef } from "react";

export default function OdysseyGraphic() {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--mx", `${x * 8}px`);
    el.style.setProperty("--my", `${y * 8}px`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full aspect-square max-w-[480px] mx-auto select-none"
      style={
        {
          "--mx": "0px",
          "--my": "0px",
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: "translate(var(--mx), var(--my))" }}
      >
        {/* Soft atmosphere */}
        <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(197,161,90,0.18),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(54,139,255,0.12),transparent_50%)]" />

        {/* Outer trajectory */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none">
          <circle
            cx="200"
            cy="200"
            r="168"
            stroke="rgba(197,161,90,0.35)"
            strokeWidth="1"
            className="origin-center animate-spin-slow motion-reduce:animate-none"
            style={{ animationDuration: "90s" }}
          />
          <circle
            cx="200"
            cy="200"
            r="128"
            stroke="rgba(227,201,132,0.25)"
            strokeWidth="1"
            strokeDasharray="4 8"
            className="origin-center animate-spin-slow motion-reduce:animate-none"
            style={{ animationDuration: "55s", animationDirection: "reverse" }}
          />
          <ellipse
            cx="200"
            cy="200"
            rx="175"
            ry="70"
            stroke="rgba(54,139,255,0.28)"
            strokeWidth="1"
            transform="rotate(-28 200 200)"
            className="origin-center animate-spin-slow motion-reduce:animate-none"
            style={{ animationDuration: "70s" }}
          />
          {/* Milestone points */}
          <circle cx="200" cy="32" r="3.5" fill="#E3C984" />
          <circle cx="340" cy="200" r="3" fill="#C5A15A" />
          <circle cx="200" cy="368" r="2.5" fill="#FAF9F6" />
          <circle cx="60" cy="200" r="2.5" fill="#368BFF" />
          {/* Path arc accent */}
          <path
            d="M70 250 C120 320, 280 320, 330 250"
            stroke="rgba(197,161,90,0.45)"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>

        {/* Core planet */}
        <div className="absolute inset-[27%] rounded-full bg-gradient-to-br from-[#0E1E31] via-[#071421] to-[#040B13] border border-[#C5A15A]/35 shadow-[inset_0_0_40px_rgba(197,161,90,0.18)] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-30 cosmic-grid scale-150" />
          <div className="relative z-10 text-center px-4">
            <p className="text-[10px] font-sans tracking-[0.28em] uppercase text-[#E3C984] mb-1">
              Mission
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-[#FAF9F6] tracking-wide">
              AI ODYSSEY
            </p>
            <p className="mt-1 text-[10px] font-sans tracking-[0.22em] uppercase text-white/50">
              24 Hours
            </p>
          </div>
        </div>

        {/* Coordinate chips */}
        <div className="absolute top-3 right-1 sm:right-4 rounded-md border border-white/10 bg-[#0E1E31]/75 backdrop-blur-sm px-3 py-1.5 text-[10px] font-sans tracking-wider uppercase text-[#E3C984]">
          28–29 SEP 2026
        </div>
        <div className="absolute bottom-4 left-0 sm:left-2 rounded-md border border-white/10 bg-[#0E1E31]/75 backdrop-blur-sm px-3 py-1.5 text-[10px] font-sans tracking-wider uppercase text-white/70">
          Rajapalayam · TN
        </div>
      </div>
    </div>
  );
}
