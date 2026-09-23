import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

/** Hard cap on saved people (leaders and teammates). */
export const MAX_PARTICIPANTS = 210;
const MIN_TEAM_SIZE = 3;
const TEAM_SIZES = [3, 4] as const;

export type RegistrationCapacity = {
  max: number;
  count: number;
  remaining: number;
  open: boolean;
  allowed_team_sizes: number[];
};

export function capacityFromCount(count: number): RegistrationCapacity {
  const safeCount = Math.max(0, Math.floor(count));
  const remaining = Math.max(0, MAX_PARTICIPANTS - safeCount);
  const allowed_team_sizes = TEAM_SIZES.filter((size) => size <= remaining);
  return {
    max: MAX_PARTICIPANTS,
    count: safeCount,
    remaining,
    open: allowed_team_sizes.length > 0 && remaining >= MIN_TEAM_SIZE,
    allowed_team_sizes: [...allowed_team_sizes],
  };
}

export async function countParticipants(): Promise<number> {
  const { count, error } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new AppError(
      500,
      `Failed to count participants: ${error.message}`,
      "CAPACITY_CHECK_FAILED",
    );
  }

  return count ?? 0;
}

export async function getRegistrationCapacity(): Promise<RegistrationCapacity> {
  return capacityFromCount(await countParticipants());
}

/** Refuse a team that would push the saved headcount past 210. */
export async function assertTeamFits(teamSize: number): Promise<RegistrationCapacity> {
  const capacity = await getRegistrationCapacity();
  if (!capacity.open) {
    throw new AppError(
      403,
      "Registrations are closed. Wait for AI Odyssey 2.0.",
      "REGISTRATION_CLOSED",
    );
  }
  if (!capacity.allowed_team_sizes.includes(teamSize)) {
    throw new AppError(
      403,
      `Only ${capacity.remaining} seats are left. A team of ${teamSize} does not fit.`,
      "TEAM_EXCEEDS_CAPACITY",
    );
  }
  return capacity;
}
