import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as hackathonController from "../controllers/hackathonController.js";

export const hackathonRoutes = Router();

const attemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMITED",
    message: "Too many attempts. Try again later.",
  },
});

hackathonRoutes.get("/state", hackathonController.getHackathonState);
hackathonRoutes.post("/authorize", attemptLimiter, hackathonController.authorizeHackathon);
hackathonRoutes.post("/start", attemptLimiter, hackathonController.startHackathon);
