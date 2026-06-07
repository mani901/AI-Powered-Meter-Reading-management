import "dotenv/config";

const port = parseInt(process.env.PORT || "3000", 10);
if (isNaN(port) || port < 0 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 0 and 65535.`);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
if (isNaN(rateLimitWindowMs) || rateLimitWindowMs < 0) {
  throw new Error(`Invalid RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS}. Must be a positive number.`);
}

const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);
if (isNaN(rateLimitMax) || rateLimitMax < 1) {
  throw new Error(`Invalid RATE_LIMIT_MAX: ${process.env.RATE_LIMIT_MAX}. Must be a positive number.`);
}

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET environment variable is required.");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is required.");
}
const jwtAccessTtl = process.env.JWT_ACCESS_TTL || "15m";
const jwtRefreshTtl = process.env.JWT_REFRESH_TTL || "30d";

const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
if (isNaN(bcryptRounds) || bcryptRounds < 8 || bcryptRounds > 15) {
  throw new Error(`Invalid BCRYPT_ROUNDS: ${process.env.BCRYPT_ROUNDS}. Must be a number between 8 and 15.`);
}

const meterAiUrl = process.env.METER_AI_URL || "http://localhost:8000";

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error("CLOUDINARY_CLOUD_NAME environment variable is required.");
}
if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error("CLOUDINARY_API_KEY environment variable is required.");
}
if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error("CLOUDINARY_API_SECRET environment variable is required.");
}

if (!process.env.SMTP_HOST) {
  throw new Error("SMTP_HOST environment variable is required.");
}
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
if (isNaN(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
  throw new Error(`Invalid SMTP_PORT: ${process.env.SMTP_PORT}. Must be a number between 1 and 65535.`);
}
if (!process.env.SMTP_USER) {
  throw new Error("SMTP_USER environment variable is required.");
}
if (!process.env.SMTP_PASS) {
  throw new Error("SMTP_PASS environment variable is required.");
}
const smtpFrom = process.env.SMTP_FROM || "SmartMeter <no-reply@smartmeter.local>";

const appUrl = process.env.APP_URL || corsOrigin;

const defaultConfidenceThreshold = Number(process.env.DEFAULT_CONFIDENCE_THRESHOLD || "0.75");
if (!Number.isFinite(defaultConfidenceThreshold) || defaultConfidenceThreshold <= 0 || defaultConfidenceThreshold > 1) {
  throw new Error(
    `Invalid DEFAULT_CONFIDENCE_THRESHOLD: ${process.env.DEFAULT_CONFIDENCE_THRESHOLD}. Must be a number in (0, 1].`,
  );
}

const billDueDays = parseInt(process.env.BILL_DUE_DAYS || "15", 10);
if (isNaN(billDueDays) || billDueDays < 1 || billDueDays > 60) {
  throw new Error(`Invalid BILL_DUE_DAYS: ${process.env.BILL_DUE_DAYS}. Must be a number between 1 and 60.`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: port,
  RATE_LIMIT_WINDOW_MS: rateLimitWindowMs,
  RATE_LIMIT_MAX: rateLimitMax,
  DATABASE_URL: process.env.DATABASE_URL!,
  CORS_ORIGIN: corsOrigin,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_TTL: jwtAccessTtl,
  JWT_REFRESH_TTL: jwtRefreshTtl,
  BCRYPT_ROUNDS: bcryptRounds,
  METER_AI_URL: meterAiUrl,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: smtpPort,
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,
  SMTP_FROM: smtpFrom,
  APP_URL: appUrl,
  DEFAULT_CONFIDENCE_THRESHOLD: defaultConfidenceThreshold,
  BILL_DUE_DAYS: billDueDays,
} as const;
