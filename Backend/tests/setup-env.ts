import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "3001";
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || "900000";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || "1000";

process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
process.env.JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
process.env.JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL || "30d";
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || "10";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test";
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "test";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "test";
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "test";

process.env.SMTP_HOST = process.env.SMTP_HOST || "test";
process.env.SMTP_PORT = process.env.SMTP_PORT || "587";
process.env.SMTP_USER = process.env.SMTP_USER || "test";
process.env.SMTP_PASS = process.env.SMTP_PASS || "test";
process.env.SMTP_FROM = process.env.SMTP_FROM || "test@test";

process.env.APP_URL = process.env.APP_URL || "http://localhost:5173";
process.env.DEFAULT_CONFIDENCE_THRESHOLD = process.env.DEFAULT_CONFIDENCE_THRESHOLD || "0.75";
process.env.BILL_DUE_DAYS = process.env.BILL_DUE_DAYS || "15";

