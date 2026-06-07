import { Router } from "express";
import { z } from "zod";
import { createLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { getClientIp, getUserAgent } from "../middleware/audit.js";
import * as auth from "../services/auth/auth.service.js";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../lib/errors.js";
export const authRouter = Router();
const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 20 });
authRouter.use(authLimiter);
const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        city: z.string().optional(),
    }),
});
authRouter.post("/register", validate(registerSchema), async (req, res) => {
    const user = await auth.register(req.body);
    res.status(201).json({ user });
});
const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});
authRouter.post("/login", validate(loginSchema), async (req, res) => {
    const { user, accessToken, refreshToken } = await auth.login({
        email: req.body.email,
        password: req.body.password,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
    });
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
});
authRouter.post("/refresh", async (req, res) => {
    const token = req.cookies?.sm_refresh;
    if (!token)
        throw new UnauthorizedError("Missing refresh token");
    const { user, accessToken, refreshToken } = await auth.refresh(token, {
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
    });
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
});
authRouter.post("/logout", async (req, res) => {
    const token = req.cookies?.sm_refresh;
    if (token)
        await auth.logout(token);
    clearRefreshCookie(res);
    res.status(204).end();
});
const forgotSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});
authRouter.post("/forgot-password", validate(forgotSchema), async (req, res) => {
    await auth.forgotPassword(req.body.email);
    res.json({ ok: true });
});
const resetSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8),
    }),
});
authRouter.post("/reset-password", validate(resetSchema), async (req, res) => {
    await auth.resetPassword(req.body);
    res.json({ ok: true });
});
const verifySchema = z.object({
    body: z.object({
        token: z.string().min(1),
    }),
});
authRouter.post("/verify-email", validate(verifySchema), async (req, res) => {
    await auth.verifyEmail(req.body.token);
    res.json({ ok: true });
});
authRouter.post("/resend-verification", validate(forgotSchema), async (req, res) => {
    await auth.resendVerification(req.body.email);
    res.json({ ok: true });
});
const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
    }),
});
authRouter.post("/change-password", requireAuth, validate(changePasswordSchema), async (req, res) => {
    await auth.changePassword({
        userId: req.user.id,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
    });
    res.json({ ok: true });
});
function setRefreshCookie(res, token) {
    res.cookie("sm_refresh", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
    });
}
function clearRefreshCookie(res) {
    res.clearCookie("sm_refresh", { path: "/api/auth" });
}
//# sourceMappingURL=auth.js.map