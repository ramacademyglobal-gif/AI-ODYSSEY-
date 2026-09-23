import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../middleware/errorHandler.js";
import * as participantService from "../services/participantService.js";
import { assertTeamFits, MAX_PARTICIPANTS, countParticipants } from "../services/registrationCapacity.js";
import * as teamService from "../services/teamService.js";
import { uploadPaymentScreenshot } from "../services/paymentStorageService.js";
import { toCreatedParticipant } from "../utils/mappers.js";
import {
  validateTeamRegistration,
  ValidationError,
} from "../utils/validation.js";

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
  if (value.length < 10 || value.length > 128) {
    throw new AppError(
      400,
      "Transaction ID must be 10–128 characters",
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
 * Multipart one-team registration after payment proof:
 * screenshot + transaction_id + team + leader + members.
 * Creates the full squad in one submit. Digital Hacker Pass QR is for leader only.
 */
export async function registerWithPaymentProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let createdLeaderId: string | null = null;
  const createdMemberIds: string[] = [];

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

    let membersParsed: unknown = req.body.members;
    if (typeof membersParsed === "string") {
      try {
        membersParsed = JSON.parse(membersParsed) as unknown;
      } catch {
        throw new AppError(
          400,
          "members must be a valid JSON array",
          "VALIDATION_ERROR",
        );
      }
    }

    let teamPayload;
    try {
      teamPayload = validateTeamRegistration({
        team_name: req.body.team_name,
        team_size: req.body.team_size,
        college: req.body.college,
        leader: {
          full_name: req.body.full_name ?? req.body.leader_full_name,
          email: req.body.email ?? req.body.leader_email,
          phone: req.body.phone ?? req.body.leader_phone,
          department: req.body.department ?? req.body.leader_department,
          year: req.body.year ?? req.body.leader_year,
          roll_number: req.body.roll_number ?? req.body.leader_roll_number,
        },
        members: membersParsed,
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw err;
    }

    const label = teamPayload.leader.full_name
      .trim()
      .replace(/[^\w.-]+/g, "_")
      .slice(0, 40);

    await assertTeamFits(teamPayload.team_size);

    // Duplicate email / phone / txn BEFORE uploading screenshot to Storage
    await participantService.checkRegistrationAvailability({
      email: teamPayload.leader.email,
      phone: teamPayload.leader.phone,
      payment_txn_id: transactionId,
    });

    const stored = await uploadPaymentScreenshot({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname || "payment.jpg",
      transactionId,
      participantLabel: label || "participant",
    });

    await assertTeamFits(teamPayload.team_size);

    const leader = await participantService.createParticipant({
      ...teamPayload.leader,
      payment_txn_id: transactionId,
      payment_drive_file_id: stored.file_id,
      payment_drive_file_url: stored.file_url,
      payment_verified_at: new Date().toISOString(),
    });
    createdLeaderId = leader.id;

    let team = await teamService.createTeam({
      team_name: teamPayload.team_name,
      team_size: teamPayload.team_size,
      leader_participant_id: leader.id,
    });

    for (const member of teamPayload.members) {
      const mate = await participantService.createTeamMateParticipant({
        full_name: member.full_name,
        college: teamPayload.college,
        department: member.department,
        year: member.year,
        roll_number: member.roll_number,
      });
      createdMemberIds.push(mate.id);
      team = await teamService.joinTeam({
        team_code: team.team_code,
        participant_id: mate.id,
      });
    }

    const saved = await countParticipants();
    if (saved > MAX_PARTICIPANTS) {
      throw new AppError(
        403,
        "Registrations are closed. Wait for AI Odyssey 2.0.",
        "REGISTRATION_CLOSED",
      );
    }

    res.status(201).json({
      success: true,
      data: {
        participant: toCreatedParticipant(leader),
        team,
        role: "LEADER" as const,
        payment: {
          transaction_id: transactionId,
          file_id: stored.file_id,
          file_url: stored.file_url,
        },
      },
    });
  } catch (err) {
    // Roll back partial squad so failed registration does not leave rows in Supabase
    try {
      for (const id of [...createdMemberIds].reverse()) {
        await participantService.deleteParticipantById(id);
      }
      if (createdLeaderId) {
        await participantService.rollbackLeaderRegistration(createdLeaderId);
      }
    } catch (cleanupErr) {
      console.error("Registration rollback failed:", cleanupErr);
    }
    next(err);
  }
}
