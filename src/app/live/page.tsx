import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import EventCountdown from "@/components/common/EventCountdown";
import { ANNOUNCEMENTS } from "@/data/announcements";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Live",
  description: `Mission control for ${EVENT_CONFIG.eventName}.`,
};

export default function LivePage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="LIVE"
        index="13"
        title="Odyssey"
        titleAccent="control."
        description="Countdown, phase awareness and announcements — live when the mission begins."
      />

      <section className="content-wrap section-pad space-y-10">
        <div className="odyssey-card p-8 md:p-12 text-center space-y-6">
          <p className="label-tech">Pre-launch status</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[var(--text-primary)]">
            Control goes live on 28 September 2026
          </h2>
          <EventCountdown />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="label-tech">Announcements</p>
            <Link href="/schedule" className="font-mono-custom text-[10px] tracking-widest uppercase text-[var(--accent)]">
              Timeline →
            </Link>
          </div>
          {ANNOUNCEMENTS.length === 0 ? (
            <div className="odyssey-card border-dashed p-8 text-center text-[var(--text-muted)]">
              No live updates yet.
            </div>
          ) : (
            ANNOUNCEMENTS.map((a) => (
              <article key={a.id} className="odyssey-card p-5 space-y-2">
                <p className="font-mono-custom text-[10px] tracking-wider uppercase text-[var(--accent)]">
                  {a.timestamp}
                </p>
                <h3 className="font-serif text-xl text-[var(--text-primary)]">{a.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{a.content}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
