import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { EVENT_CONFIG } from "@/config/event";
import RegistrationButton from "@/components/common/RegistrationButton";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact desk for ${EVENT_CONFIG.eventName}.`,
};

export default function ContactPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="CONTACT"
        index="12"
        title="Contact"
        titleAccent="desk."
        description="Reach organizers for registration and logistics questions."
      />

      <section className="content-wrap section-pad space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENT_CONFIG.contacts.map((c, idx) => (
            <article key={c.email} className="odyssey-card p-6 space-y-3">
              <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[var(--accent)]">
                DESK-{String(idx + 1).padStart(2, "0")}
              </p>
              <h2 className="font-serif text-2xl text-[var(--text-primary)]">{c.role}</h2>
              <p className="text-sm text-[var(--text-muted)]">{c.name}</p>
              <a
                href={`mailto:${c.email}`}
                className="inline-flex font-mono-custom text-xs tracking-wider text-[var(--accent)] border-b border-[var(--accent)] pb-0.5"
              >
                {c.email}
              </a>
              {c.phone && (
                <p className="font-mono-custom text-xs text-[var(--text-muted)]">{c.phone}</p>
              )}
            </article>
          ))}
        </div>
        <RegistrationButton label="Register now" variant="gold" />
      </section>
    </div>
  );
}
