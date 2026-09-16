import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { EVENT_CONFIG } from "@/config/event";
import { PRIZES, PARTICIPANT_PERKS } from "@/data/prizes";

export const metadata: Metadata = {
  title: "Prizes",
  description: `Recognition and awards for ${EVENT_CONFIG.eventName}.`,
};

export default function PrizesPage() {
  const main = PRIZES.filter((p) => p.category === "Main Track").sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99)
  );

  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="PRIZES"
        index="05"
        title="The Odyssey"
        titleAccent="rewards the bold."
        description="Podium recognition with internship opportunity and exciting prize for Winner, First Runner-Up and Second Runner-Up."
      />

      <section className="content-wrap section-pad space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {main.map((prize, idx) => (
            <article
              key={prize.id}
              className={`odyssey-card p-6 md:p-8 ${idx === 0 ? "border-[var(--accent)]/50" : ""}`}
            >
              <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[var(--accent)]">
                {prize.subtitle ?? `Rank ${prize.rank}`}
              </p>
              <h2 className="mt-3 font-serif text-2xl md:text-3xl text-[var(--text-primary)] uppercase">
                {prize.title}
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {prize.perks.map((perk) => (
                  <span
                    key={perk}
                    className="border border-[var(--border-primary)] px-3 py-2 font-mono-custom text-[10px] tracking-[0.16em] uppercase text-[var(--text-muted)]"
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PARTICIPANT_PERKS.map((perk) => (
            <div key={perk.title} className="odyssey-card p-5">
              <h3 className="font-serif text-xl text-[var(--text-primary)]">{perk.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
