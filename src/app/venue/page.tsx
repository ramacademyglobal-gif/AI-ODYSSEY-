import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Venue",
  description: `Venue details for ${EVENT_CONFIG.eventName}.`,
};

export default function VenuePage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="VENUE"
        index="06"
        title="Launch"
        titleAccent="coordinates."
        description="Confirmed venue information only — no invented distances or transit claims."
      />

      <section className="content-wrap section-pad grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="odyssey-card p-6 md:p-8 space-y-4">
          <p className="label-tech">Institution</p>
          <h2 className="font-serif text-3xl text-[var(--text-primary)]">
            {EVENT_CONFIG.venueName}
          </h2>
          <p className="font-mono-custom text-sm text-[var(--text-muted)] tracking-wider uppercase">
            {EVENT_CONFIG.city}, {EVENT_CONFIG.state}, {EVENT_CONFIG.country}
          </p>
          {EVENT_CONFIG.venueAddress && (
            <p className="text-sm text-[var(--text-secondary)]">{EVENT_CONFIG.venueAddress}</p>
          )}
        </div>

        <div className="odyssey-card p-6 md:p-8 space-y-4">
          <p className="label-tech">Event window</p>
          <dl className="space-y-3 font-mono-custom text-xs tracking-wider uppercase">
            <div className="flex justify-between gap-4 border-b border-[var(--border-primary)] pb-3">
              <dt className="text-[var(--text-muted)]">Dates</dt>
              <dd className="text-[var(--text-primary)]">28–29 Sept 2026</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--border-primary)] pb-3">
              <dt className="text-[var(--text-muted)]">Check-in</dt>
              <dd className="text-[var(--text-primary)]">09:00–10:00</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Hack window</dt>
              <dd className="text-[var(--text-primary)]">10:00 → 10:00</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
