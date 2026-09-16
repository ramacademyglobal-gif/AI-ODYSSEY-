"use client";

import { motion } from "framer-motion";
import { EVENT_CONFIG } from "@/config/event";

const STATS = [
  { label: "Duration", value: "24 HOURS", note: "Non-stop building" },
  {
    label: "Eligibility",
    value: "STUDENTS",
    note: EVENT_CONFIG.eligibility.crossCollegeTeamsAllowed
      ? "Cross-college teams welcome"
      : "Team event",
  },
  {
    label: "Venue",
    value: "RIT",
    note: `${EVENT_CONFIG.city}, ${EVENT_CONFIG.state}`,
  },
  {
    label: "Fee",
    value: EVENT_CONFIG.registrationFee?.includes("100") ? "₹100" : "SEE FORM",
    note: "Per person",
  },
];

export default function MissionSection() {
  return (
    <section id="about" className="py-20 md:py-28 border-b border-[#2A2A2A] bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <div className="text-center flex flex-col items-center">
            <h2 className="font-serif text-4xl md:text-6xl text-[#F2F0EB]">ABOUT</h2>
            <p className="font-mono-custom text-[10px] tracking-[0.25em] uppercase text-[#8A8A8A] mt-4">
              {EVENT_CONFIG.organizer}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h3 className="font-serif text-3xl md:text-4xl text-[#F2F0EB] leading-tight">
              Every breakthrough has an{" "}
              <span className="italic text-[#FF4D1C]">odyssey.</span>
            </h3>
            <p className="text-base md:text-lg text-[#8A8A8A] leading-relaxed max-w-2xl">
              {EVENT_CONFIG.description} Over 24 hours at {EVENT_CONFIG.venueName}, teams ideate,
              innovate, build and present working solutions under real constraints.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="origin-card p-4 md:p-5">
                <p className="font-mono-custom text-[9px] tracking-[0.2em] uppercase text-[#8A8A8A]">
                  {stat.label}
                </p>
                <p className="mt-2 font-mono-custom text-lg md:text-xl text-[#FF4D1C] tracking-wider">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-[#8A8A8A]">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
