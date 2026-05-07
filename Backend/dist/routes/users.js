import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { uploadImageBuffer } from "../services/storage/cloudinary.service.js";
import { NotFoundError } from "../lib/errors.js";
import { toPublicUser } from "../services/auth/auth.service.js";
export const usersRouter = Router();
usersRouter.use(requireAuth);
usersRouter.get("/me", async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        throw new NotFoundError("User not found");
    const [totalMeters, totalReadings] = await Promise.all([
        prisma.meter.count({ where: { userId: user.id } }),
        prisma.reading.count({ where: { userId: user.id } }),
    ]);
    res.json({ user: { ...toPublicUser(user), totalMeters, totalReadings } });
});
const patchMeSchema = z.object({
    body: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
    }),
});
usersRouter.patch("/me", validate(patchMeSchema), async (req, res) => {
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            firstName: req.body.firstName?.trim(),
            lastName: req.body.lastName?.trim(),
            phone: req.body.phone?.trim() || null,
            address: req.body.address?.trim() || null,
            city: req.body.city?.trim() || null,
        },
    });
    res.json({ user: toPublicUser(user) });
});
usersRouter.post("/me/avatar", upload.single("avatar"), async (req, res) => {
    if (!req.file?.buffer) {
        res.status(400).json({ error: "Missing avatar file (field name: avatar)" });
        return;
    }
    const uploaded = await uploadImageBuffer({
        buffer: req.file.buffer,
        folder: "smartmeter/avatars",
    });
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: uploaded.url },
    });
    res.json({ user: toPublicUser(user) });
});
usersRouter.get("/me/settings", async (req, res) => {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user.id } });
    if (!settings)
        throw new NotFoundError("Settings not found");
    res.json({ settings });
});
const putSettingsSchema = z.object({
    body: z.object({
        emailNotifications: z.boolean(),
        readingReminders: z.boolean(),
        abnormalAlerts: z.boolean(),
        billingAlerts: z.boolean(),
        reminderDay: z.number().int().min(1).max(31),
        language: z.string().min(1),
        currency: z.string().min(1),
        confidenceThreshold: z.number().int().min(50).max(100),
        timezone: z.string().min(1),
        twoFactor: z.boolean(),
    }),
});
usersRouter.put("/me/settings", validate(putSettingsSchema), async (req, res) => {
    const settings = await prisma.userSettings.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, ...req.body },
        update: { ...req.body },
    });
    res.json({ settings });
});
//# sourceMappingURL=users.js.map