import { Router } from "express";
import * as participantController from "../controllers/participantController.js";

export const participantRoutes = Router();

participantRoutes.post("/", participantController.createParticipant);
participantRoutes.get(
  "/:hackerId",
  participantController.getParticipantByHackerId,
);
