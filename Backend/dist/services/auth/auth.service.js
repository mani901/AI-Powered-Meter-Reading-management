import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../../lib/errors.js";
import { hashPassword, sha256Base64Url, verifyPassword } from "../../lib/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { sendResetPasswordEmail, sendVerifyEmail } from "../email/email.service.js";
import { env } from "../../config/env.js";
const VERIFY_EMAIL_TTL = "1d";
const RESET_PASSWORD_TTL = "30m";
export function toPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? undefined,
        address: user.address ?? undefined,
        city: user.city ?? undefined,
        role: user.role,
        avatarUrl: user.avatarUrl ?? undefined,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
    };
}
export async function register(input) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing)
        throw new ConflictError("Email already registered");
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
        data: {
            email: input.email.toLowerCase(),
            passwordHash,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            phone: input.phone?.trim() || null,
            city: input.city?.trim() || null,
            role: "CONSUMER",
            settings: { create: { confidenceThreshold: Math.round(env.DEFAULT_CONFIDENCE_THRESHOLD * 100) } },
        },
    });
    const token = signEmailToken({ sub: user.id, type: "verify_email" }, VERIFY_EMAIL_TTL);
    await sendVerifyEmail({ to: user.email, token, name: user.firstName });
    return toPublicUser(user);
}
export async function login(input) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user)
        throw new UnauthorizedError("Invalid email or password");
    if (!user.isActive)
        throw new UnauthorizedError("Account is deactivated. Contact admin.");
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok)
        throw new UnauthorizedError("Invalid email or password");
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const { refreshToken } = await issueRefreshToken({ userId: user.id, ip: input.ip, userAgent: input.userAgent });
    return { user: toPublicUser(user), accessToken, refreshToken };
}
export async function refresh(refreshToken, args) {
    const payload = verifyRefreshToken(refreshToken);
    const tokenId = payload.tokenId;
    const row = await prisma.refreshToken.findUnique({ where: { id: tokenId }, include: { user: true } });
    if (!row)
        throw new UnauthorizedError("Invalid refresh token");
    if (row.revokedAt)
        throw new UnauthorizedError("Refresh token revoked");
    if (row.expiresAt.getTime() <= Date.now())
        throw new UnauthorizedError("Refresh token expired");
    if (row.tokenHash !== sha256Base64Url(refreshToken))
        throw new UnauthorizedError("Invalid refresh token");
    // Revoke old and rotate
    await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    const accessToken = signAccessToken({ sub: row.user.id, role: row.user.role, email: row.user.email });
    const rotated = await issueRefreshToken({ userId: row.user.id, ip: args.ip, userAgent: args.userAgent });
    return { user: toPublicUser(row.user), accessToken, refreshToken: rotated.refreshToken };
}
export async function logout(refreshToken) {
    try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.refreshToken.updateMany({
            where: { id: payload.tokenId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    catch {
        // ignore
    }
}
export async function forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user)
        return;
    const token = signEmailToken({ sub: user.id, type: "reset_password" }, RESET_PASSWORD_TTL);
    await sendResetPasswordEmail({ to: user.email, token, name: user.firstName });
}
export async function resetPassword(input) {
    const payload = verifyEmailToken(input.token);
    if (payload.type !== "reset_password")
        throw new ValidationError("Invalid reset token");
    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } });
}
export async function verifyEmail(token) {
    const payload = verifyEmailToken(token);
    if (payload.type !== "verify_email")
        throw new ValidationError("Invalid verification token");
    await prisma.user.update({ where: { id: payload.sub }, data: { isEmailVerified: true } });
}
export async function resendVerification(email) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user)
        return;
    if (user.isEmailVerified)
        return;
    const token = signEmailToken({ sub: user.id, type: "verify_email" }, VERIFY_EMAIL_TTL);
    await sendVerifyEmail({ to: user.email, token, name: user.firstName });
}
export async function changePassword(input) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user)
        throw new UnauthorizedError("Unauthorized");
    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok)
        throw new UnauthorizedError("Current password is incorrect");
    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
async function issueRefreshToken(args) {
    // Create row first (we need its id in the JWT)
    const row = await prisma.refreshToken.create({
        data: {
            userId: args.userId,
            tokenHash: sha256Base64Url(`pending-${cryptoRandom()}`),
            expiresAt: addRefreshTtl(),
            ip: args.ip,
            userAgent: args.userAgent,
        },
    });
    const refreshToken = signRefreshToken({ sub: args.userId, tokenId: row.id });
    await prisma.refreshToken.update({
        where: { id: row.id },
        data: { tokenHash: sha256Base64Url(refreshToken) },
    });
    return { refreshToken };
}
function signEmailToken(payload, expiresIn) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: expiresIn });
}
function verifyEmailToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
function addRefreshTtl() {
    // Simple parse: support trailing d/h/m
    const ttl = env.JWT_REFRESH_TTL;
    const m = /^(\d+)([dhm])$/.exec(ttl);
    if (!m)
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const n = Number(m[1]);
    const unit = m[2];
    const ms = unit === "d" ? n * 24 * 60 * 60 * 1000 :
        unit === "h" ? n * 60 * 60 * 1000 :
            n * 60 * 1000;
    return new Date(Date.now() + ms);
}
function cryptoRandom() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
//# sourceMappingURL=auth.service.js.map