import type { Metadata } from "next";
import PageHero from "@/components/common/PageHero";
import { JUDGING_CRITERIA, EVALUATION_STAGES } from "@/data/judging";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Judging",
  description: `Judging criteria for ${EVENT_CONFIG.eventName}.`,
};

export default function JudgingPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="JUDGING"
        index="06"
        title="How missions"
        titleAccent="are evaluated."
        description="Criteria without invented percentages. Weights appear only when organizers confirm them."
      />

      <section className="content-wrap section-pad space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {JUDGING_CRITERIA.map((c, idx) => (
            <article key={c.id} className="odyssey-card p-6">
              <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[var(--accent)]">
                CRITERION-{String(idx + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--text-primary)]">{c.title}</h2>
              <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">{c.description}</p>
              {c.weightage ? (
                <p className="mt-4 font-mono-custom text-xs text-[var(--accent)]">{c.weightage}</p>
              ) : (
                <p className="mt-4 font-mono-custom text-[10px] tracking-wider uppercase text-[var(--text-muted)]">
                  Weight TBA
                </p>
              )}
            </article>
          ))}
        </div>

        {EVALUATION_STAGES?.length > 0 && (
          <div className="border border-[var(--border-primary)]">
            {EVALUATION_STAGES.map((stage) => (
              <div key={stage.step} className="p-5 border-b border-[var(--border-primary)] last:border-b-0 grid md:grid-cols-12 gap-3">
                <p className="md:col-span-2 font-mono-custom text-[var(--accent)] text-xs">{stage.step}</p>
                <div className="md:col-span-10">
                  <h3 className="font-serif text-xl text-[var(--text-primary)]">{stage.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{stage.description}</p>
                  <p className="font-mono-custom text-[10px] tracking-wider uppercase text-[var(--text-muted)] mt-2">
                    {stage.timeframe}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
