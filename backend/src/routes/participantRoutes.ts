import { Router } from "express";
import * as participantController from "../controllers/participantController.js";

export const participantRoutes = Router();

participantRoutes.post("/", participantController.createParticipant);
/** Must be registered before /:hackerId so "check-availability" is not treated as an ID. */
participantRoutes.post(
  "/check-availability",
  participantController.checkAvailability,
);
participantRoutes.get(
  "/capacity",
  participantController.getRegistrationCapacity,
);
participantRoutes.get(
  "/:hackerId",
  participantController.getParticipantByHackerId,
);
