import type { Request, Response, NextFunction } from "express";
import * as teamService from "../services/teamService.js";
import {
  isValidTeamCode,
  normalizeTeamCode,
  validateCreateTeam,
  validateJoinTeam,
} from "../utils/validation.js";

export async function createTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateCreateTeam(req.body);
    const team = await teamService.createTeam(input);

    res.status(201).json({
      success: true,
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTeamByCode(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const code = normalizeTeamCode(String(req.params.code ?? ""));

    if (!isValidTeamCode(code)) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "team code must match ODYSSEY24-XXXX",
      });
      return;
    }

    const team = await teamService.getTeamByCode(code);

    res.json({
      success: true,
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function joinTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateJoinTeam(req.body);
    const team = await teamService.joinTeam(input);

    res.json({
      success: true,
      data: team,
    });
  } catch (err) {
    next(err);
  }
}
