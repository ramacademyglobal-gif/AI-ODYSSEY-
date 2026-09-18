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
  const paymentFields =
    input.payment_txn_id && input.payment_drive_file_url
      ? {
          payment_txn_id: input.payment_txn_id,
          payment_drive_file_id: input.payment_drive_file_id ?? null,
          payment_drive_file_url: input.payment_drive_file_url,
          payment_verified_at:
            input.payment_verified_at ?? new Date().toISOString(),
        }
      : null;

  const attempts: Record<string, unknown>[] = [
    {
      hacker_id,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      college: input.college,
      department: input.department,
      year: input.year,
      qr_token,
      status: "REGISTERED",
      ...(paymentFields ?? {}),
    },
    {
      hacker_id,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      college: input.college,
      department: input.department,
      year: input.year,
      qr_token,
      status: "REGISTERED",
    },
    {
      hacker_id,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      college: input.college,
      department: input.department,
      year: input.year,
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
      const patch: Record<string, unknown> = {};
      if (!result.data.qr_token) patch.qr_token = qr_token;
      if (!result.data.department) patch.department = input.department;
      if (!result.data.year) patch.year = input.year;
      if (paymentFields && !result.data.payment_txn_id) {
        Object.assign(patch, paymentFields);
      }
      if (Object.keys(patch).length > 0) {
        const { data: updated, error: patchError } = await supabase
          .from("participants")
          .update(patch)
          .eq("id", result.data.id)
          .select("*")
          .maybeSingle();
        if (
          patchError &&
          paymentFields &&
          (missingColumn(patchError.message, "payment_txn_id") ||
            missingColumn(patchError.message, "payment_drive_file_url") ||
            /schema cache/i.test(patchError.message))
        ) {
          throw new AppError(
            500,
            "Payment columns missing. Run database/migrations/add_payment_proof_columns.sql in Supabase SQL editor.",
            "PAYMENT_COLUMNS_MISSING",
          );
        }
        if (updated) {
          return { data: updated as ParticipantRow, error: null };
        }
      }
      return result;
    }

    lastError = result.error;
    if (isUniqueViolation(result.error)) {
      return result;
    }
    if (
      !missingColumn(result.error?.message, "qr_token") &&
      !missingColumn(result.error?.message, "department") &&
      !missingColumn(result.error?.message, "year") &&
      !missingColumn(result.error?.message, "status") &&
      !missingColumn(result.error?.message, "payment_txn_id") &&
      !missingColumn(result.error?.message, "payment_drive_file_id") &&
      !missingColumn(result.error?.message, "payment_drive_file_url") &&
      !missingColumn(result.error?.message, "payment_verified_at") &&
      !/schema cache/i.test(result.error?.message ?? "")
    ) {
      return result;
    }
  }

  return { data: null, error: lastError };
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

    const { data, error } = await insertParticipantCompatible(
      input,
      hacker_id,
      qr_token,
    );

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
