"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string | null;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({
  targetDate,
  label = "REGISTRATION DEADLINE COUNTDOWN",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || !timeLeft) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0E1E31]/80 border border-[#C5A15A]/30 text-xs font-mono text-[#E3C984] font-bold">
        <span className="w-2 h-2 rounded-full bg-[#C5A15A] animate-pulse" />
        <span>Registrations opening soon</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-mono tracking-widest text-[#667085] uppercase font-bold">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 sm:gap-4 text-center">
        <div className="flex flex-col bg-[#0E1E31] border border-[#C5A15A]/40 rounded-lg px-3.5 py-2.5 min-w-[72px]">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-[#E3C984]">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#667085] uppercase font-bold">DAYS</span>
        </div>
        <span className="text-[#C5A15A] font-bold text-xl">:</span>
        <div className="flex flex-col bg-[#0E1E31] border border-[#C5A15A]/40 rounded-lg px-3.5 py-2.5 min-w-[72px]">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-[#E3C984]">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#667085] uppercase font-bold">HOURS</span>
        </div>
        <span className="text-[#C5A15A] font-bold text-xl">:</span>
        <div className="flex flex-col bg-[#0E1E31] border border-[#C5A15A]/40 rounded-lg px-3.5 py-2.5 min-w-[72px]">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-[#E3C984]">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#667085] uppercase font-bold">MINS</span>
        </div>
        <span className="text-[#C5A15A] font-bold text-xl">:</span>
        <div className="flex flex-col bg-[#0E1E31] border border-[#C5A15A]/40 rounded-lg px-3.5 py-2.5 min-w-[72px]">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-[#E3C984]">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#667085] uppercase font-bold">SECS</span>
        </div>
      </div>
    </div>
  );
}
