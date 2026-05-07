import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { NotFoundError } from "../lib/errors.js";
import type { Prisma, UserRole } from "../generated/prisma/client.js";

export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireRole("ADMIN"));

adminRouter.get("/users", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const where: Prisma.UserWhereInput = {
    ...(role && role !== "ALL" ? { role: role as UserRole } : {}),
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

  res.json(
    toPaginatedResponse({
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
    }),
  );
});

const statusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ isActive: z.boolean() }),
});

adminRouter.patch("/users/:id/status", validate(statusSchema), async (req, res) => {
  const id = req.params.id as string;
  const user = await prisma.user.update({ where: { id }, data: { isActive: req.body.isActive } });
  res.json({ user: { id: user.id, isActive: user.isActive } });
});

const roleSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ role: z.enum(["ADMIN", "CONSUMER"]) }),
});

adminRouter.patch("/users/:id/role", validate(roleSchema), async (req, res) => {
  const id = req.params.id as string;
  const user = await prisma.user.update({ where: { id }, data: { role: req.body.role } });
  res.json({ user: { id: user.id, role: user.role } });
});

// ── Pending user approvals ──────────────────────────────────────────────────

adminRouter.get("/users/pending", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const [total, rows] = await Promise.all([
    prisma.user.count({ where: { isPendingApproval: true } }),
    prisma.user.findMany({
      where: { isPendingApproval: true },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: { _count: { select: { meters: true } } },
    }),
  ]);
  res.json(
    toPaginatedResponse({
      data: rows.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone ?? undefined,
        city: u.city ?? undefined,
        role: u.role,
        isPendingApproval: u.isPendingApproval,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        totalMeters: u._count.meters,
      })),
      page,
      limit,
      total,
    }),
  );
});

const approveUserSchema = z.object({
  params: z.object({ id: z.string() }),
});

adminRouter.post("/users/:id/approve", validate(approveUserSchema), async (req, res) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");

  await prisma.user.update({
    where: { id },
    data: { isActive: true, isPendingApproval: false, rejectionReason: null },
  });

  await prisma.notification.create({
    data: {
      userId: id,
      type: "ACCOUNT_APPROVED",
      title: "Account Approved",
      message: "Your registration has been approved! You can now log in and start using the system.",
      link: "/dashboard",
    },
  });

  res.json({ success: true, message: "User approved" });
});

const rejectUserSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ reason: z.string().min(1).optional() }),
});

adminRouter.post("/users/:id/reject", validate(rejectUserSchema), async (req, res) => {
  const id = req.params.id as string;
  const reason: string = req.body.reason ?? "Your registration was not approved.";
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");

  await prisma.user.update({
    where: { id },
    data: { isActive: false, isPendingApproval: false, rejectionReason: reason },
  });

  await prisma.notification.create({
    data: {
      userId: id,
      type: "ACCOUNT_REJECTED",
      title: "Account Registration Rejected",
      message: reason,
      link: "/register",
    },
  });

  res.json({ success: true, message: "User rejected" });
});

// ── Pending meter approvals ─────────────────────────────────────────────────

adminRouter.get("/meters/pending", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const [total, rows] = await Promise.all([
    prisma.meter.count({ where: { status: "PENDING" } }),
    prisma.meter.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
  ]);
  res.json(
    toPaginatedResponse({
      data: rows.map((m) => ({
        id: m.id,
        meterSerial: m.meterSerial,
        meterLabel: m.meterLabel ?? undefined,
        meterType: m.meterType === "ANALOG" ? "analog" : "digital",
        location: m.location ?? undefined,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
      })),
      page,
      limit,
      total,
    }),
  );
});

const approveMeterSchema = z.object({
  params: z.object({ id: z.string() }),
});

adminRouter.post("/meters/:id/approve", validate(approveMeterSchema), async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");

  await prisma.meter.update({ where: { id }, data: { status: "ACTIVE" } });

  await prisma.notification.create({
    data: {
      userId: meter.userId,
      type: "METER_APPROVED",
      title: "Meter Approved",
      message: `Your meter ${meter.meterSerial}${meter.meterLabel ? ` (${meter.meterLabel})` : ""} has been approved and is now active.`,
      link: "/meters",
    },
  });

  res.json({ success: true, message: "Meter approved" });
});

const rejectMeterSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ reason: z.string().min(1).optional() }),
});

adminRouter.post("/meters/:id/reject", validate(rejectMeterSchema), async (req, res) => {
  const id = req.params.id as string;
  const reason: string = req.body.reason ?? "Your meter registration was not approved.";
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");

  await prisma.meter.update({ where: { id }, data: { status: "REJECTED" } });

  await prisma.notification.create({
    data: {
      userId: meter.userId,
      type: "METER_REJECTED",
      title: "Meter Registration Rejected",
      message: `Your meter ${meter.meterSerial}${meter.meterLabel ? ` (${meter.meterLabel})` : ""} was rejected. Reason: ${reason}`,
      link: "/meters",
    },
  });

  res.json({ success: true, message: "Meter rejected" });
});

// ── Audit logs ──────────────────────────────────────────────────────────────

adminRouter.get("/audit-logs", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const entity = typeof req.query.entity === "string" ? req.query.entity : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  const where: Prisma.AuditLogWhereInput = {
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

