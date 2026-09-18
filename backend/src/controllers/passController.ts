import type { Request, Response, NextFunction } from "express";
import * as passService from "../services/passService.js";
import * as adminCheckinService from "../services/adminCheckinService.js";

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

/** Confirm check-in for the scanned pass (QR possession is the gate credential). */
export async function createGateCheckin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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
