import crypto from "node:crypto";

/** Keep in sync with hack/src/config/event.ts eventStart. */
export const PRE_EVENT_END_ISO = "2026-09-28T10:00:00+05:30";
export const HACKATHON_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ClockStatus = "AWAITING_START" | "LIVE" | "ENDED";

export type PublicClock = {
  status: ClockStatus;
  officialStartTime: string | null;
  officialEndTime: string | null;
  serverTime: string;
};

export function officialEndFromStart(start: Date): Date {
  return new Date(start.getTime() + HACKATHON_WINDOW_MS);
}

export function isBeforePreEventEnd(now: Date): boolean {
  return now.getTime() < new Date(PRE_EVENT_END_ISO).getTime();
}

/** Compare secrets without leaking the stored code through timing or errors. */
export function accessCodeMatches(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  const a = crypto.createHash("sha256").update(input, "utf8").digest();
  const b = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}
