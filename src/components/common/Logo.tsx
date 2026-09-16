"use client";

import Link from "next/link";
import { EVENT_CONFIG } from "@/config/event";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export default function Logo({
  variant = "light",
  size = "md",
  showTagline = false,
}: LogoProps) {
  const textClasses = {
    sm: "text-lg font-bold",
    md: "text-xl font-bold sm:text-2xl",
    lg: "text-2xl font-bold sm:text-3xl"
  };

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] rounded-lg transition-transform hover:scale-[1.02]"
      aria-label="AI Odyssey Homepage"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 font-serif font-extrabold tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F6BFF] animate-pulse" />
          <span
            className={`font-serif font-extrabold ${textClasses[size]} ${
              variant === "dark"
                ? "text-[#FFFFFF] group-hover:text-white transition-colors"
                : "text-[#101820] group-hover:text-[#2F6BFF] transition-colors"
            }`}
          >
            {EVENT_CONFIG.shortName}
          </span>
        </div>
        {showTagline && (
          <span className={`text-[11px] tracking-widest uppercase font-mono font-semibold mt-0.5 ${
            variant === "dark" ? "text-[#CBD5E1]" : "text-[#4B5563]"
          }`}>
            24-Hour AI Mission
          </span>
        )}
      </div>
    </Link>
  );
}
