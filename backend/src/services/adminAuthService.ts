import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAdminConfig } from "../config/admin.js";
import { AppError } from "../middleware/errorHandler.js";

/** Valid bcrypt hash used only to equalize timing when the identifier is wrong. */
const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export type AdminJwtPayload = {
  sub: string;
  email: string;
  username: string;
  role: "admin";
};

export type AdminLoginResult = {
  token: string;
  expiresIn: string;
  admin: {
    email: string;
    username: string;
    role: "admin";
  };
};

function identifiersMatch(identifier: string): boolean {
  const config = getAdminConfig();
  const normalized = identifier.trim().toLowerCase();
  return normalized === config.email || normalized === config.username;
}

export async function loginAdmin(
  identifier: string,
  password: string,
): Promise<AdminLoginResult> {
  const config = getAdminConfig();
  const matched = identifiersMatch(identifier);
  const hashToCompare = matched ? config.passwordHash : DUMMY_PASSWORD_HASH;

  let passwordOk = false;
  try {
    passwordOk = await bcrypt.compare(password, hashToCompare);
  } catch {
    passwordOk = false;
  }

  if (!matched || !passwordOk) {
    throw new AppError(401, "Invalid email/username or password", "INVALID_CREDENTIALS");
  }

  const payload: AdminJwtPayload = {
    sub: "admin",
    email: config.email,
    username: config.username,
    role: "admin",
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

  return {
    token,
    expiresIn: config.jwtExpiresIn,
    admin: {
      email: config.email,
      username: config.username,
      role: "admin",
    },
  };
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const config = getAdminConfig();

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Authentication expired", "TOKEN_EXPIRED");
    }
    throw new AppError(401, "Invalid authentication", "INVALID_TOKEN");
  }

  if (!decoded || typeof decoded !== "object") {
    throw new AppError(401, "Invalid authentication", "INVALID_TOKEN");
  }

  const payload = decoded as Partial<AdminJwtPayload>;
  if (
    payload.role !== "admin" ||
    typeof payload.email !== "string" ||
    typeof payload.username !== "string" ||
    typeof payload.sub !== "string"
  ) {
    throw new AppError(401, "Invalid authentication", "INVALID_TOKEN");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    username: payload.username,
    role: "admin",
  };
}
