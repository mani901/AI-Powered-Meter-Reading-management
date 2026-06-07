import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type UserRole = "ADMIN" | "FIELD_STAFF" | "CONSUMER";

export type AccessTokenClaims = {
  sub: string;
  role: UserRole;
  email: string;
};

export type RefreshTokenClaims = {
  sub: string;
  tokenId: string;
};

export function signAccessToken(claims: AccessTokenClaims) {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(claims: RefreshTokenClaims) {
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & AccessTokenClaims;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & RefreshTokenClaims;
}

