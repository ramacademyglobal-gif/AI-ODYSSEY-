import { EVENT_CONFIG } from "@/config/event";

const API_BASE = (
  process.env.NEXT_PUBLIC_REGISTRATION_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

export type ClockStatus = "AWAITING_START" | "LIVE" | "ENDED";

export type OfficialClock = {
  status: ClockStatus;
  officialStartTime: string | null;
  officialEndTime: string | null;
  serverTime: string;
};

export type ViewPhase = "syncing" | "pre" | "awaiting" | "live" | "ended";

export class ClockRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly clock?: OfficialClock;

  constructor(status: number, code: string, message: string, clock?: OfficialClock) {
    super(message);
    this.status = status;
    this.code = code;
    this.clock = clock;
  }
}

type ClockResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: OfficialClock & { launchToken?: string };
};

async function readBody(response: Response): Promise<ClockResponse> {
  try {
    return (await response.json()) as ClockResponse;
  } catch {
    return {};
  }
}

export async function fetchOfficialClock(): Promise<OfficialClock> {
  const response = await fetch(`${API_BASE}/hackathon/state`, { cache: "no-store" });
  const body = await readBody(response);
  if (!response.ok || !body.data?.serverTime || !body.data.status) {
    throw new ClockRequestError(response.status, body.error || "CLOCK_UNAVAILABLE", "Unable to sync");
  }
  return {
    status: body.data.status,
    officialStartTime: body.data.officialStartTime ?? null,
    officialEndTime: body.data.officialEndTime ?? null,
    serverTime: body.data.serverTime,
  };
}

export async function authorizeJury(code: string): Promise<string> {
  const response = await fetch(`${API_BASE}/hackathon/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const body = await readBody(response);
  if (!response.ok || !body.data?.launchToken) {
    throw new ClockRequestError(response.status, body.error || "ACCESS_DENIED", "Access denied");
  }
  return body.data.launchToken;
}

export async function startOfficialWindow(launchToken: string): Promise<{
  clock: OfficialClock;
  alreadyStarted: boolean;
}> {
  const response = await fetch(`${API_BASE}/hackathon/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${launchToken}` },
  });
  const body = await readBody(response);
  const clock = body.data;
  if (clock?.serverTime && clock.status) {
    const official: OfficialClock = {
      status: clock.status,
      officialStartTime: clock.officialStartTime ?? null,
      officialEndTime: clock.officialEndTime ?? null,
      serverTime: clock.serverTime,
    };
    if (response.status === 409) {
      return { clock: official, alreadyStarted: true };
    }
    if (response.ok) {
      return { clock: official, alreadyStarted: false };
    }
  }
  throw new ClockRequestError(response.status, body.error || "START_FAILED", "Unable to start");
}

export function viewPhase(input: {
  clock: OfficialClock | null;
  officialNow: number;
}): ViewPhase {
  const { clock, officialNow } = input;
  const preEventEnd = EVENT_CONFIG.eventStart ? new Date(EVENT_CONFIG.eventStart).getTime() : 0;

  if (clock?.status === "ENDED") return "ended";
  if (clock?.status === "LIVE") {
    if (!clock.officialStartTime || !clock.officialEndTime) return "syncing";
    if (officialNow >= new Date(clock.officialEndTime).getTime()) return "ended";
    return "live";
  }
  if (preEventEnd && officialNow < preEventEnd) return "pre";
  if (!clock) return "syncing";
  return "awaiting";
}
