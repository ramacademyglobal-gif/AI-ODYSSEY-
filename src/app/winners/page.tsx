import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { WINNERS } from "@/data/winners";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Winners",
  description: `Champions of ${EVENT_CONFIG.eventName}.`,
};

export default function WinnersPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="WINNERS"
        index="15"
        title="Odyssey"
        titleAccent="champions."
        description="Results unlock after the mission concludes."
      />

      <section className="content-wrap section-pad">
        {WINNERS.length === 0 ? (
          <div className="odyssey-card border-dashed p-12 text-center">
            <p className="font-serif text-3xl text-[var(--text-primary)]">Mission pending</p>
            <p className="mt-3 font-mono-custom text-xs tracking-widest uppercase text-[var(--text-muted)]">
              Winners publish after 29 September 2026
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {WINNERS.map((w) => (
              <article key={w.id} className="odyssey-card p-6">
                <p className="font-mono-custom text-[10px] tracking-widest uppercase text-[var(--accent)]">
                  {w.rank} · {w.award}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-[var(--text-primary)]">{w.teamName}</h2>
                <p className="text-sm text-[var(--text-muted)]">{w.projectTitle}</p>
                <p className="mt-2 font-mono-custom text-[10px] tracking-wider uppercase text-[var(--text-muted)]">
                  {w.college}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
