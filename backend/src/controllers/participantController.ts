import type { Request, Response, NextFunction } from "express";
import * as participantService from "../services/participantService.js";
import { toCreatedParticipant, toPublicParticipant } from "../utils/mappers.js";
import { validateCreateParticipant } from "../utils/validation.js";

export async function createParticipant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateCreateParticipant(req.body);
    const participant = await participantService.createParticipant(input);

    res.status(201).json({
      success: true,
      data: toCreatedParticipant(participant),
    });
  } catch (err) {
    next(err);
  }
}

export async function getParticipantByHackerId(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const hackerId = String(req.params.hackerId ?? "").trim();
    if (!hackerId) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "hackerId is required",
      });
      return;
    }

    const participant =
      await participantService.getParticipantByHackerId(hackerId);

    res.json({
      success: true,
      data: toPublicParticipant(participant),
    });
  } catch (err) {
    next(err);
  }
}
