import { randomBytes, randomUUID } from "node:crypto";
import type { TeamSize } from "../types/index.js";

const TEAM_CODE_PATTERN = /^ODYSSEY24-[A-Z0-9]{4}$/;
const HACKER_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly details: string[];

  constructor(details: string[]) {
    super(details[0] ?? "Validation failed");
    this.name = "ValidationError";
    this.details = details;
  }
}

export function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isTeamSize(value: number): value is TeamSize {  return value === 3 || value === 4;
}

export function normalizeTeamCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidTeamCode(value: string): boolean {
  return TEAM_CODE_PATTERN.test(normalizeTeamCode(value));
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Non-PII secure random token for QR (UUID v4). */
export function generateQrToken(): string {
  return randomUUID();
}

export function generateHackerId(): string {
  let segment = "";
  const bytes = randomBytes(4);
  for (let i = 0; i < 4; i++) {
    segment += HACKER_ID_CHARS[bytes[i]! % HACKER_ID_CHARS.length];
  }
  return `ODYSSEY-H-${segment}`;
}

export function generateTeamCode(): string {
  let segment = "";
  const bytes = randomBytes(4);
  for (let i = 0; i < 4; i++) {
    segment += HACKER_ID_CHARS[bytes[i]! % HACKER_ID_CHARS.length];
  }
  return `ODYSSEY24-${segment}`;
}

export function validateCreateParticipant(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const data = body as Record<string, unknown>;
  const full_name = asTrimmedString(data.full_name);
  const email = asTrimmedString(data.email).toLowerCase();
  const phone = asTrimmedString(data.phone).replace(/\s+/g, "");
  const college = asTrimmedString(data.college);
  const department = asTrimmedString(data.department);
  const year = asTrimmedString(data.year);

  const errors: string[] = [];

  if (!full_name || full_name.length > 150) {
    errors.push("full_name is required (max 150 characters)");
  }
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 255) {
    errors.push("email must be a valid email address");
  }
  if (!phone || phone.length < 10 || phone.length > 20) {
    errors.push("phone is required (10–20 characters)");
  } else if (!/^\+?[0-9]+$/.test(phone)) {
    errors.push("phone must contain digits only (optional leading +)");
  }
  if (!college || college.length > 255) {
    errors.push("college is required (max 255 characters)");
  }
  if (!department || department.length > 150) {
    errors.push("department is required (max 150 characters)");
  }
  if (!year || year.length > 30) {
    errors.push("year is required (max 30 characters)");
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    full_name,
    email,
    phone,
    college,
    department,
    year,
  };
}

export function validateCreateTeam(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const data = body as Record<string, unknown>;
  const team_name = asTrimmedString(data.team_name);
  const leader_participant_id = asTrimmedString(
    data.leader_participant_id ?? data.leaderParticipantId,
  );
  const rawSize = data.team_size ?? data.teamSize;
  const team_size =
    typeof rawSize === "number"
      ? rawSize
      : typeof rawSize === "string"
        ? Number(rawSize)
        : NaN;

  const errors: string[] = [];

  if (!team_name || team_name.length > 150) {
    errors.push("team_name is required (max 150 characters)");
  }
  if (!isTeamSize(team_size)) {
    errors.push("team_size must be exactly 3 or 4");
  }
  if (!leader_participant_id || !isUuid(leader_participant_id)) {
    errors.push("leader_participant_id must be a valid UUID");
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    team_name,
    team_size: team_size as TeamSize,
    leader_participant_id,
  };
}

export function validateJoinTeam(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const data = body as Record<string, unknown>;
  const team_code = normalizeTeamCode(
    asTrimmedString(data.team_code ?? data.teamCode),
  );
  const participant_id = asTrimmedString(
    data.participant_id ?? data.participantId,
  );

  const errors: string[] = [];

  if (!isValidTeamCode(team_code)) {
    errors.push("team_code must match ODYSSEY24-XXXX");
  }
  if (!participant_id || !isUuid(participant_id)) {
    errors.push("participant_id must be a valid UUID");
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return { team_code, participant_id };
}

const PARTICIPANT_ADMIN_STATUSES = ["REGISTERED", "CANCELLED"] as const;

export function validateAdminUpdateParticipant(body: unknown) {
  return validateCreateParticipant(body);
}

export function validateAdminCheckin(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const data = body as Record<string, unknown>;
  const qr_token = asTrimmedString(data.qr_token ?? data.token);

  if (!qr_token) {
    throw new ValidationError(["qr_token is required"]);
  }

  return { qr_token };
}

export function validateAdminParticipantStatus(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const status = asTrimmedString(
    (body as Record<string, unknown>).status,
  ).toUpperCase();

  if (
    !(PARTICIPANT_ADMIN_STATUSES as readonly string[]).includes(status)
  ) {
    throw new ValidationError([
      `status must be one of: ${PARTICIPANT_ADMIN_STATUSES.join(", ")}`,
    ]);
  }

  return {
    status: status as (typeof PARTICIPANT_ADMIN_STATUSES)[number],
  };
}

export function parseParticipantListQuery(query: RequestQueryLike) {
  const pageRaw = firstQueryValue(query.page);
  const pageSizeRaw = firstQueryValue(query.pageSize ?? query.limit);
  const search = asTrimmedString(firstQueryValue(query.search ?? query.q));
  const status = asTrimmedString(firstQueryValue(query.status)).toUpperCase();
  const year = asTrimmedString(firstQueryValue(query.year));

  const page = pageRaw ? Number(pageRaw) : 1;
  const pageSize = pageSizeRaw ? Number(pageSizeRaw) : 20;

  if (!Number.isFinite(page) || page < 1) {
    throw new ValidationError(["page must be a positive integer"]);
  }
  if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new ValidationError(["pageSize must be between 1 and 50"]);
  }
  if (
    status &&
    !(PARTICIPANT_ADMIN_STATUSES as readonly string[]).includes(status)
  ) {
    throw new ValidationError([
      `status must be one of: ${PARTICIPANT_ADMIN_STATUSES.join(", ")}`,
    ]);
  }

  return {
    page: Math.floor(page),
    pageSize: Math.floor(pageSize),
    search: search || undefined,
    status: status || undefined,
    year: year || undefined,
  };
}

type RequestQueryLike = Record<string, unknown>;

function firstQueryValue(value: unknown): string {
  if (Array.isArray(value)) {
    return asTrimmedString(value[0]);
  }
  return asTrimmedString(value);
}
