import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  type ClockStatus,
  type PublicClock,
  accessCodeMatches,
  isBeforePreEventEnd,
  officialEndFromStart,
} from "./hackathonClock.js";

type ClockRow = {
  id: number;
  status: ClockStatus;
  official_start_time: string | null;
  official_end_time: string | null;
};

type LaunchToken = {
  purpose: "hackathon-start";
};

const LAUNCH_TOKEN_TTL = "10m";

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new AppError(503, "Official start is not configured", "START_UNAVAILABLE");
  }
  return secret;
}

function juryCode(): string {
  const code = process.env.JURY_ACCESS_CODE?.trim();
  if (!code) {
    throw new AppError(503, "Official start is not configured", "START_UNAVAILABLE");
  }
  return code;
}

function toPublic(row: ClockRow, serverTime = new Date()): PublicClock {
  let status = row.status;
  if (
    status === "LIVE" &&
    row.official_end_time &&
    serverTime.getTime() >= new Date(row.official_end_time).getTime()
  ) {
    status = "ENDED";
  }

  return {
    status,
    officialStartTime: row.official_start_time,
    officialEndTime: row.official_end_time,
    serverTime: serverTime.toISOString(),
  };
}

async function readRow(): Promise<ClockRow | null> {
  const { data, error } = await supabase
    .from("hackathon_clock")
    .select("id, status, official_start_time, official_end_time")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Hackathon clock read failed:", error.message);
    throw new AppError(503, "Official clock is not ready", "CLOCK_UNAVAILABLE");
  }

  return (data as ClockRow | null) ?? null;
}

async function markEndedIfDue(row: ClockRow, serverTime: Date): Promise<void> {
  if (row.status !== "LIVE" || !row.official_end_time) return;
  if (serverTime.getTime() < new Date(row.official_end_time).getTime()) return;

  const { error } = await supabase
    .from("hackathon_clock")
    .update({ status: "ENDED" })
    .eq("id", 1)
    .eq("status", "LIVE");

  if (error) {
    console.error("Hackathon clock end update failed:", error.message);
  }
}

export async function getOfficialClock(): Promise<PublicClock> {
  const serverTime = new Date();
  const row = await readRow();
  if (!row) {
    throw new AppError(503, "Official clock is not ready", "CLOCK_UNAVAILABLE");
  }

  void markEndedIfDue(row, serverTime);
  return toPublic(row, serverTime);
}

export function authorizeJuryCode(code: string): { launchToken: string } {
  const expected = juryCode();
  if (!accessCodeMatches(code, expected)) {
    throw new AppError(401, "Access denied", "ACCESS_DENIED");
  }

  const launchToken = jwt.sign({ purpose: "hackathon-start" } satisfies LaunchToken, jwtSecret(), {
    expiresIn: LAUNCH_TOKEN_TTL,
  });

  return { launchToken };
}

export function assertLaunchToken(token: string): void {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, jwtSecret());
  } catch {
    throw new AppError(401, "Access denied", "ACCESS_DENIED");
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    (decoded as LaunchToken).purpose !== "hackathon-start"
  ) {
    throw new AppError(401, "Access denied", "ACCESS_DENIED");
  }
}

export type StartOutcome =
  | { outcome: "started"; clock: PublicClock }
  | { outcome: "already"; clock: PublicClock };

export async function startOfficialClock(token: string): Promise<StartOutcome> {
  assertLaunchToken(token);

  const serverTime = new Date();
  if (isBeforePreEventEnd(serverTime)) {
    throw new AppError(403, "The official window is not open yet", "NOT_OPEN");
  }

  const existing = await readRow();
  if (!existing) {
    throw new AppError(503, "Official clock is not ready", "CLOCK_UNAVAILABLE");
  }

  if (existing.status === "LIVE" || existing.status === "ENDED") {
    void markEndedIfDue(existing, serverTime);
    return { outcome: "already", clock: toPublic(existing, serverTime) };
  }

  const officialEnd = officialEndFromStart(serverTime);
  const { data, error } = await supabase
    .from("hackathon_clock")
    .update({
      status: "LIVE",
      official_start_time: serverTime.toISOString(),
      official_end_time: officialEnd.toISOString(),
    })
    .eq("id", 1)
    .eq("status", "AWAITING_START")
    .select("id, status, official_start_time, official_end_time")
    .maybeSingle();

  if (error) {
    console.error("Hackathon clock start failed:", error.message);
    throw new AppError(503, "Unable to start", "START_FAILED");
  }

  if (!data) {
    const latest = await readRow();
    if (latest && (latest.status === "LIVE" || latest.status === "ENDED")) {
      return { outcome: "already", clock: toPublic(latest, new Date()) };
    }
    throw new AppError(409, "Unable to start", "START_REJECTED");
  }

  return { outcome: "started", clock: toPublic(data as ClockRow, serverTime) };
}
