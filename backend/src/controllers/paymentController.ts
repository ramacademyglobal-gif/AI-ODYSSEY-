import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../middleware/errorHandler.js";
import * as participantService from "../services/participantService.js";
import * as teamService from "../services/teamService.js";
import { uploadPaymentScreenshot } from "../services/paymentStorageService.js";
import { toCreatedParticipant } from "../utils/mappers.js";
import { validateCreateParticipant } from "../utils/validation.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
      file.mimetype,
    );
    if (!ok) {
      cb(new Error("Payment screenshot must be JPG, PNG, or WEBP"));
      return;
    }
    cb(null, true);
  },
});

export function paymentProofUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single("screenshot")(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof Error ? err.message : "Invalid payment screenshot upload";
      next(new AppError(400, message, "VALIDATION_ERROR"));
      return;
    }
    next();
  });
}

function validateTransactionId(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (value.length < 10 || value.length > 64) {
    throw new AppError(
      400,
      "Transaction ID must be 10–64 characters",
      "VALIDATION_ERROR",
    );
  }
  if (!/[A-Za-z0-9]/.test(value)) {
    throw new AppError(
      400,
      "Enter a valid transaction ID (letters and numbers)",
      "VALIDATION_ERROR",
    );
  }
  return value;
}

/**
 * Multipart registration after payment proof:
 * screenshot + transaction_id + profile + team create/join.
 * Uploads screenshot to Supabase Storage, stores txn + file path on participant.
 */
export async function registerWithPaymentProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(
        400,
        "Payment screenshot is required",
        "VALIDATION_ERROR",
      );
    }

    const transactionId = validateTransactionId(req.body.transaction_id);
    const teamMode = String(req.body.team_mode ?? "").trim().toLowerCase();
    if (teamMode !== "create" && teamMode !== "join") {
      throw new AppError(
        400,
        "team_mode must be create or join",
        "VALIDATION_ERROR",
      );
    }

    const profile = validateCreateParticipant({
      full_name: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone,
      college: req.body.college,
      department: req.body.department,
      year: req.body.year,
    });

    const label = profile.full_name
      .trim()
      .replace(/[^\w.-]+/g, "_")
      .slice(0, 40);

    const stored = await uploadPaymentScreenshot({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname || "payment.jpg",
      transactionId,
      participantLabel: label || "participant",
    });

    const participant = await participantService.createParticipant({
      ...profile,
      payment_txn_id: transactionId,
      payment_drive_file_id: stored.file_id,
      payment_drive_file_url: stored.file_url,
      payment_verified_at: new Date().toISOString(),
    });

    let team;
    let role: "LEADER" | "MEMBER";

    if (teamMode === "create") {
      const teamName = String(req.body.team_name ?? "").trim();
      const teamSize = Number(req.body.team_size);
      if (teamName.length < 2) {
        throw new AppError(400, "Team name is required", "VALIDATION_ERROR");
      }
      if (teamSize !== 3 && teamSize !== 4) {
        throw new AppError(400, "Team size must be 3 or 4", "VALIDATION_ERROR");
      }
      team = await teamService.createTeam({
        team_name: teamName,
        team_size: teamSize,
        leader_participant_id: participant.id,
      });
      role = "LEADER";
    } else {
      const teamCode = String(req.body.team_code ?? "")
        .trim()
        .toUpperCase();
      if (!teamCode) {
        throw new AppError(400, "Team code is required", "VALIDATION_ERROR");
      }
      team = await teamService.joinTeam({
        team_code: teamCode,
        participant_id: participant.id,
      });
      role = "MEMBER";
    }

    res.status(201).json({
      success: true,
      data: {
        participant: toCreatedParticipant(participant),
        team,
        role,
        payment: {
          transaction_id: transactionId,
          file_id: stored.file_id,
          file_url: stored.file_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
