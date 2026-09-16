import Container from "@/components/common/Container";
import { EVENT_CONFIG } from "@/config/event";

export default function WhyParticipate() {
  return (
    <section className="py-16 sm:py-24 bg-[#050C16] border-y border-white/10">
      <Container size="wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-4">
            <p className="text-xs font-mono tracking-[0.2em] uppercase text-[#C5A15A]">Why participate</p>
            <h2 className="text-display text-3xl sm:text-5xl text-white leading-[1.05]">
              What can 24 hours
              <br />
              <span className="italic text-[#E3C984]">change for you?</span>
            </h2>
            <p className="text-base text-white/55 font-sans leading-relaxed">
              Pressure creates clarity. Collaboration creates momentum. One continuous build can
              reshape how you think about products, teams and possibility.
            </p>
          </div>

          <ol className="lg:col-span-7 space-y-3">
            {EVENT_CONFIG.participantBenefits.map((benefit, index) => (
              <li
                key={benefit}
                className="group glass rounded-2xl border border-white/10 px-5 py-5 flex gap-5 hover:border-[#C5A15A]/40 transition-all hover:-translate-y-0.5"
              >
                <span className="font-serif text-2xl text-[#C5A15A]/80 tabular-nums min-w-[2.5rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-base sm:text-lg font-sans text-white/85 leading-relaxed pt-1">
                  {benefit}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
