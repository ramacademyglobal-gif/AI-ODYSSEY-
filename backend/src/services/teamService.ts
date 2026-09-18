import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateTeamInput,
  JoinTeamInput,
  TeamMemberRow,
  TeamRow,
} from "../types/index.js";
import { buildPublicTeam, deriveTeamStatus } from "../utils/mappers.js";
import {
  generateTeamCode,
  normalizeTeamCode,
} from "../utils/validation.js";

type RpcResult = {
  ok: boolean;
  error?: string;
  message?: string;
  team?: TeamRow & { created_at?: string };
  membership?: TeamMemberRow;
};

const MAX_CODE_ATTEMPTS = 8;

function isMissingColumnError(message: string | undefined): boolean {
  return /column .* does not exist|member_count/i.test(message ?? "");
}

function isMissingRpcError(message: string | undefined): boolean {
  return /could not find the function|PGRST202|schema cache/i.test(
    message ?? "",
  );
}

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

async function countTeamMembers(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (error) {
    throw new AppError(
      500,
      `Failed to count team members: ${error.message}`,
      "TEAM_MEMBERS_FETCH_FAILED",
    );
  }

  return count ?? 0;
}

function withMemberCount(team: TeamRow, memberCount: number): TeamRow {
  return {
    ...team,
    member_count: team.member_count ?? memberCount,
  };
}

async function fetchTeamWithMembers(teamId: string) {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) {
    throw new AppError(
      500,
      `Failed to load team${teamError?.message ? `: ${teamError.message}` : ""}`,
      "TEAM_FETCH_FAILED",
    );
  }

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select(
      "id, team_id, participant_id, role, joined_at, participants(id, full_name, hacker_id)",
    )
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new AppError(
      500,
      `Failed to load team members: ${membersError.message}`,
      "TEAM_MEMBERS_FETCH_FAILED",
    );
  }

  const normalized = (members ?? []).map((row) => {
    const raw = row as TeamMemberRow & {
      participants?:
        | { id: string; full_name: string; hacker_id: string }
        | { id: string; full_name: string; hacker_id: string }[]
        | null;
    };

    const participant = Array.isArray(raw.participants)
      ? (raw.participants[0] ?? null)
      : (raw.participants ?? null);

    return {
      id: raw.id,
      team_id: raw.team_id,
      participant_id: raw.participant_id,
      role: raw.role,
      joined_at: raw.joined_at,
      participants: participant,
    };
  });

  const memberCount = normalized.length;
  const teamRow = withMemberCount(team as TeamRow, memberCount);
  const derivedStatus = deriveTeamStatus(teamRow.team_size, memberCount);

  // Keep DB status in sync when the squad is full but still marked WAITING.
  if (teamRow.status !== derivedStatus) {
    void supabase
      .from("teams")
      .update({
        status: derivedStatus,
        member_count: memberCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId);
  }

  return buildPublicTeam(
    { ...teamRow, member_count: memberCount, status: derivedStatus },
    normalized,
  );
}

function mapRpcFailure(result: RpcResult): never {
  switch (result.error) {
    case "INVALID_TEAM_CODE":
    case "INVALID_TEAM_SIZE":
      throw new AppError(400, result.message ?? "Invalid request", result.error);
    case "PARTICIPANT_NOT_FOUND":
      throw new AppError(404, result.message ?? "Participant not found", result.error);
    case "TEAM_NOT_FOUND":
      throw new AppError(404, result.message ?? "Team not found", result.error);
    case "ALREADY_ON_TEAM":
      throw new AppError(409, result.message ?? "Already on a team", result.error);
    case "TEAM_FULL":
      throw new AppError(409, result.message ?? "Team is full", result.error);
    case "TEAM_CODE_TAKEN":
      throw new AppError(409, result.message ?? "Team code taken", result.error);
    default:
      throw new AppError(
        500,
        result.message ?? "Team operation failed",
        result.error ?? "TEAM_OP_FAILED",
      );
  }
}

async function assertParticipantExists(participantId: string): Promise<void> {
  const { data, error } = await supabase
    .from("participants")
    .select("id")
    .eq("id", participantId)
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      `Failed to verify participant: ${error.message}`,
      "PARTICIPANT_LOOKUP_FAILED",
    );
  }

  if (!data) {
    throw new AppError(404, "Leader participant not found", "PARTICIPANT_NOT_FOUND");
  }
}

async function assertNotAlreadyOnTeam(participantId: string): Promise<void> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      `Failed to check membership: ${error.message}`,
      "MEMBERSHIP_LOOKUP_FAILED",
    );
  }

  if (data) {
    throw new AppError(
      409,
      "Participant already belongs to a team",
      "ALREADY_ON_TEAM",
    );
  }
}

async function assertTeamNameAvailable(teamName: string): Promise<void> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, team_name")
    .ilike("team_name", teamName)
    .limit(1);

  if (error) {
    throw new AppError(
      500,
      `Failed to verify team name uniqueness: ${error.message}`,
      "TEAM_LOOKUP_FAILED",
    );
  }

  const clash = (data ?? []).find(
    (row) =>
      String(row.team_name ?? "").trim().toLowerCase() ===
      teamName.trim().toLowerCase(),
  );
  if (clash) {
    throw new AppError(
      409,
      "Team name is already taken. Choose a different name.",
      "TEAM_NAME_TAKEN",
    );
  }
}

async function insertTeamRow(input: {
  team_code: string;
  team_name: string;
  team_size: number;
  leader_participant_id: string;
}): Promise<TeamRow> {
  const base = {
    team_code: input.team_code,
    team_name: input.team_name,
    team_size: input.team_size,
    leader_participant_id: input.leader_participant_id,
    status: "WAITING",
  };

  const withCount = await supabase
    .from("teams")
    .insert({ ...base, member_count: 1 })
    .select("*")
    .single();

  if (!withCount.error && withCount.data) {
    return withCount.data as TeamRow;
  }

  if (withCount.error && isMissingColumnError(withCount.error.message)) {
    const withoutCount = await supabase
      .from("teams")
      .insert(base)
      .select("*")
      .single();

    if (withoutCount.error) {
      if (isUniqueViolation(withoutCount.error)) {
        const msg = (withoutCount.error.message ?? "").toLowerCase();
        if (msg.includes("team_name")) {
          throw new AppError(
            409,
            "Team name is already taken. Choose a different name.",
            "TEAM_NAME_TAKEN",
          );
        }
        throw new AppError(409, "Team code already exists", "TEAM_CODE_TAKEN");
      }
      throw new AppError(
        500,
        `Failed to create team: ${withoutCount.error.message}`,
        "TEAM_CREATE_FAILED",
      );
    }

    return {
      ...(withoutCount.data as TeamRow),
      member_count: 1,
    };
  }

  if (withCount.error && isUniqueViolation(withCount.error)) {
    const msg = (withCount.error.message ?? "").toLowerCase();
    if (msg.includes("team_name")) {
      throw new AppError(
        409,
        "Team name is already taken. Choose a different name.",
        "TEAM_NAME_TAKEN",
      );
    }
    throw new AppError(409, "Team code already exists", "TEAM_CODE_TAKEN");
  }

  throw new AppError(
    500,
    `Failed to create team: ${withCount.error?.message ?? "unknown error"}`,
    "TEAM_CREATE_FAILED",
  );
}

async function createTeamDirect(input: CreateTeamInput) {
  await assertParticipantExists(input.leader_participant_id);
  await assertNotAlreadyOnTeam(input.leader_participant_id);
  await assertTeamNameAvailable(input.team_name);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const team_code = generateTeamCode();

    try {
      const team = await insertTeamRow({
        team_code,
        team_name: input.team_name,
        team_size: input.team_size,
        leader_participant_id: input.leader_participant_id,
      });

      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        participant_id: input.leader_participant_id,
        role: "LEADER",
      });

      if (memberError) {
        await supabase.from("teams").delete().eq("id", team.id);

        if (isUniqueViolation(memberError)) {
          throw new AppError(
            409,
            "Participant already belongs to a team",
            "ALREADY_ON_TEAM",
          );
        }

        throw new AppError(
          500,
          `Failed to add team leader: ${memberError.message}`,
          "TEAM_CREATE_FAILED",
        );
      }

      return fetchTeamWithMembers(team.id);
    } catch (err) {
      if (err instanceof AppError && err.code === "TEAM_CODE_TAKEN") {
        continue;
      }
      throw err;
    }
  }

  throw new AppError(
    500,
    "Could not allocate a unique team code",
    "TEAM_CODE_ALLOCATION_FAILED",
  );
}

async function joinTeamDirect(input: JoinTeamInput) {
  const team_code = normalizeTeamCode(input.team_code);

  await assertParticipantExists(input.participant_id);
  await assertNotAlreadyOnTeam(input.participant_id);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("team_code", team_code)
    .maybeSingle();

  if (teamError) {
    throw new AppError(
      500,
      `Failed to load team: ${teamError.message}`,
      "TEAM_FETCH_FAILED",
    );
  }

  if (!team) {
    throw new AppError(404, "Team not found", "TEAM_NOT_FOUND");
  }

  const teamRow = team as TeamRow;
  const currentCount = await countTeamMembers(teamRow.id);

  if (currentCount >= teamRow.team_size) {
    throw new AppError(409, "Team is already at capacity", "TEAM_FULL");
  }

  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: teamRow.id,
    participant_id: input.participant_id,
    role: "MEMBER",
  });

  if (memberError) {
    if (isUniqueViolation(memberError)) {
      throw new AppError(
        409,
        "Participant already belongs to a team",
        "ALREADY_ON_TEAM",
      );
    }
    throw new AppError(
      500,
      `Failed to join team: ${memberError.message}`,
      "TEAM_JOIN_FAILED",
    );
  }

  const newCount = currentCount + 1;
  const status = deriveTeamStatus(teamRow.team_size, newCount);

  // Best-effort status/member_count sync; ignore missing-column errors.
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  updatePayload.member_count = newCount;

  const { error: updateError } = await supabase
    .from("teams")
    .update(updatePayload)
    .eq("id", teamRow.id);

  if (updateError && !isMissingColumnError(updateError.message)) {
    // Membership already created; surface soft failure only if unexpected.
    console.error("Team status update failed:", updateError.message);
  }

  return fetchTeamWithMembers(teamRow.id);
}

export async function createTeam(input: CreateTeamInput) {
  await assertTeamNameAvailable(input.team_name);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const team_code = generateTeamCode();

    const { data, error } = await supabase.rpc("create_team", {
      p_team_name: input.team_name,
      p_team_size: input.team_size,
      p_leader_participant_id: input.leader_participant_id,
      p_team_code: team_code,
    });

    if (error) {
      if (
        isMissingRpcError(error.message) ||
        isMissingColumnError(error.message) ||
        /null value in column \"domain\"|column \"domain\"/i.test(error.message ?? "")
      ) {
        return createTeamDirect(input);
      }
      throw new AppError(
        500,
        `Failed to create team: ${error.message}`,
        "TEAM_CREATE_FAILED",
      );
    }

    const result = data as RpcResult;

    if (!result?.ok) {
      if (result?.error === "TEAM_CODE_TAKEN") {
        continue;
      }
      // RPC exists but failed due to schema issues — try direct path.
      if (
        /member_count|column|domain/i.test(result.message ?? "") ||
        result.error === "TEAM_OP_FAILED"
      ) {
        return createTeamDirect(input);
      }
      mapRpcFailure(result ?? { ok: false, message: "Team create failed" });
    }

    if (!result.team?.id) {
      return createTeamDirect(input);
    }

    return fetchTeamWithMembers(result.team.id);
  }

  // Exhausted RPC code retries — still try direct allocation.
  return createTeamDirect(input);
}

export async function getTeamByCode(code: string) {
  const team_code = normalizeTeamCode(code);

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("team_code", team_code)
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      `Failed to fetch team: ${error.message}`,
      "TEAM_FETCH_FAILED",
    );
  }

  if (!team) {
    throw new AppError(404, "Team not found", "TEAM_NOT_FOUND");
  }

  return fetchTeamWithMembers((team as TeamRow).id);
}

export async function joinTeam(input: JoinTeamInput) {
  const { data, error } = await supabase.rpc("join_team", {
    p_team_code: input.team_code,
    p_participant_id: input.participant_id,
  });

  if (error) {
    if (isMissingRpcError(error.message) || isMissingColumnError(error.message)) {
      return joinTeamDirect(input);
    }
    throw new AppError(
      500,
      `Failed to join team: ${error.message}`,
      "TEAM_JOIN_FAILED",
    );
  }

  const result = data as RpcResult;

  if (!result?.ok) {
    if (/member_count|column/i.test(result.message ?? "")) {
      return joinTeamDirect(input);
    }
    mapRpcFailure(result ?? { ok: false, message: "Join failed" });
  }

  if (!result.team?.id) {
    return joinTeamDirect(input);
  }

  return fetchTeamWithMembers(result.team.id);
}
