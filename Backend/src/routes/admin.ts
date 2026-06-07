import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";
import { createUser } from "../services/auth/auth.service.js";
import type { Prisma, UserRole, DisputeStatus } from "../generated/prisma/client.js";

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
  body: z.object({ role: z.enum(["ADMIN", "FIELD_STAFF", "CONSUMER"]) }),
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

// ── Admin Create User ────────────────────────────────────────────────────────

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    city: z.string().optional(),
    role: z.enum(["FIELD_STAFF", "CONSUMER"]),
  }),
});

adminRouter.post("/users/create", validate(createUserSchema), async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json({ user });
});

// ── Staff Management ─────────────────────────────────────────────────────────

adminRouter.get("/staff", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const where: Prisma.UserWhereInput = {
    role: "FIELD_STAFF",
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
        _count: { select: { staffAssignments: true, readings: true } },
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
        city: u.city ?? undefined,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString(),
        createdAt: u.createdAt.toISOString(),
        assignedMeters: u._count.staffAssignments,
        totalReadings: u._count.readings,
      })),
      page,
      limit,
      total,
    }),
  );
});

adminRouter.get("/staff/:id/meters", async (req, res) => {
  const staffId = req.params.id as string;
  const staff = await prisma.user.findUnique({ where: { id: staffId, role: "FIELD_STAFF" } });
  if (!staff) throw new NotFoundError("Staff member not found");

  const assignments = await prisma.staffMeterAssignment.findMany({
    where: { staffId, isActive: true },
    include: {
      meter: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
    orderBy: { assignedAt: "desc" },
  });

  res.json({
    data: assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.assignedAt.toISOString(),
      meter: {
        id: a.meter.id,
        meterSerial: a.meter.meterSerial,
        meterLabel: a.meter.meterLabel ?? undefined,
        location: a.meter.location ?? undefined,
        status: a.meter.status,
        lastReadingValue: a.meter.lastReadingValue !== null ? Number(a.meter.lastReadingValue) : undefined,
        lastReadingDate: a.meter.lastReadingDate?.toISOString().slice(0, 10),
        owner: a.meter.user,
      },
    })),
  });
});

// ── Meter Assignment ─────────────────────────────────────────────────────────

const assignOwnerSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ consumerId: z.string() }),
});

adminRouter.post("/meters/:id/assign-owner", validate(assignOwnerSchema), async (req, res) => {
  const meterId = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id: meterId } });
  if (!meter) throw new NotFoundError("Meter not found");

  const consumer = await prisma.user.findUnique({ where: { id: req.body.consumerId } });
  if (!consumer || consumer.role !== "CONSUMER") throw new NotFoundError("Consumer not found");

  const updated = await prisma.meter.update({
    where: { id: meterId },
    data: { userId: req.body.consumerId },
  });

  res.json({ meter: { id: updated.id, meterSerial: updated.meterSerial, userId: updated.userId } });
});

const assignStaffSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ staffId: z.string() }),
});

adminRouter.post("/meters/:id/assign-staff", validate(assignStaffSchema), async (req, res) => {
  const meterId = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id: meterId } });
  if (!meter) throw new NotFoundError("Meter not found");

  const staff = await prisma.user.findUnique({ where: { id: req.body.staffId } });
  if (!staff || staff.role !== "FIELD_STAFF") throw new NotFoundError("Field staff member not found");

  const existing = await prisma.staffMeterAssignment.findUnique({
    where: { staffId_meterId: { staffId: req.body.staffId, meterId } },
  });

  if (existing) {
    if (existing.isActive) throw new ConflictError("Staff member is already assigned to this meter");
    const updated = await prisma.staffMeterAssignment.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
    return res.json({ assignment: updated });
  }

  const assignment = await prisma.staffMeterAssignment.create({
    data: { staffId: req.body.staffId, meterId },
  });

  res.status(201).json({ assignment });
});

const unassignStaffSchema = z.object({
  params: z.object({ id: z.string(), staffId: z.string() }),
});

adminRouter.delete("/meters/:id/unassign-staff/:staffId", validate(unassignStaffSchema), async (req, res) => {
  const meterId = req.params.id as string;
  const staffId = req.params.staffId as string;

  const assignment = await prisma.staffMeterAssignment.findUnique({
    where: { staffId_meterId: { staffId, meterId } },
  });
  if (!assignment) throw new NotFoundError("Assignment not found");

  await prisma.staffMeterAssignment.update({
    where: { id: assignment.id },
    data: { isActive: false },
  });

  res.status(204).end();
});

// ── Meter Management (admin creates/edits/deactivates) ───────────────────────

const adminCreateMeterSchema = z.object({
  body: z.object({
    meterSerial: z.string().min(4).max(20).regex(/^[A-Za-z0-9-]+$/),
    meterLabel: z.string().optional(),
    meterType: z.enum(["analog", "digital"]),
    installationDate: z.string().optional(),
    location: z.string().optional(),
    maxDigits: z.number().int().min(4).max(7).default(5),
    initialReading: z.number().nonnegative().optional(),
    consumerId: z.string().optional(),
  }),
});

adminRouter.post("/meters", validate(adminCreateMeterSchema), async (req, res) => {
  const serial = req.body.meterSerial.toUpperCase();
  const existing = await prisma.meter.findUnique({ where: { meterSerial: serial } });
  if (existing) throw new ConflictError("This serial number is already registered");

  let ownerId = req.user!.id;
  if (req.body.consumerId) {
    const consumer = await prisma.user.findUnique({ where: { id: req.body.consumerId } });
    if (!consumer || consumer.role !== "CONSUMER") throw new NotFoundError("Consumer not found");
    ownerId = req.body.consumerId;
  }

  const meter = await prisma.meter.create({
    data: {
      userId: ownerId,
      meterSerial: serial,
      meterLabel: req.body.meterLabel?.trim() || null,
      meterType: req.body.meterType === "analog" ? "ANALOG" : "DIGITAL",
      installationDate: req.body.installationDate ? new Date(req.body.installationDate) : null,
      location: req.body.location?.trim() || null,
      status: "ACTIVE",
      maxDigits: req.body.maxDigits ?? 5,
      initialReading: req.body.initialReading ?? null,
      lastReadingValue: req.body.initialReading ?? null,
      lastReadingDate: req.body.initialReading ? new Date() : null,
    },
  });

  if (req.body.consumerId) {
    await prisma.notification.create({
      data: {
        userId: req.body.consumerId,
        type: "METER_APPROVED",
        title: "Meter Assigned",
        message: `A meter (${serial}) has been assigned to your account by the administrator.`,
        link: "/meters",
      },
    });
  }

  res.status(201).json({ meter });
});

// ── Disputes Management ──────────────────────────────────────────────────────

adminRouter.get("/disputes", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const where: Prisma.DisputeWhereInput = {
    ...(status && status !== "ALL" ? { status: status as DisputeStatus } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.dispute.count({ where }),
    prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        meter: { select: { id: true, meterSerial: true, meterLabel: true } },
      },
    }),
  ]);

  res.json(toPaginatedResponse({ data: rows, page, limit, total }));
});

const updateDisputeSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]).optional(),
    adminNotes: z.string().optional(),
  }),
});

adminRouter.patch("/disputes/:id", validate(updateDisputeSchema), async (req, res) => {
  const id = req.params.id as string;
  const dispute = await prisma.dispute.findUnique({ where: { id } });
  if (!dispute) throw new NotFoundError("Dispute not found");

  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      ...(req.body.status ? { status: req.body.status as DisputeStatus } : {}),
      ...(req.body.adminNotes !== undefined ? { adminNotes: req.body.adminNotes } : {}),
      ...(req.body.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
    },
  });

  // Notify consumer when dispute status changes or admin notes are added
  const newStatus: string | undefined = req.body.status;
  const statusMessages: Record<string, string> = {
    UNDER_REVIEW: "Your dispute is now under review by admin.",
    RESOLVED: "Your dispute has been resolved.",
    REJECTED: "Your dispute has been reviewed and rejected by admin.",
  };
  const notifMessage = newStatus && statusMessages[newStatus]
    ? `${statusMessages[newStatus]}${req.body.adminNotes ? ` Note: ${req.body.adminNotes}` : ""}`
    : req.body.adminNotes
      ? `Admin has added a note to your dispute: ${req.body.adminNotes}`
      : null;

  if (notifMessage) {
    await prisma.notification.create({
      data: {
        userId: dispute.userId,
        type: "SYSTEM_ALERT",
        title: "Dispute Update",
        message: notifMessage,
        link: "/disputes",
      },
    });
  }

  res.json({ dispute: updated });
});

