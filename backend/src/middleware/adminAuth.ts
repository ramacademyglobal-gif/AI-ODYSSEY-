import type { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../services/adminAuthService.js";

function extractBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Rejects missing, invalid, or expired admin JWTs.
 * Attach verified claims to `req.admin`.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    req.admin = verifyAdminToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
