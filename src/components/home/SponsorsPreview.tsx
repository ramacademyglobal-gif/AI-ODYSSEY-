import Image from "next/image";
import Container from "@/components/common/Container";
import { SPONSORS } from "@/data/sponsors";

export default function SponsorsPreview() {
  return (
    <section className="py-16 sm:py-24 bg-[#050C16] border-y border-white/10">
      <Container size="wide" className="space-y-8 sm:space-y-10">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-mono tracking-[0.2em] uppercase text-[#C5A15A]">Partners</p>
          <h2 className="text-display text-3xl sm:text-5xl text-white leading-[1.05]">
            Powering
            <br />
            <span className="italic text-[#E3C984]">the Odyssey.</span>
          </h2>
          <p className="text-sm text-white/50 font-sans">
            Sponsors are distinct from organizers and appear only when confirmed.
          </p>
        </div>

        {SPONSORS.length === 0 ? (
          <div className="glass rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-display text-2xl sm:text-3xl text-white">
              Partnership announcements coming soon
            </p>
            <p className="mt-3 text-sm text-white/50 font-sans max-w-lg mx-auto">
              Interested in supporting AI Odyssey 24? Reach out through the contact page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SPONSORS.map((sponsor) => (
              <div
                key={sponsor.id}
                className="rounded-2xl bg-white h-28 flex items-center justify-center p-4"
              >
                {sponsor.logoUrl ? (
                  <Image
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    width={140}
                    height={60}
                    className="max-h-14 w-auto object-contain"
                  />
                ) : (
                  <span className="text-sm font-sans font-semibold text-black">{sponsor.name}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
