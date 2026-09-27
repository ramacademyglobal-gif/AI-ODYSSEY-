import { describe, expect, it } from "vitest";
import {
  HACKATHON_WINDOW_MS,
  accessCodeMatches,
  isBeforePreEventEnd,
  officialEndFromStart,
} from "./hackathonClock.js";

describe("hackathon clock", () => {
  it("ends exactly 24 hours after the official start", () => {
    const start = new Date("2026-09-28T10:47:23+05:30");
    const end = officialEndFromStart(start);
    expect(end.getTime() - start.getTime()).toBe(HACKATHON_WINDOW_MS);
    expect(end.toISOString()).toBe(new Date("2026-09-29T10:47:23+05:30").toISOString());
  });

  it("accepts only the exact jury code", () => {
    expect(accessCodeMatches("ODYSSEY-START", "ODYSSEY-START")).toBe(true);
    expect(accessCodeMatches("odyssey-start", "ODYSSEY-START")).toBe(false);
    expect(accessCodeMatches("", "ODYSSEY-START")).toBe(false);
    expect(accessCodeMatches("ODYSSEY-START", "")).toBe(false);
  });

  it("keeps the launch locked until the pre-event instant", () => {
    expect(isBeforePreEventEnd(new Date("2026-09-28T09:59:59+05:30"))).toBe(true);
    expect(isBeforePreEventEnd(new Date("2026-09-28T10:00:00+05:30"))).toBe(false);
  });
});
