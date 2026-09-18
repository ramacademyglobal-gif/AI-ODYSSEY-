"use client";

import { useEffect, useState } from "react";

/** Keep in sync with --motion-route in motion.css */
const ROUTE_VEIL_MS = 1000;
const ROUTE_VEIL_EVENT = "odyssey:route-veil";

/**
 * Plays the AI ODYSSEY route veil on manual triggers
 * (registration step navigation, payment/success views).
 */
export function RouteVeil({ playOnMount = true }: { playOnMount?: boolean }) {
  const [veilKey, setVeilKey] = useState(0);
  const [veilOn, setVeilOn] = useState(false);

  useEffect(() => {
    let timeoutId = 0;

    const play = () => {
      window.scrollTo(0, 0);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      window.clearTimeout(timeoutId);
      setVeilKey((k) => k + 1);
      setVeilOn(true);
      timeoutId = window.setTimeout(() => setVeilOn(false), ROUTE_VEIL_MS);
    };

    if (playOnMount) play();
    window.addEventListener(ROUTE_VEIL_EVENT, play);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(ROUTE_VEIL_EVENT, play);
    };
  }, [playOnMount]);

  if (!veilOn) return null;

  return (
    <div key={veilKey} className="route-veil is-active" aria-hidden="true">
      <span className="route-veil__beam" />
      <span className="route-veil__scan" />
      <span className="route-veil__label">AI ODYSSEY</span>
    </div>
  );
}
