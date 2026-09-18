import type { NextFunction, Request, Response } from "express";
import * as adminAuthService from "../services/adminAuthService.js";
import * as adminCheckinService from "../services/adminCheckinService.js";
import * as adminDashboardService from "../services/adminDashboardService.js";
import * as adminExportService from "../services/adminExportService.js";
import * as adminParticipantService from "../services/adminParticipantService.js";
import {
  asTrimmedString,
  parseParticipantListQuery,
  validateAdminCheckin,
  validateAdminParticipantStatus,
  validateAdminUpdateParticipant,
  ValidationError,
} from "../utils/validation.js";

function requireAdminActor(req: Request, res: Response) {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication required",
    });
    return null;
  }
  return {
    email: req.admin.email,
    username: req.admin.username,
  };
}

function validateAdminLogin(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const data = body as Record<string, unknown>;
  const identifier = asTrimmedString(
    data.identifier ?? data.email ?? data.username,
  );
  const password =
    typeof data.password === "string" ? data.password : "";

  const errors: string[] = [];

  if (!identifier || identifier.length > 255) {
    errors.push("email or username is required");
  }
  if (!password || password.length > 200) {
    errors.push("password is required");
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return { identifier, password };
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { identifier, password } = validateAdminLogin(req.body);
    const result = await adminAuthService.loginAdmin(identifier, password);

    res.json({
      success: true,
      data: {
        token: result.token,
        token_type: "Bearer",
        expires_in: result.expiresIn,
        admin: result.admin,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        admin: {
          email: req.admin.email,
          username: req.admin.username,
          role: req.admin.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const stats = await adminDashboardService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardRecent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const rawLimit = req.query.limit;
    const limit =
      typeof rawLimit === "string" && rawLimit.trim() !== ""
        ? Number(rawLimit)
        : 20;

    const recent = await adminDashboardService.getRecentRegistrations(
      Number.isFinite(limit) ? limit : 20,
    );

    res.json({
      success: true,
      data: recent,
    });
  } catch (err) {
    next(err);
  }
}

export async function listParticipants(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const query = parseParticipantListQuery(
      req.query as Record<string, unknown>,
    );
    const result = await adminParticipantService.listParticipants(query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getParticipant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const hackerId = asTrimmedString(req.params.hackerId);
    if (!hackerId) {
      throw new ValidationError(["hackerId is required"]);
    }

    const participant =
      await adminParticipantService.getParticipantByHackerId(hackerId);

    res.json({
      success: true,
      data: participant,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateParticipant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdminActor(req, res);
    if (!admin) {
      return;
    }

    const hackerId = asTrimmedString(req.params.hackerId);
    if (!hackerId) {
      throw new ValidationError(["hackerId is required"]);
    }

    const input = validateAdminUpdateParticipant(req.body);
    const participant = await adminParticipantService.updateParticipant(
      hackerId,
      input,
      admin,
    );

    res.json({
      success: true,
      data: participant,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateParticipantStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdminActor(req, res);
    if (!admin) {
      return;
    }

    const hackerId = asTrimmedString(req.params.hackerId);
    if (!hackerId) {
      throw new ValidationError(["hackerId is required"]);
    }

    const { status } = validateAdminParticipantStatus(req.body);
    const participant = await adminParticipantService.setParticipantStatus(
      hackerId,
      status,
      admin,
    );

    res.json({
      success: true,
      data: participant,
    });
  } catch (err) {
    next(err);
  }
}

export async function scanCheckin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const token = asTrimmedString(req.params.token);
    if (!token) {
      throw new ValidationError(["QR token is required"]);
    }

    const result = await adminCheckinService.scanByQrToken(token);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCheckin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdminActor(req, res);
    if (!admin) {
      return;
    }

    const { qr_token } = validateAdminCheckin(req.body);
    const result = await adminCheckinService.checkInByQrToken(qr_token, admin);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportRoster(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const rows = await adminExportService.getRosterExportRows();
    res.json({
      success: true,
      data: {
        generated_at: new Date().toISOString(),
        columns: [
          "team_code",
          "team_name",
          "team_size",
          "hacker_id",
          "full_name",
          "email",
          "phone",
          "college",
          "department",
          "year",
          "role",
          "created_at",
        ],
        rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportPayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!requireAdminActor(req, res)) {
      return;
    }

    const rows = await adminExportService.getPaymentExportRows();
    res.json({
      success: true,
      data: {
        generated_at: new Date().toISOString(),
        columns: [
          "team_name",
          "team_size",
          "full_name",
          "phone",
          "college",
          "transaction_id",
          "screenshot_url",
        ],
        rows,
      },
    });
  } catch (err) {
    next(err);
  }
}
