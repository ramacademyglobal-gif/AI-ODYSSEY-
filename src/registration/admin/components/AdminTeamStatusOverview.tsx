"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TeamStatusItem } from "@/registration/admin/services/adminDashboard";
import { ROUTES } from "@/registration/admin/routes";

type Props = {
  teams: TeamStatusItem[];
};

type CrewFilter = "all" | "complete" | "waiting";

function parseCrewFilter(raw: string | null): CrewFilter {
  if (raw === "complete" || raw === "waiting") return raw;
  return "all";
}

export function AdminTeamStatusOverview({ teams }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const crewFilter = parseCrewFilter(params.get("crew"));

  const filtered = useMemo(() => {
    if (crewFilter === "complete") {
      return teams.filter((team) => team.is_complete);
    }
    if (crewFilter === "waiting") {
      return teams.filter((team) => !team.is_complete);
    }
    return teams;
  }, [crewFilter, teams]);

  const filterLabel =
    crewFilter === "complete"
      ? "Complete teams"
      : crewFilter === "waiting"
        ? "Waiting teams"
        : "All teams";

  function viewTeam(team: TeamStatusItem) {
    const search = new URLSearchParams({
      search: team.team_code,
      team: team.team_name,
    });
    router.push(`${ROUTES.adminParticipants}?${search.toString()}`);
  }

  return (
    <section
      id="crew-status"
      className="admin-dash__section"
      aria-labelledby="admin-teams-heading"
    >
      <p className="section-label">CREWS</p>
      <div className="admin-dash__section-head">
        <h2 id="admin-teams-heading">Team Status</h2>
        <span className="admin-dash__filter-chip">{filterLabel}</span>
      </div>
      {filtered.length === 0 ? (
        <p className="admin-dash__empty">No teams match this view.</p>
      ) : (
        <div className="admin-dash__table-wrap">
          <table className="admin-dash__table">
            <thead>
              <tr>
                <th scope="col">Team</th>
                <th scope="col">Code</th>
                <th scope="col">Fill</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((team) => (
                <tr key={team.team_code}>
                  <td>{team.team_name}</td>
                  <td>
                    <code>{team.team_code}</code>
                  </td>
                  <td>
                    <span
                      className={
                        team.is_complete
                          ? "admin-dash__badge admin-dash__badge--ok"
                          : "admin-dash__badge admin-dash__badge--wait"
                      }
                    >
                      {team.fill_label}
                    </span>
                  </td>
                  <td>{team.status}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-dash__link-btn"
                      onClick={() => viewTeam(team)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
