import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { healthRouter } from "./routes/health.js";
import { exampleRouter } from "./routes/example.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { metersRouter } from "./routes/meters.js";
import { readingsRouter } from "./routes/readings.js";
import { tariffsRouter } from "./routes/tariffs.js";
import { billsRouter } from "./routes/bills.js";
import { notificationsRouter } from "./routes/notifications.js";
import { analyticsRouter } from "./routes/analytics.js";
import { adminRouter } from "./routes/admin.js";
import { staffRouter } from "./routes/staff.js";
import { disputesRouter } from "./routes/disputes.js";
import { exportRouter } from "./routes/export.js";
import { errorHandler } from "./middleware/error-handler.js";
import { globalLimiter } from "./middleware/rate-limit.js";
import { NotFoundError } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";

const app = express();

// Middleware
app.use(helmet());
app.set("trust proxy", env.NODE_ENV === "production");
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(globalLimiter);
app.use(pinoHttp({ logger }));

// Routes
app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to ai-powered-meter-reading API",
    version: "1.0.0",
    environment: env.NODE_ENV,
  });
});

app.use("/health", healthRouter);
app.use("/api/examples", exampleRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/meters", metersRouter);
app.use("/api/readings", readingsRouter);
app.use("/api/tariffs", tariffsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/staff", staffRouter);
app.use("/api/disputes", disputesRouter);
app.use("/api/export", exportRouter);

// 404 handler
app.all("*path", (_req, _res) => {
  throw new NotFoundError("Route not found");
});

// Error handler
app.use(errorHandler);

export default app;
