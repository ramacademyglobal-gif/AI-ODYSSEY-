import type { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler.js";
import * as passService from "../services/passService.js";
import * as adminCheckinService from "../services/adminCheckinService.js";

function assertGateCheckinCode(body: unknown): void {
  const expected = process.env.GATE_CHECKIN_CODE?.trim();
  if (!expected) {
    throw new AppError(
      503,
      "Gate check-in is locked until GATE_CHECKIN_CODE is set on the server.",
      "GATE_CODE_MISSING",
    );
  }

  const provided =
    body &&
    typeof body === "object" &&
    "gate_code" in body &&
    typeof (body as { gate_code?: unknown }).gate_code === "string"
      ? (body as { gate_code: string }).gate_code.trim()
      : "";

  if (!provided || provided.toUpperCase() !== expected.toUpperCase()) {
    throw new AppError(
      403,
      "Invalid organizer passcode. Check-in was blocked.",
      "GATE_CODE_INVALID",
    );
  }
}

export async function getPassByQrToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const qrToken = String(req.params.qrToken ?? "").trim();
    const pass = await passService.getPassByQrToken(qrToken);
    res.json({
      success: true,
      data: pass,
    });
  } catch (err) {
    next(err);
  }
}

/** Gate scan preview — team + check-in status for each teammate. */
export async function scanGateCheckin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const qrToken = String(req.params.qrToken ?? "").trim();
    const result = await adminCheckinService.scanByQrToken(qrToken);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/** Confirm check-in — requires organizer gate passcode (GATE_CHECKIN_CODE). */
export async function createGateCheckin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertGateCheckinCode(req.body);
    const qrToken = String(req.params.qrToken ?? "").trim();
    const result = await adminCheckinService.checkInByQrToken(qrToken, null);
    res.status(result.already_checked_in ? 200 : 201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
