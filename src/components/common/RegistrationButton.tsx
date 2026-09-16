"use client";

import { EVENT_CONFIG } from "@/config/event";
import { clsx } from "clsx";

interface RegistrationButtonProps {
  variant?: "primary" | "secondary" | "outline" | "text" | "pill" | "gold" | "origin" | "solid";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export default function RegistrationButton({
  variant = "origin",
  size = "md",
  label = "REGISTER NOW",
  className,
  showIcon = true,
}: RegistrationButtonProps) {
  const targetUrl = EVENT_CONFIG.googleFormRegistrationUrl?.trim();
  if (!targetUrl) {
    return (
      <button
        disabled
        className="font-mono-custom text-xs text-[var(--text-muted)] tracking-widest uppercase opacity-50"
      >
        Registrations Opening Soon
      </button>
    );
  }

  const sizeCls = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  }[size];

  if (variant === "solid") {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "group inline-flex items-center justify-center gap-3 font-mono-custom font-semibold tracking-[0.18em] uppercase",
          "bg-[var(--accent)] text-[var(--bg-secondary)] border border-[var(--accent)]",
          "min-h-[54px] md:min-h-[60px] px-8 md:px-10",
          "hover:bg-transparent hover:text-[var(--accent)] hover:-translate-y-0.5",
          "hover:shadow-[0_0_24px_var(--accent-glow)]",
          "transition-all duration-300 ease-[var(--ease-primary)]",
          sizeCls,
          className
        )}
        aria-label={`${label} (opens Google Form in a new tab)`}
      >
        <span>{label}</span>
        {showIcon && (
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        )}
      </a>
    );
  }

  if (variant === "origin" || variant === "text" || variant === "outline") {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "font-mono-custom text-[var(--text-muted)] hover:text-[var(--accent)] border-b border-[var(--border-primary)] hover:border-[var(--accent)] pb-1 tracking-widest uppercase transition-all inline-flex items-center gap-2 group",
          sizeCls,
          className
        )}
        aria-label={`${label} (opens Google Form in a new tab)`}
      >
        <span>{label}</span>
        {showIcon && <span className="group-hover:translate-x-1 transition-transform">→</span>}
      </a>
    );
  }

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-mono-custom tracking-widest uppercase transition-all border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-secondary)] px-5 py-3 min-h-11",
        sizeCls,
        className
      )}
      aria-label={`${label} (opens Google Form in a new tab)`}
    >
      <span>{label}</span>
      {showIcon && <span className="transition-transform group-hover:translate-x-1">→</span>}
    </a>
  );
}
