"use client";

import { useMemo, useState } from "react";
import { CHALLENGES } from "@/data/challenges";
import PageHero from "@/components/common/PageHero";
import ChallengeModal from "@/components/common/ChallengeModal";
import type { Challenge } from "@/types";
import { clsx } from "clsx";

const SECTORS = ["All", ...Array.from(new Set(CHALLENGES.map((c) => c.sector)))];
const CATEGORIES = ["All", "Software", "IoT"];

export default function ChallengesPage() {
  const [sector, setSector] = useState("All");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Challenge | null>(null);

  const filtered = useMemo(
    () =>
      CHALLENGES.filter((c) => {
        const s = sector === "All" || c.sector === sector;
        const cat = category === "All" || c.category === category;
        const query =
          !q ||
          c.title.toLowerCase().includes(q.toLowerCase()) ||
          c.shortDescription?.toLowerCase().includes(q.toLowerCase()) ||
          c.sector.toLowerCase().includes(q.toLowerCase());
        return s && cat && query;
      }),
    [sector, category, q]
  );

  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="CHALLENGES"
        index="02"
        title="Choose your"
        titleAccent="mission."
        description="Explore official problem statements across sectors. Filter by domain and category."
      />

      <section className="content-wrap section-pad space-y-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks / statements..."
            className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-4 py-3 font-mono-custom text-xs tracking-wider text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none"
          />
          <p className="font-mono-custom text-[10px] tracking-widest uppercase text-[var(--text-muted)]">
            Showing {filtered.length} / {CHALLENGES.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
              className={clsx(
                "min-h-10 px-3 font-mono-custom text-[10px] tracking-[0.16em] uppercase border",
                sector === s
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {s.replace(" Sector", "")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={clsx(
                "min-h-10 px-3 font-mono-custom text-[10px] tracking-[0.16em] uppercase border",
                category === c
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((challenge) => (
            <button
              key={challenge.slug}
              type="button"
              onClick={() => setSelected(challenge)}
              className="odyssey-card p-6 group text-left w-full"
              data-cursor="interactive"
            >
              <p className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-[var(--text-muted)]">
                MISSION-{String(challenge.number).padStart(2, "0")} {"//"}{" "}
                {challenge.sector.replace(" Sector", "").toUpperCase()}
              </p>
              <h2 className="mt-3 font-serif text-card text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {challenge.title}
              </h2>
              <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3">
                {challenge.shortDescription || challenge.description}
              </p>
              <span className="mt-5 inline-flex font-mono-custom text-[10px] tracking-widest uppercase text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                Open statement →
              </span>
            </button>
          ))}
        </div>
      </section>

      <ChallengeModal challenge={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
