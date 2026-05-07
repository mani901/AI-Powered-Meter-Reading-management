import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { healthRouter } from "./routes/health.js";
import { exampleRouter } from "./routes/example.js";
import { errorHandler } from "./middleware/error-handler.js";
import { globalLimiter } from "./middleware/rate-limit.js";
import { NotFoundError } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
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

// 404 handler
app.all("*path", (_req, _res) => {
  throw new NotFoundError("Route not found");
});

// Error handler
app.use(errorHandler);

export default app;
