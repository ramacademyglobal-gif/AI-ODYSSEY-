"use client";

import EventCountdown, { remainingHms } from "@/components/common/EventCountdown";
import { useOfficialClockState } from "@/components/hackathon/HackathonClockProvider";
import { HallClock } from "@/components/hackathon/HallDisplay";

export function LiveClockSlot() {
  const { phase, clock, offsetMs, officialNow } = useOfficialClockState();

  if (phase === "pre") {
    return <EventCountdown lockPreEvent clockOffsetMs={offsetMs} />;
  }

  if (phase === "syncing") {
    return (
      <p className="font-mono-custom text-[10px] tracking-[0.3em] uppercase text-[#8A8A8A]">
        Syncing official timer...
      </p>
    );
  }

  if (phase === "awaiting") {
    return (
      <p className="font-mono-custom text-[10px] tracking-[0.3em] uppercase text-[#ff4d1c]">
        Awaiting official start
      </p>
    );
  }

  if (phase === "ended" || (phase === "live" && !clock?.officialEndTime)) {
    return <HallClock hours={0} minutes={0} seconds={0} status="Mission complete" />;
  }

  if (phase === "live" && clock?.officialEndTime) {
    const left = remainingHms(clock.officialEndTime, officialNow);
    return (
      <HallClock
        hours={left.hours}
        minutes={left.minutes}
        seconds={left.seconds}
        status="Official 24-hour build window"
      />
    );
  }

  return null;
}
