import type { Request } from "express";

export function getClientIp(req: Request) {
  const xf = req.headers["x-forwarded-for"];
  const forwarded = Array.isArray(xf) ? xf[0] : xf;
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.socket.remoteAddress ?? undefined;
}

export function getUserAgent(req: Request) {
  return req.headers["user-agent"];
}

