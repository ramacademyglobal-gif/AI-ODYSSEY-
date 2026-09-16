import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import RegistrationButton from "@/components/common/RegistrationButton";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "About",
  description: EVENT_CONFIG.description,
};

export default function AboutPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="ABOUT"
        index="01"
        title="Built for those"
        titleAccent="who choose to build."
        description={EVENT_CONFIG.description}
      />

      <section className="content-wrap section-pad space-y-10">
        <p className="font-mono-custom text-[10px] tracking-[0.25em] uppercase text-[var(--accent)]">
          {EVENT_CONFIG.tagline}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Duration", "24 HOURS"],
            ["Dates", "28–29 SEPT 2026"],
            ["Venue", "RIT"],
            ["Location", (EVENT_CONFIG.city ?? "RAJAPALAYAM").toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} className="odyssey-card p-5">
              <p className="label-tech">{k}</p>
              <p className="mt-2 font-mono-custom text-lg text-[var(--accent)] tracking-wider">{v}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-6">
          <RegistrationButton label="Register Now" />
          <Link
            href="/challenges"
            className="font-mono-custom text-xs tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            Explore tracks ✦
          </Link>
        </div>
      </section>
    </div>
  );
}
