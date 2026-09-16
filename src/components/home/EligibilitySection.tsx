"use client";

import { motion } from "framer-motion";
import RegistrationButton from "@/components/common/RegistrationButton";
import { EVENT_CONFIG } from "@/config/event";
import { Check, X } from "lucide-react";

export default function EligibilitySection() {
  const e = EVENT_CONFIG.eligibility;
  const rows = [
    { label: "Team size", value: `${e.minTeamSize}–${e.maxTeamSize}`, ok: true as boolean | null },
    { label: "Cross-college", value: e.crossCollegeTeamsAllowed ? "YES" : "NO", ok: e.crossCollegeTeamsAllowed },
    { label: "Cross-department", value: e.crossDepartmentTeamsAllowed ? "YES" : "NO", ok: e.crossDepartmentTeamsAllowed },
    { label: "Individual", value: e.individualParticipationAllowed ? "YES" : "NO", ok: e.individualParticipationAllowed },
    { label: "Prior AI required", value: e.previousAIExperienceRequired ? "YES" : "NO", ok: e.previousAIExperienceRequired },
  ];

  return (
    <section id="eligibility" className="py-20 md:py-28 border-b border-[#2A2A2A] bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="font-serif text-4xl md:text-6xl text-[#F2F0EB]">ELIGIBILITY</h2>
          <p className="font-mono-custom text-[10px] tracking-[0.25em] uppercase text-[#8A8A8A] mt-4">
            Who can begin the Odyssey
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto border border-[#2A2A2A]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#2A2A2A] last:border-b-0"
            >
              <span className="font-mono-custom text-xs tracking-wider uppercase text-[#8A8A8A]">
                {row.label}
              </span>
              <span className="inline-flex items-center gap-2 font-mono-custom text-sm text-[#F2F0EB]">
                {row.ok === true && <Check className="w-3.5 h-3.5 text-[#FF4D1C]" />}
                {row.ok === false && <X className="w-3.5 h-3.5 text-[#8A8A8A]" />}
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <RegistrationButton label="Secure your spot" variant="gold" showIcon />
        </div>
      </div>
    </section>
  );
}
