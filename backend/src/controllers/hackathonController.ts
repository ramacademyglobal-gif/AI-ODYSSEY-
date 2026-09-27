import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler.js";
import * as hackathonClockService from "../services/hackathonClockService.js";

function bearerToken(header: string | undefined): string {
  if (!header) return "";
  const [scheme, token] = header.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return "";
  return token.trim();
}

export async function getHackathonState(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clock = await hackathonClockService.getOfficialClock();
    res.json({ success: true, data: clock });
  } catch (err) {
    next(err);
  }
}

export async function authorizeHackathon(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!code || code.length > 64) {
      throw new AppError(401, "Access denied", "ACCESS_DENIED");
    }

    const data = hackathonClockService.authorizeJuryCode(code);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function startHackathon(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      throw new AppError(401, "Access denied", "ACCESS_DENIED");
    }

    const result = await hackathonClockService.startOfficialClock(token);
    if (result.outcome === "already") {
      res.status(409).json({
        success: false,
        error: "ALREADY_STARTED",
        message: "The official window has already started",
        data: result.clock,
      });
      return;
    }

    res.json({ success: true, data: result.clock });
  } catch (err) {
    next(err);
  }
}
