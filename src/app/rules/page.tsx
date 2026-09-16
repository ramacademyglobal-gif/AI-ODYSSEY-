import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Rules",
  description: `Rulebook and policies for ${EVENT_CONFIG.eventName}.`,
};

const SECTIONS = [
  { id: "01", title: "Eligibility & Team Structure", body: EVENT_CONFIG.rulesHighlights[1] },
  { id: "02", title: "Development Window & Originality", body: EVENT_CONFIG.rulesHighlights[0] },
  { id: "03", title: "AI Tools Policy", body: EVENT_CONFIG.aiToolPolicyHighlights.join(" ") },
  { id: "04", title: "Submission", body: EVENT_CONFIG.rulesHighlights[4] },
  {
    id: "05",
    title: "Code of Conduct",
    body: "Participants must maintain professional conduct. Harassment, discrimination, or unsafe behaviour leads to disqualification. Jury decisions are final.",
  },
  {
    id: "06",
    title: "Disqualification",
    body: "Pre-existing full applications, plagiarism, or violation of originality / AI tool policy may result in disqualification.",
  },
];

export default function RulesPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="RULES"
        index="04"
        title="Rulebook"
        titleAccent="& mission policy."
        description="Read before you build. Unknown policies remain TBA until organizers publish updates."
      />
      <section className="content-wrap section-pad max-w-4xl">
        <div className="border border-[var(--border-primary)]">
          {SECTIONS.map((s) => (
            <article key={s.id} className="p-6 md:p-8 border-b border-[var(--border-primary)] last:border-b-0">
              <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[var(--accent)]">
                RULE-{s.id}
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--text-primary)]">{s.title}</h2>
              <p className="mt-3 text-[var(--text-muted)] leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
