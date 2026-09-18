"use client";

import Link from "next/link";
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
  const sizeCls = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  }[size];

  if (variant === "solid") {
    return (
      <Link
        href="/register"
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
        aria-label={label}
      >
        <span>{label}</span>
        {showIcon && (
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        )}
      </Link>
    );
  }

  if (variant === "origin" || variant === "text" || variant === "outline") {
    return (
      <Link
        href="/register"
        className={clsx(
          "font-mono-custom text-[var(--text-muted)] hover:text-[var(--accent)] border-b border-[var(--border-primary)] hover:border-[var(--accent)] pb-1 tracking-widest uppercase transition-all inline-flex items-center gap-2 group",
          sizeCls,
          className
        )}
        aria-label={label}
      >
        <span>{label}</span>
        {showIcon && <span className="group-hover:translate-x-1 transition-transform">→</span>}
      </Link>
    );
  }

  return (
    <Link
      href="/register"
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-mono-custom tracking-widest uppercase transition-all border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-secondary)] px-5 py-3 min-h-11",
        sizeCls,
        className
      )}
      aria-label={label}
    >
      <span>{label}</span>
      {showIcon && <span className="transition-transform group-hover:translate-x-1">→</span>}
    </Link>
  );
}
