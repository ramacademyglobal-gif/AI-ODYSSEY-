import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import { participantRoutes } from "./routes/participantRoutes.js";
import { teamRoutes } from "./routes/teamRoutes.js";
import { passRoutes } from "./routes/passRoutes.js";
import { paymentRoutes } from "./routes/paymentRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { hackathonRoutes } from "./routes/hackathonRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "100kb" }));

function isOpenApiRead(path: string): boolean {
  return (
    path === "/api/health" ||
    path === "/api/hackathon/state" ||
    /^\/api\/passes\/[^/]+\/scan$/.test(path)
  );
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.originalUrl.split("?")[0];
    if (req.method === "GET" && isOpenApiRead(path)) return true;
    if (req.method === "POST" && /^\/api\/passes\/[^/]+\/checkin$/.test(path)) return true;
    return false;
  },
  message: {
    success: false,
    error: "RATE_LIMITED",
    message: "Too many attempts from this network. Wait a minute and scan again.",
  },
});

app.use("/api", limiter);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "AI ODYSSEY 24 API is running",
  });
});

app.use("/api/participants", participantRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/passes", passRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hackathon", hackathonRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
====================================
 AI ODYSSEY 24 BACKEND
====================================

 Server: http://localhost:${PORT}

 Health:
 http://localhost:${PORT}/api/health

====================================
  `);
});
