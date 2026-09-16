import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/common/PageHero";
import { ORGANIZERS } from "@/data/organizers";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Organizers",
  description: `The collective behind ${EVENT_CONFIG.eventName}.`,
};

export default function OrganizersPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="ORGANIZERS"
        index="07"
        title="The collective"
        titleAccent="behind the Odyssey."
        description="Organizers — not sponsors — presented with equal visual dignity."
      />

      <section className="content-wrap section-pad">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ORGANIZERS.map((org, idx) => (
            <article key={org.id} className="odyssey-card p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="w-full sm:w-36 h-24 bg-[var(--bg-logo-surface)] flex items-center justify-center p-3 shrink-0">
                <Image
                  src={org.logo}
                  alt={org.name}
                  width={140}
                  height={70}
                  className="max-h-16 w-auto object-contain"
                />
              </div>
              <div className="text-center sm:text-left space-y-2">
                <p className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-[var(--accent)]">
                  {String(idx + 1).padStart(2, "0")}+ · {org.role}
                </p>
                <h2 className="font-serif text-2xl text-[var(--text-primary)]">{org.name}</h2>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
