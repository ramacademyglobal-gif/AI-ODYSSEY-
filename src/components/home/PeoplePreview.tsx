"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import { MENTORS, JURY } from "@/data/people";
import { clsx } from "clsx";

export default function PeoplePreview() {
  const [tab, setTab] = useState<"mentors" | "jury">("mentors");
  const list = tab === "mentors" ? MENTORS : JURY;

  return (
    <section className="py-16 sm:py-24 bg-black">
      <Container size="wide" className="space-y-8 sm:space-y-10">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-mono tracking-[0.2em] uppercase text-[#C5A15A]">Mentors & Jury</p>
          <h2 className="text-display text-3xl sm:text-5xl text-white leading-[1.05]">
            Meet the minds
            <br />
            <span className="italic text-[#E3C984]">guiding the journey.</span>
          </h2>
        </div>

        <div className="inline-flex rounded-full border border-white/15 p-1 glass">
          {(["mentors", "jury"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                "min-h-11 px-5 rounded-full text-xs font-mono tracking-[0.16em] uppercase transition-colors",
                tab === t ? "bg-[#C5A15A] text-black font-bold" : "text-white/65 hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="glass rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-display text-2xl sm:text-3xl text-white">Announcements coming soon</p>
            <p className="mt-3 text-sm text-white/50 font-sans max-w-lg mx-auto">
              Confirmed {tab} will appear here once organizers publish the official roster.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((person) => (
              <article key={person.id} className="glass rounded-2xl border border-white/10 p-6">
                <h3 className="text-display text-xl text-white">{person.name}</h3>
                <p className="mt-1 text-sm text-[#C5A15A] font-mono">{person.designation}</p>
                <p className="text-sm text-white/50 font-sans">{person.company}</p>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
