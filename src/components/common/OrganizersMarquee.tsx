"use client";

import Image from "next/image";
import { ORGANIZERS } from "@/data/organizers";
import Container from "@/components/common/Container";

/** Lightweight organizer strip for secondary pages. Prefer OrganizersWall on homepage. */
export default function OrganizersMarquee() {
  const items = [...ORGANIZERS, ...ORGANIZERS];

  return (
    <section className="relative py-14 sm:py-16 bg-[#FAF9F6] border-y border-[#071421]/08 overflow-hidden">
      <Container size="wide" className="mb-8 text-center space-y-2">
        <p className="text-xs font-sans font-bold tracking-[0.18em] uppercase text-[#C5A15A]">
          Organized by
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#071421]">
          The collective behind AI Odyssey 24
        </h2>
      </Container>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#FAF9F6] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#FAF9F6] to-transparent z-10" />
        <div className="animate-infinite-scroll flex items-center gap-4 sm:gap-5 py-2">
          {items.map((org, index) => (
            <div
              key={`${org.id}-${index}`}
              className="flex-shrink-0 w-48 sm:w-56 h-28 bg-white rounded-xl border border-[#071421]/08 p-4 flex items-center justify-center"
              title={org.name}
            >
              <Image
                src={org.logo}
                alt={org.name}
                width={160}
                height={72}
                className="max-h-16 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
