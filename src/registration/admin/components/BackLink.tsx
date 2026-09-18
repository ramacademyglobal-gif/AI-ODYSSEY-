"use client";

import Link from "next/link";

type BackLinkProps = {
  to: string;
  children?: string;
  className?: string;
};

/** Consistent back navigation across admin surfaces. */
export function BackLink({
  to,
  children = "Back",
  className = "back-link",
}: BackLinkProps) {
  return (
    <Link className={className} href={to}>
      ← {children}
    </Link>
  );
}
