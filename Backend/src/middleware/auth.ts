import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError("Missing access token");
    const token = header.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
};

export function requireRole(role: "ADMIN" | "CONSUMER"): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError("Unauthorized"));
    if (req.user.role !== role) return next(new ForbiddenError("Insufficient permissions"));
    next();
  };
}

