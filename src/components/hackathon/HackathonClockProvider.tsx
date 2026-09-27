"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  type OfficialClock,
  type ViewPhase,
  fetchOfficialClock,
  viewPhase,
} from "@/hackathon/officialClock";
import { CountdownTransition } from "@/components/hackathon/CountdownTransition";

type ClockContextValue = {
  phase: ViewPhase;
  clock: OfficialClock | null;
  offsetMs: number;
  officialNow: number;
  /** Visual check only. Does not change the saved official clock. */
  preview: boolean;
  adopt: (clock: OfficialClock) => void;
};

const ClockContext = createContext<ClockContextValue | null>(null);

export function useHackathonClock(): ClockContextValue {
  const value = useContext(ClockContext);
  if (!value) {
    throw new Error("Hackathon clock is only available on the homepage");
  }
  return value;
}

export function useOfficialClockState(): ClockContextValue {
  const [clock, setClock] = useState<OfficialClock | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const timerRef = useRef<number>(0);

  const adopt = useCallback((next: OfficialClock) => {
    setClock(next);
    setOffsetMs(new Date(next.serverTime).getTime() - Date.now());
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    let cancel = false;

    const load = async () => {
      try {
        const next = await fetchOfficialClock();
        if (cancel) return;
        adopt(next);
        timerRef.current = window.setTimeout(load, 30000);
      } catch {
        if (cancel) return;
        timerRef.current = window.setTimeout(load, 15000);
      }
    };

    void load();
    const tick = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      cancel = true;
      window.clearTimeout(timerRef.current);
      window.clearInterval(tick);
    };
  }, [adopt]);

  const officialNow = nowMs + offsetMs;
  const phase = viewPhase({ clock, officialNow });

  return { phase, clock, offsetMs, officialNow, preview: false, adopt };
}

export function HackathonClockProvider({ children }: { children: React.ReactNode }) {
  const clock = useOfficialClockState();
  const previous = useRef<ViewPhase | null>(null);
  const played = useRef(false);
  const [preview, setPreview] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const finishTransition = useCallback(() => setShowTransition(false), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setPreview(params.get("preview") === "launch");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const prev = previous.current;
    previous.current = clock.phase;
    if (prev === "pre" && clock.phase === "awaiting" && !played.current) {
      played.current = true;
      const timer = window.setTimeout(() => setShowTransition(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [clock.phase]);

  useEffect(() => {
    if (!preview || played.current) return;
    played.current = true;
    const timer = window.setTimeout(() => setShowTransition(true), 0);
    return () => window.clearTimeout(timer);
  }, [preview]);

  useEffect(() => {
    if (showTransition) return;
    if (!preview && (clock.phase === "pre" || clock.phase === "syncing")) return;
    const target = document.getElementById("official-launch");
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [clock.phase, showTransition, preview]);

  return (
    <ClockContext.Provider value={{ ...clock, preview }}>
      {children}
      {showTransition ? <CountdownTransition onDone={finishTransition} /> : null}
    </ClockContext.Provider>
  );
}
