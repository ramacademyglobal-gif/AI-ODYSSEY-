import { Router } from "express";
import * as passController from "../controllers/passController.js";

export const passRoutes = Router();

passRoutes.get("/:qrToken/scan", passController.scanGateCheckin);
passRoutes.post("/:qrToken/checkin", passController.createGateCheckin);
passRoutes.get("/:qrToken", passController.getPassByQrToken);
