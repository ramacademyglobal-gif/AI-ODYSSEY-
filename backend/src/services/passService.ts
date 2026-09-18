import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { deriveTeamStatus } from "../utils/mappers.js";

export type PassMember = {
  participant_id: string;
  hacker_id: string;
  full_name: string;
  role: "LEADER" | "MEMBER";
  checked_in: boolean;
  checked_in_at: string | null;
};

export type OrganizerPass = {
  qr_token: string;
  participant: {
    id: string;
    hacker_id: string;
    full_name: string;
    email: string;
    status: string;
  };
  team: {
    team_code: string;
    team_name: string;
    team_size: number;
    member_count: number;
    status: string;
  } | null;
  members: PassMember[];
};

type PassParticipantRow = {
  id: string;
  hacker_id: string;
  full_name: string;
  email: string;
  status?: string;
  qr_token: string;
};

type PassTeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  team_size: number;
  member_count?: number;
  status: string;
};

export async function getPassByQrToken(qrToken: string): Promise<OrganizerPass> {
  const token = qrToken.trim();
  if (!token) {
    throw new AppError(400, "QR token is required", "VALIDATION_ERROR");
  }

  const selectVariants = [
    "id, hacker_id, full_name, email, status, qr_token",
    "id, hacker_id, full_name, email, qr_token",
  ];

  let participant: PassParticipantRow | null = null;
  let participantError: { message?: string } | null = null;

  for (const select of selectVariants) {
    const result = await supabase
      .from("participants")
      .select(select)
      .eq("qr_token", token)
      .maybeSingle();

    if (!result.error) {
      participant = result.data as PassParticipantRow | null;
      participantError = null;
      break;
    }
    participantError = result.error;
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (participantError) {
    throw new AppError(500, "Failed to look up pass", "PASS_LOOKUP_FAILED");
  }

  if (!participant) {
    throw new AppError(404, "Pass not found", "PASS_NOT_FOUND");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("participant_id", participant.id)
    .maybeSingle();

  if (membershipError) {
    throw new AppError(500, "Failed to load team membership", "PASS_TEAM_FAILED");
  }

  if (!membership) {
    return {
      qr_token: participant.qr_token,
      participant: {
        id: participant.id,
        hacker_id: participant.hacker_id,
        full_name: participant.full_name,
        email: participant.email,
        status: participant.status || "REGISTERED",
      },
      team: null,
      members: [],
    };
  }

  const teamSelectVariants = [
    "id, team_code, team_name, team_size, member_count, status",
    "id, team_code, team_name, team_size, status",
  ];

  let team: PassTeamRow | null = null;
  let teamError: { message?: string } | null = null;

  for (const select of teamSelectVariants) {
    const result = await supabase
      .from("teams")
      .select(select)
      .eq("id", membership.team_id)
      .maybeSingle();

    if (!result.error) {
      team = result.data as PassTeamRow | null;
      teamError = null;
      break;
    }
    teamError = result.error;
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (teamError || !team) {
    throw new AppError(500, "Failed to load team", "PASS_TEAM_FAILED");
  }

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select(
      "participant_id, role, joined_at, participants(id, hacker_id, full_name)",
    )
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new AppError(500, "Failed to load team members", "PASS_MEMBERS_FAILED");
  }

  const participantIds = (members ?? []).map((m) => m.participant_id as string);
  const idsFilter = participantIds.length
    ? participantIds
    : ["00000000-0000-0000-0000-000000000000"];

  let checkins:
    | { participant_id: string; checked_in_at?: string | null }[]
    | null = null;
  let checkinError: { message?: string } | null = null;

  for (const select of ["participant_id, checked_in_at", "participant_id"] as const) {
    const result = await supabase
      .from("checkins")
      .select(select)
      .in("participant_id", idsFilter);

    if (!result.error) {
      checkins = (result.data ?? []) as unknown as {
        participant_id: string;
        checked_in_at?: string | null;
      }[];
      checkinError = null;
      break;
    }
    checkinError = result.error;
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (checkinError) {
    throw new AppError(500, "Failed to load check-ins", "PASS_CHECKIN_FAILED");
  }

  const latestCheckin = new Map<string, string | null>();
  for (const row of checkins ?? []) {
    const id = row.participant_id as string;
    const at = (row.checked_in_at as string | null | undefined) ?? null;
    const prev = latestCheckin.get(id);
    if (prev === undefined || (at && (!prev || at > prev))) {
      latestCheckin.set(id, at);
    }
  }

  const publicMembers: PassMember[] = (members ?? []).map((row) => {
    const raw = row as {
      participant_id: string;
      role: "LEADER" | "MEMBER";
      participants?:
        | { id: string; hacker_id: string; full_name: string }
        | { id: string; hacker_id: string; full_name: string }[]
        | null;
    };
    const p = Array.isArray(raw.participants)
      ? raw.participants[0]
      : raw.participants;
    const hasCheckin = latestCheckin.has(raw.participant_id);
    const checkedAt = hasCheckin
      ? latestCheckin.get(raw.participant_id) ?? null
      : null;

    return {
      participant_id: raw.participant_id,
      hacker_id: p?.hacker_id ?? "",
      full_name: p?.full_name ?? "Unknown",
      role: raw.role,
      checked_in: hasCheckin,
      checked_in_at: checkedAt,
    };
  });

  return {
    qr_token: participant.qr_token,
    participant: {
      id: participant.id,
      hacker_id: participant.hacker_id,
      full_name: participant.full_name,
      email: participant.email,
      status: participant.status || "REGISTERED",
    },
    team: {
      team_code: team.team_code,
      team_name: team.team_name,
      team_size: team.team_size,
      member_count: team.member_count ?? publicMembers.length,
      status: deriveTeamStatus(
        team.team_size,
        team.member_count ?? publicMembers.length,
      ),
    },
    members: publicMembers,
  };
}
