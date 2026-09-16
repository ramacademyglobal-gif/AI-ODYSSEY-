"use client";

import { useEffect, useState } from "react";
import { EVENT_CONFIG } from "@/config/event";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcLeft(target: string | null): TimeLeft {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
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

export default function EventCountdown({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState<"before" | "live" | "done">("before");

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const start = EVENT_CONFIG.eventStart ? new Date(EVENT_CONFIG.eventStart).getTime() : 0;
      const end = EVENT_CONFIG.eventEnd ? new Date(EVENT_CONFIG.eventEnd).getTime() : 0;
      if (end && now >= end) {
        setPhase("done");
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      if (start && now >= start) {
        setPhase("live");
        setTime(calcLeft(EVENT_CONFIG.eventEnd));
        return;
      }
      setPhase("before");
      setTime(calcLeft(EVENT_CONFIG.eventStart));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
