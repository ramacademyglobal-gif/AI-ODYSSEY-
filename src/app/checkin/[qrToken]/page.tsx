"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RouteVeil } from "@/registration/components/RouteVeil";
import { API_BASE, ApiError } from "@/registration/services/api";
import "@/registration/styles/checkin.css";
import "@/registration/styles/motion.css";

type GateMember = {
  hacker_id: string;
  full_name: string;
  role: "LEADER" | "MEMBER";
  checked_in: boolean;
  checked_in_at: string | null;
};

type GateCheckinView = {
  participant: {
    hacker_id: string;
    full_name: string;
    role: "LEADER" | "MEMBER";
    checked_in: boolean;
    checked_in_at: string | null;
  };
  team: {
    team_name: string;
    team_code: string;
    team_size: number;
    status: string;
  };
  members: GateMember[];
  checkin_summary: {
    checked_in: number;
    total: number;
    remaining: number;
  };
  already_checked_in?: boolean;
};

async function requestGate<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the registration server. Is the backend running on port 5000?",
      "NETWORK_ERROR",
    );
  }

  const body = (await response.json()) as {
    success?: boolean;
    data?: T;
    message?: string;
    details?: string[];
  };

  if (!response.ok || !body.success || !body.data) {
    throw new ApiError(
      response.status,
      body.details?.[0] || body.message || "Request failed",
      "GATE_CHECKIN_FAILED",
      body.details ?? [],
    );
  }

  return body.data;
}

function formatCheckinTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function roleLabel(role: string): string {
  return role === "LEADER" ? "TEAM LEADER" : "TEAM MEMBER";
}

export default function CheckinGatePage() {
  const params = useParams<{ qrToken: string }>();
  const qrToken = decodeURIComponent(params.qrToken ?? "").trim();
  const [view, setView] = useState<GateCheckinView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const loadScan = useCallback(async (token: string) => {
    return requestGate<GateCheckinView>(
      `/passes/${encodeURIComponent(token)}/scan`,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setFlash(null);

      if (!qrToken) {
        setError("Invalid QR token.");
        setLoading(false);
        return;
      }

      try {
        const data = await loadScan(qrToken);
        if (!cancelled) setView(data);
      } catch (err) {
        if (!cancelled) {
          setView(null);
          setError(
            err instanceof ApiError
              ? err.message
              : "Pass not found. Ensure the registration backend is online.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [qrToken, loadScan]);

  const handleCheckIn = async () => {
    if (!qrToken || submitting) return;

    setSubmitting(true);
    setError(null);
    setFlash(null);

    try {
      const result = await requestGate<
        GateCheckinView & { already_checked_in: boolean }
      >(`/passes/${encodeURIComponent(qrToken)}/checkin`, {
        method: "POST",
        body: "{}",
      });
      setView(result);
      setFlash(
        result.already_checked_in
          ? `${result.participant.full_name} was already checked in.`
          : `${result.participant.full_name} is checked in.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Check-in failed. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const remainingMembers =
    view?.members.filter((member) => !member.checked_in) ?? [];
  const checkedMembers =
    view?.members.filter((member) => member.checked_in) ?? [];
  const progressPct = view
    ? Math.round(
        (view.checkin_summary.checked_in /
          Math.max(view.checkin_summary.total, 1)) *
          100,
      )
    : 0;

  return (
    <div className="page-stage">
      <RouteVeil />
      <main className="checkin-page">
      <div className="checkin-shell">
        <Link className="checkin-home checkin-home--top" href="/">
          ← Back to home
        </Link>
        <p className="checkin-eyebrow">Organizer scan · AI ODYSSEY 24</p>
        <h1>Team check-in</h1>
        <p className="checkin-lead">
          Confirm this hacker at the gate, then track who still needs to scan.
        </p>

        {loading ? <p className="checkin-muted">Loading pass…</p> : null}
        {error ? (
          <p className="checkin-error" role="alert">
            {error}
          </p>
        ) : null}
        {flash ? (
          <p className="checkin-flash" role="status">
            {flash}
          </p>
        ) : null}

        {view ? (
          <>
            <section className="checkin-hero">
              <div className="checkin-hero__main">
                <p className="checkin-kicker">Scanned participant</p>
                <h2 className="checkin-hero__name">
                  {view.participant.full_name}
                </h2>
                <code className="checkin-hero__id">
                  {view.participant.hacker_id}
                </code>
                <p className="checkin-hero__role">
                  {roleLabel(view.participant.role)}
                </p>
              </div>

              <div className="checkin-hero__action">
                {view.participant.checked_in ? (
                  <div className="checkin-done" role="status">
                    <strong>Checked in</strong>
                    <span>
                      {formatCheckinTime(view.participant.checked_in_at) ||
                        "On record"}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="checkin-confirm"
                    onClick={() => void handleCheckIn()}
                    disabled={submitting}
                  >
                    {submitting ? "Checking in…" : "Mark as checked in"}
                  </button>
                )}
              </div>
            </section>

            <section className="checkin-card checkin-card--team">
              <div className="checkin-team-head">
                <div>
                  <p className="checkin-kicker">Team</p>
                  <h3>{view.team.team_name}</h3>
                </div>
                <div className="checkin-progress" aria-hidden="true">
                  <div
                    className="checkin-progress__fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <dl className="checkin-meta">
                <div>
                  <dt>Team code</dt>
                  <dd>{view.team.team_code}</dd>
                </div>
                <div>
                  <dt>Checked in</dt>
                  <dd>
                    {view.checkin_summary.checked_in}/
                    {view.checkin_summary.total}
                  </dd>
                </div>
                <div>
                  <dt>Still waiting</dt>
                  <dd>{view.checkin_summary.remaining}</dd>
                </div>
              </dl>
            </section>

            <section className="checkin-card">
              <div className="checkin-section-head">
                <h3>Remaining teammates</h3>
                <span>
                  {remainingMembers.length === 0
                    ? "All clear"
                    : `${remainingMembers.length} left`}
                </span>
              </div>
              {remainingMembers.length === 0 ? (
                <p className="checkin-muted">
                  Every teammate on record is checked in.
                </p>
              ) : (
                <ul className="checkin-members">
                  {remainingMembers.map((member) => (
                    <li key={member.hacker_id}>
                      <div>
                        <strong>{member.full_name}</strong>
                        <span>
                          {roleLabel(member.role)} · {member.hacker_id || "—"}
                        </span>
                      </div>
                      <em className="checkin-badge checkin-badge--no">
                        NOT CHECKED IN
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="checkin-card">
              <div className="checkin-section-head">
                <h3>Checked in</h3>
                <span>{checkedMembers.length}</span>
              </div>
              {checkedMembers.length === 0 ? (
                <p className="checkin-muted">No check-ins yet for this team.</p>
              ) : (
                <ul className="checkin-members">
                  {checkedMembers.map((member) => (
                    <li key={member.hacker_id}>
                      <div>
                        <strong>{member.full_name}</strong>
                        <span>
                          {roleLabel(member.role)} · {member.hacker_id || "—"}
                        </span>
                      </div>
                      <em className="checkin-badge checkin-badge--yes">
                        CHECKED IN
                        {member.checked_in_at
                          ? ` · ${formatCheckinTime(member.checked_in_at)}`
                          : ""}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
    </div>
  );
}
