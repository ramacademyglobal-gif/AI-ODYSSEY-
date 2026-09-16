import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { GALLERY_ITEMS } from "@/data/gallery";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Gallery",
  description: `Moments from ${EVENT_CONFIG.eventName}.`,
};

export default function GalleryPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="GALLERY"
        index="14"
        title="The story"
        titleAccent="hasn't been written yet."
        description="Event moments will appear here after the Odyssey begins."
      />

      <section className="content-wrap section-pad">
        {GALLERY_ITEMS.length === 0 ? (
          <div className="odyssey-card border-dashed p-12 text-center space-y-3">
            <p className="font-serif text-3xl text-[var(--text-primary)]">Archive empty</p>
            <p className="font-mono-custom text-xs tracking-widest uppercase text-[var(--text-muted)]">
              Opening · Building · Mentoring · Midnight · Final pitches · Awards
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GALLERY_ITEMS.map((item) => (
              <figure key={item.id} className="odyssey-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                <figcaption className="p-4">
                  <p className="font-mono-custom text-[10px] tracking-wider uppercase text-[var(--accent)]">
                    {item.category}
                  </p>
                  <p className="font-serif text-lg text-[var(--text-primary)]">{item.title}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
