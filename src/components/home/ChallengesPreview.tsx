"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CHALLENGES } from "@/data/challenges";
import ChallengeModal from "@/components/common/ChallengeModal";
import type { Challenge } from "@/types";

export default function ChallengesPreview() {
  const [selected, setSelected] = useState<Challenge | null>(null);

  return (
    <section
      id="challenges"
      className="py-20 md:py-28 border-b border-[#2A2A2A] relative overflow-hidden bg-[#070707]"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="w-full mb-16 relative text-center flex flex-col items-center"
        >
          <h2 className="font-serif text-4xl md:text-6xl text-[#F2F0EB] tracking-tight">
            PROBLEM STATEMENTS
          </h2>
          <p className="font-mono-custom text-[10px] sm:text-xs text-[#8A8A8A] tracking-[0.25em] uppercase mt-4">
            Explore the official missions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {CHALLENGES.map((challenge, idx) => (
            <motion.button
              key={challenge.slug}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04, duration: 0.45 }}
              onClick={() => setSelected(challenge)}
              data-cursor="interactive"
              className="odyssey-card p-6 md:p-8 text-left group w-full"
            >
              <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[#8A8A8A] mb-4">
                MISSION-{String(challenge.number).padStart(2, "0")} {"//"}{" "}
                {challenge.sector.replace(" Sector", "").toUpperCase()}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-[#F2F0EB] group-hover:text-[#FF4D1C] transition-colors">
                {challenge.title}
              </h3>
              <p className="mt-3 text-sm text-[#8A8A8A] leading-relaxed line-clamp-3">
                {challenge.shortDescription || challenge.description}
              </p>
              <span className="mt-6 inline-block font-mono-custom text-[10px] tracking-widest uppercase text-[#FF4D1C] opacity-0 group-hover:opacity-100 transition-opacity">
                Open statement →
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <ChallengeModal challenge={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
