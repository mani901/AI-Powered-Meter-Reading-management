import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireRole("ADMIN"));
adminRouter.get("/users", async (req, res) => {
    const { page, limit, skip } = toPagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const where = {
        ...(role && role !== "ALL" ? { role } : {}),
        ...(status && status !== "ALL" ? { isActive: status === "ACTIVE" } : {}),
        ...(search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                _count: { select: { meters: true, readings: true } },
            },
        }),
    ]);
    res.json(toPaginatedResponse({
        data: rows.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone ?? undefined,
            address: u.address ?? undefined,
            city: u.city ?? undefined,
            role: u.role,
            avatarUrl: u.avatarUrl ?? undefined,
            isActive: u.isActive,
            isEmailVerified: u.isEmailVerified,
            lastLoginAt: u.lastLoginAt?.toISOString(),
            createdAt: u.createdAt.toISOString(),
            totalMeters: u._count.meters,
            totalReadings: u._count.readings,
        })),
        page,
        limit,
        total,
    }));
});
const statusSchema = z.object({
    params: z.object({ id: z.string() }),
    body: z.object({ isActive: z.boolean() }),
});
adminRouter.patch("/users/:id/status", validate(statusSchema), async (req, res) => {
    const id = req.params.id;
    const user = await prisma.user.update({ where: { id }, data: { isActive: req.body.isActive } });
    res.json({ user: { id: user.id, isActive: user.isActive } });
});
const roleSchema = z.object({
    params: z.object({ id: z.string() }),
    body: z.object({ role: z.enum(["ADMIN", "CONSUMER"]) }),
});
adminRouter.patch("/users/:id/role", validate(roleSchema), async (req, res) => {
    const id = req.params.id;
    const user = await prisma.user.update({ where: { id }, data: { role: req.body.role } });
    res.json({ user: { id: user.id, role: user.role } });
});
adminRouter.get("/audit-logs", async (req, res) => {
    const { page, limit, skip } = toPagination(req.query);
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const entity = typeof req.query.entity === "string" ? req.query.entity : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const where = {
        ...(action ? { action } : {}),
        ...(entity ? { entity } : {}),
        ...(userId ? { userId } : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    ]);
    res.json(toPaginatedResponse({ data: rows, page, limit, total }));
});
//# sourceMappingURL=admin.js.map