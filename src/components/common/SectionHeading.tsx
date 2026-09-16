import React from "react";
import { clsx } from "clsx";

interface SectionHeadingProps {
  number?: string;
  numbering?: string;
  badge?: string;
  title: string;
  highlightTitle?: string;
  description?: string;
  align?: "left" | "center" | "right";
  className?: string;
  theme?: "light" | "dark";
  badgeVariant?: "gold" | "blue" | "neutral";
}

export default function SectionHeading({
  number,
  numbering,
  badge,
  title,
  highlightTitle,
  description,
  align = "left",
  className,
  theme = "light",
  badgeVariant = "gold",
}: SectionHeadingProps) {
  const displayNum = number || numbering;

  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto"
  };

  const badgeColors = {
    gold: theme === "dark" ? "bg-[#081521] text-[#E3C984] border-[#E3C984]/40" : "bg-[#EFEEE9] text-[#9A722D] border-[#9A722D]/30",
    blue: theme === "dark" ? "bg-[#081521] text-[#6EA8FF] border-[#6EA8FF]/40" : "bg-[#2F6BFF]/10 text-[#2F6BFF] border-[#2F6BFF]/30",
    neutral: theme === "dark" ? "bg-[#081521] text-[#FFFFFF] border-[#CBD5E1]/40" : "bg-[#EFEEE9] text-[#101820] border-[#101820]/20"
  };

  return (
    <div className={clsx("flex flex-col max-w-5xl space-y-3", alignmentClasses[align], className)}>
      {displayNum && (
        <span className={clsx(
          "text-sm sm:text-base font-sans font-extrabold tracking-[0.14em] uppercase block",
          theme === "dark" ? "text-[#E3C984]" : "text-[#9A722D]"
        )}>
          {displayNum}
        </span>
      )}

      {badge && (
        <div
          className={clsx(
            "inline-flex items-center gap-2 px-3.5 py-1 rounded-md text-xs sm:text-sm font-sans tracking-[0.12em] uppercase font-extrabold border shadow-xs",
            badgeColors[badgeVariant]
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span>{badge}</span>
        </div>
      )}

      <h2
        className={clsx(
          "text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight leading-[1.1]",
          theme === "dark" ? "text-[#FFFFFF]" : "text-[#101820]"
        )}
      >
        {title}{" "}
        {highlightTitle && (
          <span className={clsx(theme === "dark" ? "text-[#E3C984]" : "text-[#2F6BFF]", "block sm:inline")}>
            {highlightTitle}
          </span>
        )}
      </h2>

      {description && (
        <p
          className={clsx(
            "text-base sm:text-lg leading-relaxed font-sans font-normal max-w-3xl",
            theme === "dark" ? "text-[#E5E7EB]" : "text-[#4B5563]"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
