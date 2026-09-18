function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for admin authentication`);
  }
  return value;
}

export type AdminConfig = {
  email: string;
  username: string;
  passwordHash: string;
  jwtSecret: string;
  jwtExpiresIn: string;
};

let cached: AdminConfig | null = null;

export function getAdminConfig(): AdminConfig {
  if (cached) {
    return cached;
  }

  const email = requiredEnv("ADMIN_EMAIL").toLowerCase();
  const username = (
    process.env.ADMIN_USERNAME?.trim() || email.split("@")[0] || "admin"
  ).toLowerCase();
  const passwordHash = requiredEnv("ADMIN_PASSWORD_HASH");
  const jwtSecret = requiredEnv("JWT_SECRET");

  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  if (!passwordHash.startsWith("$2")) {
    throw new Error("ADMIN_PASSWORD_HASH must be a bcrypt hash");
  }

  cached = {
    email,
    username,
    passwordHash,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "8h",
  };

  return cached;
}
