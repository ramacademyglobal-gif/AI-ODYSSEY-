"use client";

import type { RecentRegistration } from "@/registration/admin/services/adminDashboard";

type Props = {
  registrations: RecentRegistration[]
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AdminRecentRegistrations({ registrations }: Props) {
  return (
    <section className="admin-dash__section" aria-labelledby="admin-recent-heading">
      <p className="section-label">INTAKE</p>
      <h2 id="admin-recent-heading">Recent Registrations</h2>
      {registrations.length === 0 ? (
        <p className="admin-dash__empty">No registrations yet.</p>
      ) : (
        <div className="admin-dash__table-wrap">
          <table className="admin-dash__table">
            <thead>
              <tr>
                <th scope="col">Hacker ID</th>
                <th scope="col">Name</th>
                <th scope="col">Registered</th>
                <th scope="col">Team</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((row) => (
                <tr key={row.hacker_id}>
                  <td>
                    <code>{row.hacker_id}</code>
                  </td>
                  <td>
                    <div className="admin-dash__stack">
                      <strong>{row.full_name}</strong>
                      <span>{row.college}</span>
                    </div>
                  </td>
                  <td>{formatTimestamp(row.created_at)}</td>
                  <td>
                    {row.team ? (
                      <div className="admin-dash__stack">
                        <strong>{row.team.team_name}</strong>
                        <span>
                          {row.team.team_code} · {row.team.fill_label}
                        </span>
                      </div>
                    ) : (
                      <span className="admin-dash__muted">No team</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
