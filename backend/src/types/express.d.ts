import type { AdminJwtPayload } from "../services/adminAuthService.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export {};
