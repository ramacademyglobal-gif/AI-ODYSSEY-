"use client";

/** Lightweight veil trigger (no react-router). Optional visual hook for step changes. */
export function triggerRouteVeil() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.dispatchEvent(new Event("odyssey:route-veil"));
}
