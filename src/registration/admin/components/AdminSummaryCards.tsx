"use client";

import { useRouter } from "next/navigation";
import type { DashboardSummary } from "@/registration/admin/services/adminDashboard";
import { ROUTES } from "@/registration/admin/routes";

type Props = {
  summary: DashboardSummary;
};

const CARDS: {
  key: keyof DashboardSummary;
  label: string;
  to: string;
}[] = [
  {
    key: "total_participants",
    label: "Total Participants",
    to: ROUTES.adminParticipants,
  },
  {
    key: "total_teams",
    label: "Total Teams",
    to: `${ROUTES.admin}?crew=all#crew-status`,
  },
  {
    key: "complete_teams",
    label: "Complete Teams",
    to: `${ROUTES.admin}?crew=complete#crew-status`,
  },
  {
    key: "waiting_teams",
    label: "Waiting Teams",
    to: `${ROUTES.admin}?crew=waiting#crew-status`,
  },
];

export function AdminSummaryCards({ summary }: Props) {
  const router = useRouter();

  return (
    <section className="admin-dash__section" aria-labelledby="admin-summary-heading">
      <p className="section-label">OVERVIEW</p>
      <h2 id="admin-summary-heading">Dashboard Summary</h2>
      <div className="admin-dash__cards sb-stagger">
        {CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            className="admin-dash__card admin-dash__card--link"
            onClick={() => router.push(card.to)}
          >
            <p className="admin-dash__card-label">{card.label}</p>
            <p className="admin-dash__card-value">{summary[card.key]}</p>
            <span className="admin-dash__card-hint">Open →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
