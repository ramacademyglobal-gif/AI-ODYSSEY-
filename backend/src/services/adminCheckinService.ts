import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { isUuid } from "../utils/validation.js";
import {
  writeAdminAuditLog,
  type AuditActor,
} from "./adminAuditService.js";

export type CheckinMember = {
  hacker_id: string;
  full_name: string;
  role: "LEADER" | "MEMBER";
  checked_in: boolean;
  checked_in_at: string | null;
};

export type CheckinScanResult = {
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
  members: CheckinMember[];
  checkin_summary: {
    checked_in: number;
    total: number;
    remaining: number;
  };
};

export type CheckinActionResult = CheckinScanResult & {
  already_checked_in: boolean;
};

type ParticipantRow = {
  id: string;
  hacker_id: string;
  full_name: string;
  status: string;
};

function normalizeQrToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new AppError(400, "QR token is required", "VALIDATION_ERROR");
  }

  // Accept raw UUID or a full check-in URL containing /checkin/<token>
  try {
    if (trimmed.includes("://") || trimmed.includes("/checkin/")) {
      const url = new URL(
        trimmed.includes("://") ? trimmed : `https://local.invalid${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`,
      );
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p.toLowerCase() === "checkin");
      if (idx >= 0 && parts[idx + 1]) {
        const token = decodeURIComponent(parts[idx + 1]).trim();
        if (isUuid(token)) {
          return token;
        }
      }
    }
  } catch {
    // fall through to raw token validation
  }

  if (!isUuid(trimmed)) {
    throw new AppError(400, "Invalid QR token", "INVALID_QR_TOKEN");
  }

  return trimmed;
}

async function loadParticipantByQrToken(token: string): Promise<ParticipantRow> {
  const { data, error } = await supabase
    .from("participants")
    .select("id, hacker_id, full_name, status")
    .eq("qr_token", token)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "Failed to look up participant", "CHECKIN_LOOKUP_FAILED");
  }

  if (!data) {
    throw new AppError(404, "Participant not found for this QR", "PARTICIPANT_NOT_FOUND");
  }

  return data as ParticipantRow;
}

async function buildScanResult(
  participant: ParticipantRow,
): Promise<CheckinScanResult> {
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("participant_id", participant.id)
    .maybeSingle();

  if (membershipError) {
    throw new AppError(500, "Failed to load team membership", "CHECKIN_TEAM_FAILED");
  }

  if (!membership) {
    throw new AppError(
      409,
      "Participant is not on a team yet",
      "PARTICIPANT_NO_TEAM",
    );
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, team_code, team_name, team_size, status")
    .eq("id", membership.team_id)
    .maybeSingle();

  if (teamError || !team) {
    throw new AppError(500, "Failed to load team", "CHECKIN_TEAM_FAILED");
  }

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select(
      "participant_id, role, joined_at, participants(id, hacker_id, full_name)",
    )
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new AppError(500, "Failed to load team members", "CHECKIN_MEMBERS_FAILED");
  }

  const participantIds = (members ?? []).map((m) => m.participant_id as string);
  const idsFilter = participantIds.length
    ? participantIds
    : ["00000000-0000-0000-0000-000000000000"];

  // Prefer full columns; fall back if live DB is missing checked_in_at.
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
    throw new AppError(500, "Failed to load check-ins", "CHECKIN_STATUS_FAILED");
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

  const publicMembers: CheckinMember[] = (members ?? []).map((row) => {
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
      hacker_id: p?.hacker_id ?? "",
      full_name: p?.full_name ?? "Unknown",
      role: raw.role,
      checked_in: hasCheckin,
      checked_in_at: checkedAt,
    };
  });

  const scannedRole = (membership.role as "LEADER" | "MEMBER") || "MEMBER";
  const scannedHasCheckin = latestCheckin.has(participant.id);
  const scannedCheckinAt = scannedHasCheckin
    ? latestCheckin.get(participant.id) ?? null
    : null;
  const checkedInCount = publicMembers.filter((m) => m.checked_in).length;

  return {
    participant: {
      hacker_id: participant.hacker_id,
      full_name: participant.full_name,
      role: scannedRole,
      checked_in: scannedHasCheckin,
      checked_in_at: scannedCheckinAt,
    },
    team: {
      team_name: team.team_name,
      team_code: team.team_code,
      team_size: team.team_size,
      status: team.status,
    },
    members: publicMembers,
    checkin_summary: {
      checked_in: checkedInCount,
      total: publicMembers.length,
      remaining: Math.max(publicMembers.length - checkedInCount, 0),
    },
  };
}

export async function scanByQrToken(rawToken: string): Promise<CheckinScanResult> {
  const token = normalizeQrToken(rawToken);
  const participant = await loadParticipantByQrToken(token);
  return buildScanResult(participant);
}

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

export async function checkInByQrToken(
  rawToken: string,
  admin?: AuditActor | null,
): Promise<CheckinActionResult> {
  const token = normalizeQrToken(rawToken);
  const participant = await loadParticipantByQrToken(token);
  return checkInParticipant(participant, admin);
}

/** Check in a teammate by hacker_id when scanning the leader (or any team) QR. */
export async function checkInTeammateFromQr(
  rawToken: string,
  hackerId: string,
  admin?: AuditActor | null,
): Promise<CheckinActionResult> {
  const token = normalizeQrToken(rawToken);
  const scanned = await loadParticipantByQrToken(token);
  const scan = await buildScanResult(scanned);

  const targetHacker = hackerId.trim().toUpperCase();
  const onTeam = scan.members.some(
    (m) => m.hacker_id.toUpperCase() === targetHacker,
  );
  if (!onTeam) {
    throw new AppError(
      400,
      "That hacker is not on this team",
      "NOT_ON_TEAM",
    );
  }

  const { data, error } = await supabase
    .from("participants")
    .select("id, hacker_id, full_name, status")
    .eq("hacker_id", targetHacker)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "Failed to look up teammate", "CHECKIN_LOOKUP_FAILED");
  }
  if (!data) {
    throw new AppError(404, "Teammate not found", "PARTICIPANT_NOT_FOUND");
  }

  return checkInParticipant(data as ParticipantRow, admin);
}

async function checkInParticipant(
  participant: ParticipantRow,
  admin?: AuditActor | null,
): Promise<CheckinActionResult> {
  // Ensure they have a team before inserting
  const existingScan = await buildScanResult(participant);
  if (existingScan.participant.checked_in) {
    return {
      ...existingScan,
      already_checked_in: true,
    };
  }

  const insertPayloads: Record<string, unknown>[] = [
    { participant_id: participant.id, method: "QR", checked_in_by: null },
    { participant_id: participant.id, checked_in_by: null },
    { participant_id: participant.id },
  ];

  let insertError: { code?: string; message?: string } | null = null;
  for (const payload of insertPayloads) {
    const result = await supabase.from("checkins").insert(payload);
    if (!result.error) {
      insertError = null;
      break;
    }
    insertError = result.error;
    if (isUniqueViolation(result.error)) {
      break;
    }
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const raced = await buildScanResult(participant);
      return {
        ...raced,
        already_checked_in: true,
      };
    }
    throw new AppError(500, "Failed to create check-in", "CHECKIN_CREATE_FAILED");
  }

  if (admin) {
    await writeAdminAuditLog({
      admin,
      action: "CHECKIN_CREATE",
      targetType: "participant",
      targetId: participant.id,
      metadata: {
        hacker_id: participant.hacker_id,
        method: "QR",
        team_code: existingScan.team.team_code,
      },
    });
  }

  const refreshed = await buildScanResult(participant);
  return {
    ...refreshed,
    already_checked_in: false,
  };
}
