import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { SPONSORS } from "@/data/sponsors";
import { EVENT_CONFIG } from "@/config/event";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sponsors",
  description: `Partners powering ${EVENT_CONFIG.eventName}.`,
};

export default function SponsorsPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="SPONSORS"
        index="10"
        title="Powering"
        titleAccent="the Odyssey."
        description="Sponsors are distinct from organizers. Only confirmed partners appear here."
      />

      <section className="content-wrap section-pad">
        {SPONSORS.length === 0 ? (
          <div className="odyssey-card border-dashed p-12 text-center space-y-4">
            <p className="font-serif text-3xl text-[var(--text-primary)]">
              Partnership announcements coming soon
            </p>
            <p className="text-[var(--text-muted)]">
              Interested in supporting AI Odyssey 24?
            </p>
            <Link
              href="/contact"
              className="inline-flex font-mono-custom text-xs tracking-widest uppercase text-[var(--accent)] border-b border-[var(--accent)] pb-0.5"
            >
              Contact organizers →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SPONSORS.map((s, idx) => (
              <div key={s.id} className="odyssey-card p-5 text-center">
                <p className="font-mono-custom text-[10px] text-[var(--accent)] tracking-widest">
                  {String(idx + 1).padStart(2, "0")}+
                </p>
                <p className="mt-2 font-serif text-lg text-[var(--text-primary)]">{s.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
