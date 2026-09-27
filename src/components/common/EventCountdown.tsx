"use client";

import { Fragment, useEffect, useState } from "react";
import { EVENT_CONFIG } from "@/config/event";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcLeft(target: string | null, nowMs: number): TimeLeft {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = Math.max(0, new Date(target).getTime() - nowMs);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[52px] sm:min-w-[64px]">
      <span className="font-mono-custom text-2xl sm:text-4xl font-semibold tabular-nums text-[#FF4D1C] glow-num-text tracking-wider">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono-custom text-[9px] tracking-[0.25em] uppercase text-[#8A8A8A] mt-1">
        {label}
      </span>
    </div>
  );
}

export function CountdownUnits({
  units,
  compact = false,
}: {
  units: { value: number; label: string }[];
  compact?: boolean;
}) {
  return (
    <div className={`flex items-end justify-center gap-2 sm:gap-4 ${compact ? "scale-95" : ""}`}>
      {units.map((unit, index) => (
        <Fragment key={unit.label}>
          {index > 0 ? (
            <span className="font-mono-custom text-[#FF4D1C] text-2xl sm:text-3xl pb-5">:</span>
          ) : null}
          <Unit value={unit.value} label={unit.label} />
        </Fragment>
      ))}
    </div>
  );
}

export function remainingHms(endIso: string, nowMs: number): { hours: number; minutes: number; seconds: number } {
  const diff = Math.max(0, new Date(endIso).getTime() - nowMs);
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function EventCountdown({
  className = "",
  compact = false,
  lockPreEvent = false,
  clockOffsetMs = 0,
}: {
  className?: string;
  compact?: boolean;
  /** Stay on the pre-event countdown. Do not roll into the 24-hour window. */
  lockPreEvent?: boolean;
  clockOffsetMs?: number;
}) {
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState<"before" | "live" | "done">("before");

  useEffect(() => {
    const tick = () => {
      const now = Date.now() + clockOffsetMs;
      const start = EVENT_CONFIG.eventStart ? new Date(EVENT_CONFIG.eventStart).getTime() : 0;
      const end = EVENT_CONFIG.eventEnd ? new Date(EVENT_CONFIG.eventEnd).getTime() : 0;
      if (lockPreEvent) {
        setPhase("before");
        setTime(calcLeft(EVENT_CONFIG.eventStart, now));
        return;
      }
      if (end && now >= end) {
        setPhase("done");
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      if (start && now >= start) {
        setPhase("live");
        setTime(calcLeft(EVENT_CONFIG.eventEnd, now));
        return;
      }
      setPhase("before");
      setTime(calcLeft(EVENT_CONFIG.eventStart, now));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockOffsetMs, lockPreEvent]);

  if (phase === "done") {
    return (
      <div className={`text-center ${className}`}>
        <p className="font-mono-custom text-[10px] tracking-[0.3em] uppercase text-[#8A8A8A]">
          Mission complete
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p className="font-mono-custom text-[9px] tracking-[0.3em] uppercase text-[#8A8A8A]">
        {phase === "live" ? "Signal live · time remaining" : "Signal incoming"}
      </p>
      <div className={`flex items-end gap-2 sm:gap-4 ${compact ? "scale-95" : ""}`}>
        <Unit value={time.days} label="Days" />
        <span className="font-mono-custom text-[#FF4D1C] text-2xl sm:text-3xl pb-5">:</span>
        <Unit value={time.hours} label="Hrs" />
        <span className="font-mono-custom text-[#FF4D1C] text-2xl sm:text-3xl pb-5">:</span>
        <Unit value={time.minutes} label="Min" />
        <span className="font-mono-custom text-[#FF4D1C] text-2xl sm:text-3xl pb-5">:</span>
        <Unit value={time.seconds} label="Sec" />
      </div>
    </div>
  );
}
