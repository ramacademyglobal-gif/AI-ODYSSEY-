import { Router } from "express";
import * as paymentController from "../controllers/paymentController.js";

export const paymentRoutes = Router();

paymentRoutes.post(
  "/register",
  paymentController.paymentProofUpload,
  paymentController.registerWithPaymentProof,
);
