"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SCHEDULE_LIVE } from "@/data/schedule";
import { clsx } from "clsx";

export default function JourneyPreview() {
  const [day, setDay] = useState<1 | 2>(1);
  const items = useMemo(
    () => SCHEDULE_LIVE.filter((item) => item.day === day),
    [day]
  );

  return (
    <section id="timeline" className="py-20 md:py-28 border-b border-[#2A2A2A] bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="font-serif text-4xl md:text-6xl text-[#F2F0EB]">TIMELINE</h2>
          <p className="font-mono-custom text-[10px] tracking-[0.25em] uppercase text-[#8A8A8A] mt-4">
            28 Sep 10:00 AM → 29 Sep 10:00 AM · RIT, Rajapalayam
          </p>
        </motion.div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex border border-[#2A2A2A]">
            {([1, 2] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={clsx(
                  "min-h-11 px-6 font-mono-custom text-[10px] tracking-[0.2em] uppercase transition-colors",
                  day === d
                    ? "bg-[#FF4D1C] text-[#0A0A0A]"
                    : "text-[#8A8A8A] hover:text-[#F2F0EB]"
                )}
              >
                DAY-{String(d).padStart(2, "0")} {"//"} {d === 1 ? "28 SEP 2026" : "29 SEP 2026"}
              </button>
            ))}
          </div>
        </div>

        <ol className="space-y-0 border border-[#2A2A2A]">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className={clsx(
                "grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 p-5 md:p-6 border-b border-[#2A2A2A] last:border-b-0 hover:bg-white/[0.02] transition-colors",
                item.highlight && "bg-[#FF4D1C]/5"
              )}
            >
              <div className="md:col-span-1 font-mono-custom text-[#FF4D1C] text-xs tracking-widest">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="md:col-span-4 font-mono-custom text-xs text-[#8A8A8A] tracking-wider uppercase">
                {item.time}
              </div>
              <div className="md:col-span-7">
                <h3 className="font-serif text-xl text-[#F2F0EB]">{item.title}</h3>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 text-center">
          <Link
            href="/schedule"
            className="font-mono-custom text-xs text-[#8A8A8A] hover:text-[#FF4D1C] tracking-widest uppercase border-b border-[#2A2A2A] hover:border-[#FF4D1C] pb-1 transition-all"
          >
            Full schedule →
          </Link>
        </div>
      </div>
    </section>
  );
}
