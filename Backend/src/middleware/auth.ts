import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { verifyAccessToken, type UserRole } from "../lib/jwt.js";

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

export function requireRole(roles: UserRole | UserRole[]): RequestHandler {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError("Unauthorized"));
    if (!allowed.includes(req.user.role as UserRole)) return next(new ForbiddenError("Insufficient permissions"));
    next();
  };
}

