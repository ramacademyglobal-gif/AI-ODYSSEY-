import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { resolvePaymentScreenshotUrl } from "./paymentStorageService.js";

export type RosterExportRow = {
  team_code: string;
  team_name: string;
  team_size: string;
  hacker_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  role: string;
  created_at: string;
};

type ParticipantExportRow = {
  id: string;
  hacker_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string | null;
  year: string | null;
  created_at: string;
};

type MembershipExportRow = {
  participant_id: string;
  role: string;
  team_id: string;
};

type TeamExportRow = {
  id: string;
  team_code: string;
  team_name: string;
  team_size: number;
};

/**
 * Full roster for Excel export, sorted by team then role (LEADER first).
 * Members of the same team stay contiguous for cell merging.
 */
export async function getRosterExportRows(): Promise<RosterExportRow[]> {
  const [participantsResult, membershipsResult, teamsResult] =
    await Promise.all([
      supabase
        .from("participants")
        .select(
          "id, hacker_id, full_name, email, phone, college, department, year, created_at",
        )
        .order("created_at", { ascending: true }),
      supabase.from("team_members").select("participant_id, role, team_id"),
      supabase.from("teams").select("id, team_code, team_name, team_size"),
    ]);

  if (participantsResult.error) {
    throw new AppError(
      500,
      `Failed to load participants for export: ${participantsResult.error.message}`,
      "EXPORT_FAILED",
    );
  }
  if (membershipsResult.error) {
    throw new AppError(
      500,
      `Failed to load team members for export: ${membershipsResult.error.message}`,
      "EXPORT_FAILED",
    );
  }
  if (teamsResult.error) {
    throw new AppError(
      500,
      `Failed to load teams for export: ${teamsResult.error.message}`,
      "EXPORT_FAILED",
    );
  }

  const participants = (participantsResult.data ?? []) as ParticipantExportRow[];
  const memberships = (membershipsResult.data ?? []) as MembershipExportRow[];
  const teams = (teamsResult.data ?? []) as TeamExportRow[];

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const membershipByParticipant = new Map(
    memberships.map((m) => [m.participant_id, m]),
  );

  const rows: Array<RosterExportRow & { _sortTeam: string; _sortRole: number }> =
    participants.map((p) => {
      const membership = membershipByParticipant.get(p.id);
      const team = membership ? teamById.get(membership.team_id) : undefined;
      const role = membership?.role ?? "";

      return {
        team_code: team?.team_code ?? "",
        team_name: team?.team_name ?? "",
        team_size: team ? String(team.team_size) : "",
        hacker_id: p.hacker_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        department: p.department ?? "",
        year: p.year ?? "",
        role,
        created_at: p.created_at ?? "",
        _sortTeam: (team?.team_code || "\uFFFF").toLowerCase(),
        _sortRole: role === "LEADER" ? 0 : role === "MEMBER" ? 1 : 2,
      };
    });

  rows.sort((a, b) => {
    if (a._sortTeam !== b._sortTeam) {
      return a._sortTeam.localeCompare(b._sortTeam);
    }
    if (a._sortRole !== b._sortRole) {
      return a._sortRole - b._sortRole;
    }
    return a.full_name.localeCompare(b.full_name);
  });

  return rows.map(({ _sortTeam: _t, _sortRole: _r, ...row }) => row);
}

export type PaymentExportRow = {
  team_name: string;
  team_size: string;
  full_name: string;
  phone: string;
  college: string;
  transaction_id: string;
  screenshot_url: string;
};

type ParticipantPaymentExportRow = {
  id: string;
  full_name: string;
  phone: string;
  college: string;
  payment_txn_id: string | null;
  payment_drive_file_id: string | null;
  payment_drive_file_url: string | null;
};

/**
 * Payment proof export: team + contact + txn id + screenshot URL.
 * Only participants who submitted payment proof.
 */
export async function getPaymentExportRows(): Promise<PaymentExportRow[]> {
  const [participantsResult, membershipsResult, teamsResult] =
    await Promise.all([
      supabase
        .from("participants")
        .select(
          "id, full_name, phone, college, payment_txn_id, payment_drive_file_id, payment_drive_file_url",
        )
        .not("payment_txn_id", "is", null)
        .order("created_at", { ascending: true }),
      supabase.from("team_members").select("participant_id, role, team_id"),
      supabase.from("teams").select("id, team_code, team_name, team_size"),
    ]);

  if (participantsResult.error) {
    throw new AppError(
      500,
      `Failed to load payments for export: ${participantsResult.error.message}`,
      "EXPORT_FAILED",
    );
  }
  if (membershipsResult.error) {
    throw new AppError(
      500,
      `Failed to load team members for export: ${membershipsResult.error.message}`,
      "EXPORT_FAILED",
    );
  }
  if (teamsResult.error) {
    throw new AppError(
      500,
      `Failed to load teams for export: ${teamsResult.error.message}`,
      "EXPORT_FAILED",
    );
  }

  const participants = (participantsResult.data ??
    []) as ParticipantPaymentExportRow[];
  const memberships = (membershipsResult.data ?? []) as MembershipExportRow[];
  const teams = (teamsResult.data ?? []) as TeamExportRow[];

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const membershipByParticipant = new Map(
    memberships.map((m) => [m.participant_id, m]),
  );

  const { resolvePaymentScreenshotUrl } = await import(
    "./paymentStorageService.js"
  );

  const rows: PaymentExportRow[] = [];

  for (const p of participants) {
    if (!p.payment_txn_id?.trim()) continue;

    const membership = membershipByParticipant.get(p.id);
    const team = membership ? teamById.get(membership.team_id) : undefined;
    // 7-day signed URL so Excel links stay usable for organizers
    const screenshotUrl =
      (await resolvePaymentScreenshotUrl(
        p.payment_drive_file_url ?? p.payment_drive_file_id,
        60 * 60 * 24 * 7,
      )) ?? "";

    rows.push({
      team_name: team?.team_name ?? "",
      team_size: team ? String(team.team_size) : "",
      full_name: p.full_name,
      phone: p.phone,
      college: p.college,
      transaction_id: p.payment_txn_id,
      screenshot_url: screenshotUrl,
    });
  }

  rows.sort((a, b) => {
    const teamCmp = a.team_name.localeCompare(b.team_name);
    if (teamCmp !== 0) return teamCmp;
    return a.full_name.localeCompare(b.full_name);
  });

  return rows;
}
