"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PRIZES } from "@/data/prizes";

export default function PrizesPreview() {
  const main = PRIZES.filter((p) => p.category === "Main Track")
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 3);
  const winner = main[0];
  const runners = main.slice(1);

  return (
    <section
      id="prizes"
      className="py-20 md:py-28 border-b border-[#2A2A2A] relative overflow-hidden bg-[#070707]"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="w-full mb-16 relative"
        >
          <div className="text-center flex flex-col items-center">
            <h2 className="font-serif text-4xl md:text-6xl text-[#F2F0EB] tracking-tight">
              PRIZES
            </h2>
            <p className="font-serif text-2xl md:text-3xl text-[#F2F0EB] mt-6 max-w-2xl leading-tight">
              The Odyssey
              <br />
              <span className="italic text-[#FF4D1C]">rewards the bold.</span>
            </p>
            <p className="mt-4 max-w-xl text-sm md:text-base text-[#8A8A8A] leading-relaxed">
              Great ideas deserve recognition. Build, innovate and compete for exciting
              rewards at AI Odyssey 24.
            </p>
          </div>
        </motion.div>

        {winner ? (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="odyssey-card border-[#FF4D1C]/55 p-7 md:p-10 mb-4 md:mb-6 text-center"
          >
            <p className="font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[#FF4D1C]">
              RANK-01 {"//"} CHAMPION
            </p>
            <h3 className="mt-3 font-serif text-3xl md:text-5xl text-[#F2F0EB] uppercase tracking-tight">
              {winner.title}
            </h3>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {winner.perks.map((perk) => (
                <span
                  key={perk}
                  className="border border-[#FF4D1C]/40 px-4 py-2.5 font-mono-custom text-[10px] tracking-[0.18em] uppercase text-[#FF4D1C]"
                >
                  {perk}
                </span>
              ))}
            </div>
          </motion.article>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {runners.map((prize, idx) => (
            <motion.article
              key={prize.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06, duration: 0.45 }}
              className="odyssey-card p-6 md:p-8 group hover:-translate-y-0.5"
            >
              <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[#8A8A8A] mb-4">
                RANK-{String(prize.rank ?? idx + 2).padStart(2, "0")} {"//"}{" "}
                {prize.subtitle?.toUpperCase() ?? "PODIUM"}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-[#F2F0EB] group-hover:text-[#FF4D1C] transition-colors uppercase">
                {prize.title}
              </h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {prize.perks.map((perk) => (
                  <span
                    key={perk}
                    className="border border-[#2A2A2A] px-3 py-2 font-mono-custom text-[10px] tracking-[0.16em] uppercase text-[#8A8A8A] group-hover:border-[#FF4D1C]/35 group-hover:text-[#FF4D1C] transition-colors"
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/prizes"
            className="font-mono-custom text-xs text-[#8A8A8A] hover:text-[#FF4D1C] tracking-widest uppercase border-b border-[#2A2A2A] hover:border-[#FF4D1C] pb-1 transition-all"
          >
            Full prize page →
          </Link>
        </div>
      </div>
    </section>
  );
}
