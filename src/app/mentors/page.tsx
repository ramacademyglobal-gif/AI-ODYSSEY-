import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { MENTORS, JURY } from "@/data/people";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Mentors",
  description: `Mentors and jury for ${EVENT_CONFIG.eventName}.`,
};

export default function MentorsPage() {
  const empty = MENTORS.length === 0 && JURY.length === 0;

  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="MENTORS"
        index="09"
        title="Minds guiding"
        titleAccent="the journey."
        description="Confirmed mentors and jury will appear here when organizers publish the roster."
      />

      <section className="content-wrap section-pad">
        {empty ? (
          <div className="odyssey-card border-dashed p-12 text-center">
            <p className="font-serif text-3xl text-[var(--text-primary)]">Announcements coming soon</p>
            <p className="mt-3 text-[var(--text-muted)] font-mono-custom text-xs tracking-widest uppercase">
              Mentors · Jury · TBA
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...MENTORS, ...JURY].map((p) => (
              <article key={p.id} className="odyssey-card p-6">
                <h2 className="font-serif text-xl text-[var(--text-primary)]">{p.name}</h2>
                <p className="mt-1 font-mono-custom text-[10px] tracking-wider uppercase text-[var(--accent)]">
                  {p.designation}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{p.company}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
