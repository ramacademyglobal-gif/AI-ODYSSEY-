"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ORGANIZERS } from "@/data/organizers";

function LogoTile({ org }: { org: (typeof ORGANIZERS)[number] }) {
  const wide = /techlink|raam/i.test(org.name);
  return (
    <div
      className={`flex-shrink-0 border border-[#2A2A2A] bg-[#0A0A0A] p-4 flex flex-col items-center gap-3 ${
        wide ? "w-[200px] sm:w-[220px]" : "w-[170px] sm:w-[190px]"
      }`}
      title={org.name}
    >
      <div className="w-full h-[110px] sm:h-[120px] bg-[#F2F0EB] flex items-center justify-center p-4">
        <Image
          src={org.logo}
          alt={org.name}
          width={wide ? 200 : 160}
          height={100}
          className="max-h-[88px] sm:max-h-[96px] w-auto max-w-full object-contain"
        />
      </div>
      <p className="font-mono-custom text-[9px] tracking-[0.16em] uppercase text-[#8A8A8A] text-center truncate w-full px-1">
        {org.shortName || org.name}
      </p>
    </div>
  );
}

export default function OrganizersWall() {
  const loop = [...ORGANIZERS, ...ORGANIZERS];

  return (
    <section id="organizers" className="py-20 md:py-28 border-b border-[#2A2A2A] bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="font-serif text-4xl md:text-6xl text-[#F2F0EB]">ORGANIZERS</h2>
          <p className="font-mono-custom text-[10px] tracking-[0.25em] uppercase text-[#8A8A8A] mt-4">
            The collective behind the Odyssey
          </p>
        </motion.div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#070707] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#070707] to-transparent z-10" />

        <div className="organizer-marquee-track flex w-max items-center gap-5 sm:gap-6 py-3 px-4 hover:[animation-play-state:paused]">
          {loop.map((org, index) => (
            <LogoTile key={`${org.id}-${index}`} org={org} />
          ))}
        </div>

        <div className="organizer-marquee-static hidden overflow-x-auto gap-5 px-4 py-3">
          {ORGANIZERS.map((org) => (
            <LogoTile key={org.id} org={org} />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="mt-10 text-center">
          <Link
            href="/organizers"
            className="font-mono-custom text-xs text-[#8A8A8A] hover:text-[#FF4D1C] tracking-widest uppercase border-b border-[#2A2A2A] hover:border-[#FF4D1C] pb-1 transition-all"
          >
            View collective →
          </Link>
        </div>
      </div>
    </section>
  );
}
