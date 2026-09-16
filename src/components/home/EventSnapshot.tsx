import Container from "@/components/common/Container";
import { EVENT_CONFIG } from "@/config/event";

export default function EventSnapshot() {
  const items = [
    { label: "Duration", value: "24 Hours" },
    { label: "Dates", value: "28–29 Sept" },
    { label: "Location", value: EVENT_CONFIG.city ?? "Rajapalayam" },
    EVENT_CONFIG.challengeCount
      ? { label: "Challenges", value: String(EVENT_CONFIG.challengeCount) }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section className="bg-black border-y border-white/10 py-8 sm:py-10">
      <Container size="wide">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="glass rounded-2xl border border-white/10 px-5 py-6 text-center hover:border-[#C5A15A]/40 transition-colors"
            >
              <p className="text-[10px] sm:text-xs font-mono tracking-[0.18em] uppercase text-[#C5A15A]">
                {item.label}
              </p>
              <p className="mt-2 text-display text-2xl sm:text-3xl text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
