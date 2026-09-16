import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import RegistrationButton from "@/components/common/RegistrationButton";
import { EVENT_CONFIG } from "@/config/event";

export const metadata: Metadata = {
  title: "Register",
  description: `Register for ${EVENT_CONFIG.eventName}.`,
};

const STEPS = [
  { n: "01", title: "Form your team", copy: `${EVENT_CONFIG.teamMin}–${EVENT_CONFIG.teamMax} members. Cross-department welcome; cross-college not permitted.` },
  { n: "02", title: "Read the rules", copy: "Review eligibility and originality policies." },
  { n: "03", title: "Explore tracks", copy: "Shortlist problem statements that fit your team." },
  { n: "04", title: "Complete registration", copy: "Submit via the official Google Form." },
  { n: "05", title: "Watch for updates", copy: "Monitor email / WhatsApp for confirmations." },
];

export default function RegisterPage() {
  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="REGISTER"
        index="16"
        title="Your Odyssey"
        titleAccent="starts here."
        description="Registration is completed through the official Google Form — no in-site login."
      />

      <section className="content-wrap section-pad grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ol className="lg:col-span-7 border border-[var(--border-primary)]">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5 p-5 border-b border-[var(--border-primary)] last:border-b-0">
              <span className="font-mono-custom text-[var(--accent)] text-sm">{s.n}</span>
              <div>
                <h2 className="font-mono-custom text-xs tracking-widest uppercase text-[var(--text-primary)]">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{s.copy}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="lg:col-span-5">
          <div className="odyssey-card border-[var(--accent)]/40 p-7 space-y-5 sticky top-24">
            <p className="label-tech" style={{ color: "var(--accent)" }}>
              Ready when you are
            </p>
            <h2 className="font-serif text-3xl text-[var(--text-primary)]">Complete registration</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Team size {EVENT_CONFIG.teamMin}–{EVENT_CONFIG.teamMax} · Fee{" "}
              {EVENT_CONFIG.registrationFee ?? "TBA"}
            </p>
            <RegistrationButton label="Complete Registration" variant="gold" />
            <div className="flex gap-4 font-mono-custom text-[10px] tracking-wider uppercase">
              <Link href="/rules" className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                Rules
              </Link>
              <Link href="/challenges" className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                Tracks
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
