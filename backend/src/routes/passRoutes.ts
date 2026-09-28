import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as passController from "../controllers/passController.js";

export const passRoutes = Router();

const gateAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMITED",
    message: "Too many attempts from this network. Wait a minute and scan again.",
  },
});

passRoutes.get("/:qrToken/scan", passController.scanGateCheckin);
passRoutes.post("/:qrToken/checkin", gateAttemptLimiter, passController.createGateCheckin);
passRoutes.get("/:qrToken", passController.getPassByQrToken);
