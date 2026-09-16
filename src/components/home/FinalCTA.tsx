import Link from "next/link";
import RegistrationButton from "@/components/common/RegistrationButton";
import { EVENT_CONFIG } from "@/config/event";

export default function FinalCTA() {
  return (
    <section className="py-24 md:py-32 bg-[#070707] border-b border-[#2A2A2A] text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] font-mono-custom text-[10px] leading-4 text-[#FF4D1C] whitespace-pre overflow-hidden select-none">
        {Array.from({ length: 40 })
          .map(() => "HACK THE FUTURE · AI ODYSSEY 24 · BUILD · PRESENT · MATTER · ")
          .join("")}
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-8">
        <p className="font-mono-custom text-xs tracking-[0.3em] uppercase text-[#8A8A8A]">
          Final call
        </p>
        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#F2F0EB] leading-[1.05]">
          24 hours.
          <br />
          One mission.
          <br />
          <span className="italic text-[#FF4D1C]">What will you build?</span>
        </h2>
        <p className="font-mono-custom text-[10px] tracking-[0.25em] uppercase text-[#8A8A8A]">
          {EVENT_CONFIG.eventName} · 28–29 September 2026 · {EVENT_CONFIG.city}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <RegistrationButton label="Begin your Odyssey" variant="origin" />
          <Link
            href="/schedule"
            className="font-mono-custom text-xs text-[#8A8A8A] hover:text-[#F2F0EB] tracking-widest uppercase transition-colors"
          >
            View timeline ✦
          </Link>
        </div>
      </div>
    </section>
  );
}
