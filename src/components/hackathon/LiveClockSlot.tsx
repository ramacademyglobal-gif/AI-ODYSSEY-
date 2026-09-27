"use client";

import EventCountdown, { CountdownUnits, remainingHms } from "@/components/common/EventCountdown";
import { useOfficialClockState } from "@/components/hackathon/HackathonClockProvider";

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

  if (phase === "ended" || !clock?.officialEndTime) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono-custom text-[10px] tracking-[0.3em] uppercase text-[#8A8A8A]">
          Mission complete
        </p>
        <p className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-[#8A8A8A]">
          The 24-hour Odyssey has ended.
        </p>
      </div>
    );
  }

  const left = remainingHms(clock.officialEndTime, officialNow);
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-mono-custom text-[9px] tracking-[0.3em] uppercase text-[#8A8A8A]">
        AI Odyssey // Live
      </p>
      <CountdownUnits
        units={[
          { value: left.hours, label: "Hrs" },
          { value: left.minutes, label: "Min" },
          { value: left.seconds, label: "Sec" },
        ]}
      />
    </div>
  );
}
