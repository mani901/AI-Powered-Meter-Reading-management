import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { addMonths, format } from "date-fns";

export const staffRouter = Router();
staffRouter.use(requireAuth);
staffRouter.use(requireRole(["FIELD_STAFF"]));

// GET /api/staff/dashboard — summary stats for the logged-in staff
staffRouter.get("/dashboard", async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [assignedMeters, totalSubmitted, submittedToday, pendingReviews, approved, rejected] = await Promise.all([
    prisma.staffMeterAssignment.count({ where: { staffId: req.user!.id, isActive: true } }),
    prisma.reading.count({ where: { userId: req.user!.id } }),
    prisma.reading.count({ where: { userId: req.user!.id, createdAt: { gte: startOfToday } } }),
    prisma.reading.count({ where: { userId: req.user!.id, status: "PENDING_REVIEW" } }),
    prisma.reading.count({ where: { userId: req.user!.id, status: "ACCEPTED" } }),
    prisma.reading.count({ where: { userId: req.user!.id, status: "REJECTED" } }),
  ]);

  res.json({ assignedMeters, totalSubmitted, submittedToday, pendingReviews, approved, rejected });
});

// GET /api/staff/meters — all meters assigned to the logged-in staff member
staffRouter.get("/meters", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);

  const [total, rows] = await Promise.all([
    prisma.staffMeterAssignment.count({ where: { staffId: req.user!.id, isActive: true } }),
    prisma.staffMeterAssignment.findMany({
      where: { staffId: req.user!.id, isActive: true },
      orderBy: { assignedAt: "desc" },
      skip,
      take: limit,
      include: {
        meter: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    }),
  ]);

  res.json(
    toPaginatedResponse({
      data: rows.map((a) => ({
        assignmentId: a.id,
        assignedAt: a.assignedAt.toISOString(),
        meter: {
          id: a.meter.id,
          meterSerial: a.meter.meterSerial,
          meterLabel: a.meter.meterLabel ?? undefined,
          meterType: a.meter.meterType === "ANALOG" ? "analog" : "digital",
          location: a.meter.location ?? undefined,
          status: a.meter.status,
          lastReadingValue: a.meter.lastReadingValue !== null ? Number(a.meter.lastReadingValue) : undefined,
          lastReadingDate: a.meter.lastReadingDate?.toISOString().slice(0, 10),
          owner: a.meter.user,
        },
      })),
      page,
      limit,
      total,
    }),
  );
});

// GET /api/staff/readings — readings submitted by this staff member
staffRouter.get("/readings", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query, { limit: 20 });
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const where = {
    userId: req.user!.id,
    ...(status && status !== "ALL" ? { status: status as "PENDING_REVIEW" | "ACCEPTED" | "REJECTED" | "FLAGGED" } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.reading.count({ where }),
    prisma.reading.findMany({
      where,
      orderBy: { readingDate: "desc" },
      skip,
      take: limit,
      include: {
        meter: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    }),
  ]);

  res.json(
    toPaginatedResponse({
      data: rows.map((r) => ({
        id: r.id,
        meterId: r.meterId,
        meterSerial: r.meter.meterSerial,
        meterLabel: r.meter.meterLabel ?? undefined,
        meterOwner: r.meter.user ? `${r.meter.user.firstName} ${r.meter.user.lastName}` : undefined,
        readingValue: Number(r.readingValue),
        previousReading: r.previousReading !== null ? Number(r.previousReading) : undefined,
        consumption: r.consumption !== null ? Number(r.consumption) : undefined,
        readingDate: r.readingDate.toISOString().slice(0, 10),
        imageUrl: r.imageUrl ?? undefined,
        source: r.source,
        confidenceScore: r.confidenceScore ?? undefined,
        status: r.status,
        isAnomalous: r.isAnomalous,
        anomalyReason: r.anomalyReason ?? undefined,
        reviewNotes: r.reviewNotes ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    }),
  );
});

// GET /api/staff/performance — monthly submission trend for this staff
staffRouter.get("/performance", async (req, res) => {
  const months = 6;
  const data = await Promise.all(
    Array.from({ length: months }).map(async (_v, idx) => {
      const d = addMonths(new Date(), -(months - 1 - idx));
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      const [submitted, approved] = await Promise.all([
        prisma.reading.count({ where: { userId: req.user!.id, createdAt: { gte: start, lt: end } } }),
        prisma.reading.count({ where: { userId: req.user!.id, status: "ACCEPTED", createdAt: { gte: start, lt: end } } }),
      ]);
      return { month: format(d, "MMM yy"), submitted, approved };
    }),
  );
  res.json({ data });
});
