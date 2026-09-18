import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as adminController from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

export const adminRoutes = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMITED",
    message: "Too many login attempts. Try again later.",
  },
});

adminRoutes.post("/login", loginLimiter, adminController.login);
adminRoutes.get("/me", requireAdmin, adminController.getSession);
adminRoutes.get(
  "/dashboard/stats",
  requireAdmin,
  adminController.getDashboardStats,
);
adminRoutes.get(
  "/dashboard/recent",
  requireAdmin,
  adminController.getDashboardRecent,
);
adminRoutes.get("/export/roster", requireAdmin, adminController.exportRoster);
adminRoutes.get(
  "/export/payments",
  requireAdmin,
  adminController.exportPayments,
);
adminRoutes.get(
  "/participants",
  requireAdmin,
  adminController.listParticipants,
);
adminRoutes.get(
  "/participants/:hackerId",
  requireAdmin,
  adminController.getParticipant,
);
adminRoutes.put(
  "/participants/:hackerId",
  requireAdmin,
  adminController.updateParticipant,
);
adminRoutes.patch(
  "/participants/:hackerId/status",
  requireAdmin,
  adminController.updateParticipantStatus,
);
adminRoutes.get(
  "/checkin/scan/:token",
  requireAdmin,
  adminController.scanCheckin,
);
adminRoutes.post("/checkin", requireAdmin, adminController.createCheckin);
