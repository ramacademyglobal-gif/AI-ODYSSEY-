import type { Request, Response, NextFunction } from "express";
import * as participantService from "../services/participantService.js";
import { toCreatedParticipant, toPublicParticipant } from "../utils/mappers.js";
import {
  asTrimmedString,
  validateCreateParticipant,
  ValidationError,
} from "../utils/validation.js";

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

/** Pre-check leader email/phone (and optional txn) before payment upload. */
export async function checkAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = asTrimmedString(req.body?.email ?? req.query?.email).toLowerCase();
    const phone = asTrimmedString(req.body?.phone ?? req.query?.phone).replace(
      /\s+/g,
      "",
    );
    const payment_txn_id = asTrimmedString(
      req.body?.payment_txn_id ??
        req.body?.transaction_id ??
        req.query?.payment_txn_id ??
        req.query?.transaction_id,
    );

    const errors: string[] = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Valid email is required");
    }
    if (!phone || phone.length < 10 || phone.length > 20) {
      errors.push("Valid phone is required (10–20 digits)");
    } else if (!/^\+?[0-9]+$/.test(phone)) {
      errors.push("phone must contain digits only (optional leading +)");
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    await participantService.checkRegistrationAvailability({
      email,
      phone,
      ...(payment_txn_id ? { payment_txn_id } : {}),
    });

    res.json({
      success: true,
      data: {
        available: true,
        email,
        phone,
        ...(payment_txn_id ? { payment_txn_id } : {}),
      },
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
