import type {
  ParticipantRow,
  PublicParticipant,
  PublicTeam,
  PublicTeamMember,
  TeamMemberRow,
  TeamRow,
} from "../types/index.js";

/** Derive team status from fill count (source of truth over stale DB status). */
export function deriveTeamStatus(
  teamSize: number,
  memberCount: number,
): string {
  if (teamSize === 3) {
    return memberCount >= 3 ? "COMPLETE" : "WAITING";
  }
  if (memberCount >= 4) return "FULL";
  if (memberCount >= 3) return "COMPLETE";
  return "WAITING";
}

export function toPublicParticipant(
  row: ParticipantRow,
): PublicParticipant {
  return {
    id: row.id,
    hacker_id: row.hacker_id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    college: row.college,
    department: row.department,
    year: row.year,
    status: row.status,
    created_at: row.created_at,
  };
}

/** Create response may include qr_token for the owner's badge only. */
export function toCreatedParticipant(row: ParticipantRow) {
  return {
    ...toPublicParticipant(row),
    qr_token: row.qr_token,
  };
}

export function buildPublicTeam(
  team: TeamRow,
  members: Array<TeamMemberRow & {
    participants?: Pick<ParticipantRow, "id" | "full_name" | "hacker_id"> | null;
  }>,
): PublicTeam {
  const publicMembers: PublicTeamMember[] = members.map((m) => ({
    participant_id: m.participant_id,
    full_name: m.participants?.full_name ?? "Unknown",
    hacker_id: m.participants?.hacker_id ?? "",
    role: m.role,
    joined_at: m.joined_at,
  }));

  const leaderMember = publicMembers.find((m) => m.role === "LEADER");
  const memberCount =
    typeof team.member_count === "number" && team.member_count > 0
      ? Math.max(team.member_count, publicMembers.length)
      : publicMembers.length;

  return {
    team_code: team.team_code,
    team_name: team.team_name,
    team_size: team.team_size,
    member_count: memberCount,
    available_slots: Math.max(team.team_size - memberCount, 0),
    status: deriveTeamStatus(team.team_size, memberCount),
    leader: leaderMember
      ? {
          participant_id: leaderMember.participant_id,
          full_name: leaderMember.full_name,
          hacker_id: leaderMember.hacker_id,
        }
      : null,
    members: publicMembers,
  };
}
