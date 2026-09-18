import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "../utils/validation.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.code ?? "APP_ERROR",
      message: err.message,
    });
    return;
  }

  console.error("Unhandled API error:", err instanceof Error ? err.message : err);

  res.status(500).json({
    success: false,
    error: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
}
