import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { resolvePaymentScreenshotUrl } from "./paymentStorageService.js";
import { deriveTeamStatus } from "../utils/mappers.js";
import {
  writeAdminAuditLog,
  type AuditActor,
} from "./adminAuditService.js";

export const PARTICIPANT_STATUSES = ["REGISTERED", "CANCELLED"] as const;
export type ParticipantAdminStatus = (typeof PARTICIPANT_STATUSES)[number];

export type AdminParticipantTeam = {
  team_code: string;
  team_name: string;
  team_size: number;
  member_count: number;
  status: string;
  role: string;
};

export type AdminParticipantListItem = {
  id: string;
  hacker_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  status: string;
  created_at: string;
  updated_at: string;
  payment_txn_id: string | null;
  payment_drive_file_url: string | null;
  payment_verified_at: string | null;
  team: AdminParticipantTeam | null;
};

export type AdminParticipantDetail = AdminParticipantListItem;

export type ListParticipantsQuery = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  year?: string;
};

export type ListParticipantsResult = {
  items: AdminParticipantListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export type UpdateParticipantInput = {
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
};

type TeamNested = {
  team_code: string;
  team_name: string;
  team_size: number;
  member_count?: number;
  status: string;
};

type MembershipNested = {
  role: string;
  teams: TeamNested | TeamNested[] | null;
};

type ParticipantQueryRow = {
  id: string;
  hacker_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department?: string;
  year?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  payment_txn_id?: string | null;
  payment_drive_file_id?: string | null;
  payment_drive_file_url?: string | null;
  payment_verified_at?: string | null;
  team_members?: MembershipNested[] | null;
};

const PARTICIPANT_SELECT_MINIMAL = `
  id,
  hacker_id,
  full_name,
  email,
  phone,
  college,
  status,
  created_at,
  updated_at,
  team_members (
    role,
    teams (
      team_code,
      team_name,
      team_size,
      status
    )
  )
`;

const PARTICIPANT_SELECT_BASIC = `
  id,
  hacker_id,
  full_name,
  email,
  phone,
  college,
  department,
  year,
  status,
  created_at,
  updated_at,
  payment_txn_id,
  payment_drive_file_id,
  payment_drive_file_url,
  payment_verified_at,
  team_members (
    role,
    teams (
      team_code,
      team_name,
      team_size,
      status
    )
  )
`;

function extractTeam(
  membership: MembershipNested[] | null,
): AdminParticipantTeam | null {
  if (!membership || membership.length === 0) {
    return null;
  }

  const first = membership[0];
  if (!first) {
    return null;
  }

  // PostgREST may return `teams` or aliased `team`
  const raw = first as MembershipNested & {
    team?: TeamNested | TeamNested[] | null;
  };
  const nested = raw.teams ?? raw.team ?? null;
  const team = Array.isArray(nested) ? nested[0] : nested;
  if (!team) {
    return null;
  }

  const memberCount =
    typeof team.member_count === "number" ? team.member_count : 0;

  return {
    team_code: team.team_code,
    team_name: team.team_name,
    team_size: team.team_size,
    member_count: memberCount,
    status: deriveTeamStatus(team.team_size, memberCount || 1),
    role: first.role,
  };
}

async function toAdminParticipant(
  row: ParticipantQueryRow,
): Promise<AdminParticipantListItem> {
  let team = extractTeam(row.team_members ?? null);

  // Always prefer direct lookup so missing nested embeds / member_count
  // schema drift still resolve the real team name.
  if (!team?.team_name) {
    team = await loadTeamForParticipant(row.id);
  } else if (!team.member_count) {
    const filled = await loadTeamForParticipant(row.id);
    if (filled) {
      team = { ...team, member_count: filled.member_count, status: filled.status };
    }
  }

  return {
    id: row.id,
    hacker_id: row.hacker_id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    college: row.college,
    department: row.department || "",
    year: row.year || "",
    status: row.status || "REGISTERED",
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    payment_txn_id: row.payment_txn_id ?? null,
    payment_drive_file_url: await resolvePaymentScreenshotUrl(
      row.payment_drive_file_url ?? row.payment_drive_file_id ?? null,
    ),
    payment_verified_at: row.payment_verified_at ?? null,
    team,
  };
}

async function loadTeamForParticipant(
  participantId: string,
): Promise<AdminParticipantTeam | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("role, team_id")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (membershipError || !membership?.team_id) {
    return null;
  }

  const teamSelectVariants = [
    "team_code, team_name, team_size, member_count, status",
    "team_code, team_name, team_size, status",
    "team_code, team_name, team_size",
  ];

  let team: {
    team_code: string;
    team_name: string;
    team_size: number;
    member_count?: number;
    status?: string;
  } | null = null;

  for (const select of teamSelectVariants) {
    const result = await supabase
      .from("teams")
      .select(select)
      .eq("id", membership.team_id)
      .maybeSingle();

    if (!result.error) {
      team = result.data as unknown as {
        team_code: string;
        team_name: string;
        team_size: number;
        member_count?: number;
        status?: string;
      } | null;
      break;
    }
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (!team) {
    return null;
  }

  let memberCount =
    typeof team.member_count === "number" ? team.member_count : 0;
  if (!memberCount) {
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", membership.team_id);
    memberCount = count ?? 0;
  }

  return {
    team_code: team.team_code,
    team_name: team.team_name,
    team_size: team.team_size,
    member_count: memberCount,
    status: deriveTeamStatus(team.team_size, memberCount),
    role: membership.role,
  };
}

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

async function findParticipantIdsByTeamSearch(
  escaped: string,
): Promise<string[]> {
  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .or(`team_name.ilike.%${escaped}%,team_code.ilike.%${escaped}%`);

  if (teamError || !teams?.length) {
    return [];
  }

  const teamIds = teams.map((t) => t.id as string);
  const { data: members, error: memberError } = await supabase
    .from("team_members")
    .select("participant_id")
    .in("team_id", teamIds);

  if (memberError || !members?.length) {
    return [];
  }

  return [
    ...new Set(members.map((m) => m.participant_id as string).filter(Boolean)),
  ];
}

export async function listParticipants(
  query: ListParticipantsQuery,
): Promise<ListParticipantsResult> {
  const page = Math.max(1, query.page);
  const pageSize = Math.min(Math.max(query.pageSize, 1), 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const search = query.search?.trim();
  const escaped = search ? search.replace(/[%_,]/g, "") : "";
  const teamMatchedIds = escaped
    ? await findParticipantIdsByTeamSearch(escaped)
    : [];

  function applyFilters<T extends { eq: Function; or: Function; in: Function }>(
    builder: T,
  ): T {
    let next = builder;
    if (query.status) {
      next = next.eq("status", query.status) as T;
    }
    if (query.year) {
      next = next.eq("year", query.year) as T;
    }
    if (escaped) {
      const clauses = [
        `hacker_id.ilike.%${escaped}%`,
        `full_name.ilike.%${escaped}%`,
        `email.ilike.%${escaped}%`,
        `college.ilike.%${escaped}%`,
        `phone.ilike.%${escaped}%`,
      ];
      if (teamMatchedIds.length > 0) {
        clauses.push(`id.in.(${teamMatchedIds.join(",")})`);
      }
      next = next.or(clauses.join(",")) as T;
    }
    return next;
  }

  const selectVariants = [
    PARTICIPANT_SELECT_BASIC,
    PARTICIPANT_SELECT_MINIMAL,
    `id, hacker_id, full_name, email, phone, college, created_at`,
  ];

  let data: unknown = null;
  let error: { message?: string } | null = null;
  let count: number | null = null;

  for (const select of selectVariants) {
    const result = await applyFilters(
      supabase
        .from("participants")
        .select(select, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to),
    );

    if (!result.error) {
      data = result.data;
      count = result.count;
      error = null;
      break;
    }

    error = result.error;
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (error) {
    throw new AppError(
      500,
      `Failed to load participants: ${error.message}`,
      "PARTICIPANTS_LIST_FAILED",
    );
  }

  const total = count ?? 0;
  const items = await Promise.all(
    ((data ?? []) as ParticipantQueryRow[]).map((row) =>
      toAdminParticipant({
        ...row,
        department: row.department || "",
        year: row.year || "",
        status: row.status || "REGISTERED",
        updated_at: row.updated_at || row.created_at,
      }),
    ),
  );

  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}

export async function getParticipantByHackerId(
  hackerId: string,
): Promise<AdminParticipantDetail> {
  const normalized = hackerId.trim().toUpperCase();

  const selectVariants = [
    PARTICIPANT_SELECT_BASIC,
    PARTICIPANT_SELECT_MINIMAL,
    `id, hacker_id, full_name, email, phone, college, created_at`,
  ];

  let data: ParticipantQueryRow | null = null;
  let error: { message?: string } | null = null;

  for (const select of selectVariants) {
    const result = await supabase
      .from("participants")
      .select(select)
      .eq("hacker_id", normalized)
      .maybeSingle();

    if (!result.error) {
      data = result.data as ParticipantQueryRow | null;
      error = null;
      break;
    }
    error = result.error;
    if (!/column|schema cache/i.test(result.error.message ?? "")) {
      break;
    }
  }

  if (error) {
    throw new AppError(
      500,
      `Failed to load participant: ${error.message}`,
      "PARTICIPANT_GET_FAILED",
    );
  }

  if (!data) {
    throw new AppError(404, "Participant not found", "PARTICIPANT_NOT_FOUND");
  }

  return await toAdminParticipant({
    ...data,
    department: data.department || "",
    year: data.year || "",
    status: data.status || "REGISTERED",
    updated_at: data.updated_at || data.created_at,
  });
}

export async function updateParticipant(
  hackerId: string,
  input: UpdateParticipantInput,
  admin: AuditActor,
): Promise<AdminParticipantDetail> {
  const normalized = hackerId.trim().toUpperCase();
  const existing = await getParticipantByHackerId(normalized);

  const fullUpdate = {
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    college: input.college,
    department: input.department,
    year: input.year,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("participants")
    .update(fullUpdate)
    .eq("hacker_id", normalized);

  if (error && /column|schema cache/i.test(error.message ?? "")) {
    const partial = await supabase
      .from("participants")
      .update({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        college: input.college,
        updated_at: new Date().toISOString(),
      })
      .eq("hacker_id", normalized);
    error = partial.error;
  }

  if (error) {
    if (isUniqueViolation(error)) {
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("email")) {
        throw new AppError(409, "Email is already registered", "EMAIL_TAKEN");
      }
      if (msg.includes("phone")) {
        throw new AppError(
          409,
          "Mobile number is already registered",
          "PHONE_TAKEN",
        );
      }
    }
    throw new AppError(
      500,
      `Failed to update participant: ${error.message}`,
      "PARTICIPANT_UPDATE_FAILED",
    );
  }

  const updated = await getParticipantByHackerId(normalized);

  await writeAdminAuditLog({
    admin,
    action: "PARTICIPANT_UPDATE",
    targetType: "participant",
    targetId: existing.id,
    metadata: {
      hacker_id: normalized,
      before: {
        full_name: existing.full_name,
        email: existing.email,
        phone: existing.phone,
        college: existing.college,
        department: existing.department,
        year: existing.year,
      },
      after: {
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        college: updated.college,
        department: updated.department,
        year: updated.year,
      },
    },
  });

  return updated;
}

export async function setParticipantStatus(
  hackerId: string,
  status: ParticipantAdminStatus,
  admin: AuditActor,
): Promise<AdminParticipantDetail> {
  const normalized = hackerId.trim().toUpperCase();
  const existing = await getParticipantByHackerId(normalized);

  if (existing.status === status) {
    return existing;
  }

  const { error } = await supabase
    .from("participants")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("hacker_id", normalized);

  if (error) {
    throw new AppError(
      500,
      `Failed to update participant status: ${error.message}`,
      "PARTICIPANT_STATUS_FAILED",
    );
  }

  const updated = await getParticipantByHackerId(normalized);

  await writeAdminAuditLog({
    admin,
    action:
      status === "CANCELLED"
        ? "PARTICIPANT_DEACTIVATE"
        : "PARTICIPANT_REACTIVATE",
    targetType: "participant",
    targetId: existing.id,
    metadata: {
      hacker_id: normalized,
      previous_status: existing.status,
      new_status: status,
    },
  });

  return updated;
}
