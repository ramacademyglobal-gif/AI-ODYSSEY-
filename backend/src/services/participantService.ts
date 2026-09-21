import { randomBytes } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import type { CreateParticipantInput, ParticipantRow } from "../types/index.js";
import { generateHackerId, generateQrToken } from "../utils/validation.js";

const MAX_ID_ATTEMPTS = 8;

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

function uniqueConflictField(
  error: { message?: string } | null,
): "email" | "phone" | "payment_txn" | "hacker_id" | "qr_token" | "other" {
  const msg = (error?.message ?? "").toLowerCase();
  if (msg.includes("payment_txn")) return "payment_txn";
  if (msg.includes("email")) return "email";
  if (msg.includes("phone")) return "phone";
  if (msg.includes("hacker_id")) return "hacker_id";
  if (msg.includes("qr_token")) return "qr_token";
  return "other";
}

async function assertNoDuplicateParticipantFields(input: {
  email: string;
  phone: string;
  payment_txn_id?: string;
}): Promise<void> {
  const { data: byEmail, error: emailError } = await supabase
    .from("participants")
    .select("id")
    .eq("email", input.email)
    .maybeSingle();

  if (emailError) {
    throw new AppError(
      500,
      `Failed to verify email uniqueness: ${emailError.message}`,
      "PARTICIPANT_LOOKUP_FAILED",
    );
  }
  if (byEmail) {
    throw new AppError(409, "Email is already registered", "EMAIL_TAKEN");
  }

  const { data: byPhone, error: phoneError } = await supabase
    .from("participants")
    .select("id")
    .eq("phone", input.phone)
    .maybeSingle();

  if (phoneError) {
    throw new AppError(
      500,
      `Failed to verify phone uniqueness: ${phoneError.message}`,
      "PARTICIPANT_LOOKUP_FAILED",
    );
  }
  if (byPhone) {
    throw new AppError(
      409,
      "Mobile number is already registered",
      "PHONE_TAKEN",
    );
  }

  const txn = input.payment_txn_id?.trim();
  if (!txn) return;

  const { data: byTxn, error: txnError } = await supabase
    .from("participants")
    .select("id")
    .eq("payment_txn_id", txn)
    .maybeSingle();

  if (txnError) {
    // Column may be missing on older DBs; insert path will surface that clearly.
    if (!/payment_txn|schema cache|column/i.test(txnError.message)) {
      throw new AppError(
        500,
        `Failed to verify transaction uniqueness: ${txnError.message}`,
        "PARTICIPANT_LOOKUP_FAILED",
      );
    }
    return;
  }
  if (byTxn) {
    throw new AppError(
      409,
      "This transaction ID was already used for another registration",
      "PAYMENT_TXN_TAKEN",
    );
  }
}

/** Public pre-check: email / phone / optional txn — before payment upload. */
export async function checkRegistrationAvailability(input: {
  email: string;
  phone: string;
  payment_txn_id?: string;
}): Promise<{ available: true }> {
  await assertNoDuplicateParticipantFields({
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim().replace(/\s+/g, ""),
    payment_txn_id: input.payment_txn_id?.trim(),
  });
  return { available: true };
}

function missingColumn(message: string | undefined, column: string): boolean {
  return new RegExp(`'${column}' column|column .*${column}`, "i").test(
    message ?? "",
  );
}

async function insertParticipant(
  payload: Record<string, unknown>,
): Promise<{ data: ParticipantRow | null; error: { code?: string; message?: string } | null }> {
  const { data, error } = await supabase
    .from("participants")
    .insert(payload)
    .select("*")
    .single();

  return {
    data: (data as ParticipantRow | null) ?? null,
    error,
  };
}

async function insertParticipantCompatible(
  input: CreateParticipantInput,
  hacker_id: string,
  qr_token: string,
): Promise<{ data: ParticipantRow | null; error: { code?: string; message?: string } | null }> {
  const requiresPayment = Boolean(
    input.payment_txn_id?.trim() && input.payment_drive_file_url?.trim(),
  );

  const paymentFields = requiresPayment
    ? {
        payment_txn_id: input.payment_txn_id!.trim(),
        payment_drive_file_id: input.payment_drive_file_id ?? null,
        payment_drive_file_url: input.payment_drive_file_url!,
        payment_verified_at:
          input.payment_verified_at ?? new Date().toISOString(),
      }
    : null;

  const roll = input.roll_number?.trim();

  const baseFields = {
    hacker_id,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    college: input.college,
    department: input.department,
    year: input.year,
  };

  // When payment is required, NEVER insert a participant without payment fields.
  // Old fallbacks created orphan rows in Supabase while the UI showed an error.
  const attempts: Record<string, unknown>[] = requiresPayment
    ? [
        {
          ...baseFields,
          qr_token,
          status: "REGISTERED",
          ...(roll ? { roll_number: roll } : {}),
          ...paymentFields!,
        },
        {
          ...baseFields,
          qr_token,
          status: "REGISTERED",
          ...paymentFields!,
        },
        {
          ...baseFields,
          qr_token,
          status: "REGISTERED",
          department: roll
            ? `${input.department} · Roll ${roll}`.slice(0, 150)
            : input.department,
          ...paymentFields!,
        },
      ]
    : [
        {
          ...baseFields,
          qr_token,
          status: "REGISTERED",
          ...(roll ? { roll_number: roll } : {}),
        },
        {
          ...baseFields,
          qr_token,
          status: "REGISTERED",
        },
        {
          ...baseFields,
          qr_token,
          status: "REGISTERED",
          department: roll
            ? `${input.department} · Roll ${roll}`.slice(0, 150)
            : input.department,
        },
        {
          ...baseFields,
          status: "REGISTERED",
        },
        {
          hacker_id,
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          college: input.college,
          status: "REGISTERED",
        },
        {
          hacker_id,
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          college: input.college,
        },
      ];

  let lastError: { code?: string; message?: string } | null = null;

  for (const payload of attempts) {
    const result = await insertParticipant(payload);
    if (!result.error && result.data) {
      return result;
    }

    lastError = result.error;
    const msg = result.error?.message ?? "";

    if (/value too long for type character varying/i.test(msg)) {
      throw new AppError(
        500,
        "Database column is too short for the transaction ID. In Supabase SQL Editor run: backend/database/migrations/fix_payment_txn_column_width.sql",
        "PAYMENT_TXN_COLUMN_TOO_SHORT",
      );
    }

    if (isUniqueViolation(result.error)) {
      return result;
    }

    if (requiresPayment) {
      // Do not silently skip payment columns — surface schema issues clearly.
      if (
        missingColumn(msg, "payment_txn_id") ||
        missingColumn(msg, "payment_drive_file_id") ||
        missingColumn(msg, "payment_drive_file_url") ||
        missingColumn(msg, "payment_verified_at") ||
        /schema cache/i.test(msg)
      ) {
        throw new AppError(
          500,
          "Payment columns missing or outdated. Run database/migrations/fix_payment_txn_column_width.sql in Supabase SQL editor.",
          "PAYMENT_COLUMNS_MISSING",
        );
      }
      // Try next payment-compatible payload (e.g. without roll_number)
      if (
        missingColumn(msg, "roll_number") ||
        missingColumn(msg, "qr_token") ||
        missingColumn(msg, "department") ||
        missingColumn(msg, "year") ||
        missingColumn(msg, "status")
      ) {
        continue;
      }
      return result;
    }

    if (
      !missingColumn(msg, "qr_token") &&
      !missingColumn(msg, "department") &&
      !missingColumn(msg, "year") &&
      !missingColumn(msg, "status") &&
      !missingColumn(msg, "roll_number") &&
      !/schema cache/i.test(msg)
    ) {
      return result;
    }
  }

  return { data: null, error: lastError };
}

function syntheticMemberContact(seed: string): { email: string; phone: string } {
  const clean =
    seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toLowerCase() || "member";
  const suffix = randomBytes(4).toString("hex");
  const email = `${clean}.${suffix}@members.odyssey24.local`;
  const digits = randomBytes(8);
  let phone = "9";
  for (let i = 0; i < 9; i++) {
    phone += String(digits[i]! % 10);
  }
  return { email, phone };
}

/** Create a teammate without contact details (synthetic unique email/phone). */
export async function createTeamMateParticipant(input: {
  full_name: string;
  college: string;
  department: string;
  year: string;
  roll_number: string;
}): Promise<ParticipantRow> {
  const contact = syntheticMemberContact(
    `${input.roll_number}-${input.full_name}`,
  );

  return createParticipant({
    full_name: input.full_name,
    email: contact.email,
    phone: contact.phone,
    college: input.college,
    department: input.department,
    year: input.year,
    roll_number: input.roll_number,
  });
}

export async function createParticipant(
  input: CreateParticipantInput,
): Promise<ParticipantRow> {
  await assertNoDuplicateParticipantFields({
    email: input.email,
    phone: input.phone,
    payment_txn_id: input.payment_txn_id,
  });

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const hacker_id = generateHackerId();
    const qr_token = generateQrToken();

    let data: ParticipantRow | null = null;
    let error: { code?: string; message?: string } | null = null;
    try {
      const result = await insertParticipantCompatible(
        input,
        hacker_id,
        qr_token,
      );
      data = result.data;
      error = result.error;
    } catch (err) {
      // Preserve typed schema errors (column too short / missing payment columns)
      if (err instanceof AppError) throw err;
      throw err;
    }

    if (!error && data) {
      return {
        ...data,
        qr_token: data.qr_token || qr_token,
        department: data.department || input.department,
        year: data.year || input.year,
        status: data.status || "REGISTERED",
      } as ParticipantRow;
    }

    if (isUniqueViolation(error)) {
      const field = uniqueConflictField(error);
      if (field === "email") {
        throw new AppError(409, "Email is already registered", "EMAIL_TAKEN");
      }
      if (field === "phone") {
        throw new AppError(
          409,
          "Mobile number is already registered",
          "PHONE_TAKEN",
        );
      }
      if (field === "payment_txn") {
        throw new AppError(
          409,
          "This transaction ID was already used for another registration",
          "PAYMENT_TXN_TAKEN",
        );
      }
      if (field === "hacker_id" || field === "qr_token") {
        continue;
      }
      throw new AppError(
        409,
        `Participant already exists: ${error?.message ?? "conflict"}`,
        "CONFLICT",
      );
    }

    throw new AppError(
      500,
      `Failed to create participant: ${error?.message ?? "unknown error"}`,
      "PARTICIPANT_CREATE_FAILED",
    );
  }

  throw new AppError(
    500,
    "Could not allocate a unique hacker ID",
    "HACKER_ID_ALLOCATION_FAILED",
  );
}

export async function getParticipantByHackerId(
  hackerId: string,
): Promise<ParticipantRow> {
  const normalized = hackerId.trim().toUpperCase();

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("hacker_id", normalized)
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      `Failed to fetch participant: ${error.message}`,
      "PARTICIPANT_FETCH_FAILED",
    );
  }

  if (!data) {
    throw new AppError(404, "Participant not found", "PARTICIPANT_NOT_FOUND");
  }

  return data as ParticipantRow;
}

/** Remove a participant row (and membership). Used for failed-registration rollback. */
export async function deleteParticipantById(participantId: string): Promise<void> {
  await supabase.from("team_members").delete().eq("participant_id", participantId);
  await supabase.from("checkins").delete().eq("participant_id", participantId);
  await supabase.from("participants").delete().eq("id", participantId);
}

/** Delete team(s) led by this participant, then the participant. */
export async function rollbackLeaderRegistration(
  leaderParticipantId: string,
): Promise<void> {
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("leader_participant_id", leaderParticipantId);

  for (const team of teams ?? []) {
    await supabase.from("team_members").delete().eq("team_id", team.id);
    await supabase.from("teams").delete().eq("id", team.id);
  }

  await deleteParticipantById(leaderParticipantId);
}
