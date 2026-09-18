import { Router } from "express";
import * as teamController from "../controllers/teamController.js";

export const teamRoutes = Router();

teamRoutes.post("/", teamController.createTeam);
teamRoutes.post("/join", teamController.joinTeam);
teamRoutes.get("/:code", teamController.getTeamByCode);
