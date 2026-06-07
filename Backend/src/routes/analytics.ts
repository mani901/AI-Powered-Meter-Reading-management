import { Router } from "express";
import { addMonths, format } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get("/consumer/summary", async (req, res) => {
  const period = typeof req.query.period === "string" ? req.query.period : "12";
  const meterId = typeof req.query.meterId === "string" ? req.query.meterId : "ALL";
  const months = ["3", "6", "12"].includes(period) ? Number(period) : 12;
  const from = addMonths(new Date(), -months);

  // Find meters owned by this consumer
  const consumerMeters = await prisma.meter.findMany({
    where: { userId: req.user!.id },
    select: { id: true },
  });
  const consumerMeterIds = consumerMeters.map((m) => m.id);

  const readings = await prisma.reading.findMany({
    where: {
      meterId: meterId !== "ALL" ? meterId : { in: consumerMeterIds },
      readingDate: { gte: from },
      status: "ACCEPTED",
    },
    select: { readingDate: true, consumption: true },
  });

  const buckets = new Map<string, { consumption: number; cost: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const k = format(addMonths(new Date(), -i), "MMM yy");
    buckets.set(k, { consumption: 0, cost: 0 });
  }

  for (const r of readings) {
    const k = format(r.readingDate, "MMM yy");
    if (!buckets.has(k)) continue;
    const consumption = Number(r.consumption ?? 0);
    const prev = buckets.get(k)!;
    prev.consumption += consumption;
    prev.cost += Math.round(consumption * 14.5);
  }

  const data = Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.consumption, 0) / data.length) : 0;

  res.json({ period: months, meterId, avg, data });
});

analyticsRouter.get("/admin/dashboard", requireRole(["ADMIN"]), async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalUsers,
    activeUsers,
    totalMeters,
    activeMeters,
    totalReadings,
    readingsThisMonth,
    flaggedReadings,
    pendingReviews,
    avgConfidence,
    revenueThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.meter.count(),
    prisma.meter.count({ where: { status: "ACTIVE" } }),
    prisma.reading.count(),
    prisma.reading.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.reading.count({ where: { status: "FLAGGED" } }),
    prisma.reading.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.reading.aggregate({ _avg: { confidenceScore: true }, where: { confidenceScore: { not: null } } }),
    prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfMonth } } }),
  ]);

  const readingsBySource = await prisma.reading.groupBy({
    by: ["source"],
    _count: { _all: true },
  });

  const monthlyReadingTrend = await Promise.all(
    Array.from({ length: 6 }).map(async (_v, idx) => {
      const d = addMonths(new Date(), -(5 - idx));
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      const count = await prisma.reading.count({ where: { createdAt: { gte: start, lt: end } } });
      return { month: format(d, "MMM yy"), readings: count };
    }),
  );

  const confidenceDistribution = await buildConfidenceDistribution();

  res.json({
    totalUsers,
    activeUsers,
    totalMeters,
    activeMeters,
    totalReadings,
    readingsThisMonth,
    flaggedReadings,
    pendingReviews,
    avgConfidenceScore: avgConfidence._avg.confidenceScore ?? 0,
    revenueThisMonth: Number(revenueThisMonth._sum.totalAmount ?? 0),
    readingsBySource: readingsBySource.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = r._count._all;
      return acc;
    }, {}),
    monthlyReadingTrend,
    confidenceDistribution,
  });
});

analyticsRouter.get("/admin/reports/user-growth", requireRole(["ADMIN"]), async (_req, res) => {
  const data = await Promise.all(
    Array.from({ length: 6 }).map(async (_v, idx) => {
      const d = addMonths(new Date(), -(5 - idx));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      const users = await prisma.user.count({ where: { createdAt: { lt: end } } });
      return { month: format(d, "MMM yy"), users };
    }),
  );
  res.json({ data });
});

analyticsRouter.get("/admin/reports/revenue", requireRole(["ADMIN"]), async (_req, res) => {
  const data = await Promise.all(
    Array.from({ length: 6 }).map(async (_v, idx) => {
      const d = addMonths(new Date(), -(5 - idx));
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      const revenue = await prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: start, lt: end } } });
      return { month: format(d, "MMM yy"), revenue: Number(revenue._sum.totalAmount ?? 0) };
    }),
  );
  res.json({ data });
});

analyticsRouter.get("/staff/summary", requireRole(["FIELD_STAFF"]), async (req, res) => {
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

analyticsRouter.get("/admin/staff-overview", requireRole(["ADMIN"]), async (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [totalStaff, activeStaff, readingsToday, pendingReadings] = await Promise.all([
    prisma.user.count({ where: { role: "FIELD_STAFF" } }),
    prisma.user.count({ where: { role: "FIELD_STAFF", isActive: true } }),
    prisma.reading.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.reading.count({ where: { status: "PENDING_REVIEW" } }),
  ]);

  res.json({ totalStaff, activeStaff, readingsToday, pendingReadings });
});

async function buildConfidenceDistribution() {
  const rows = await prisma.reading.findMany({
    where: { confidenceScore: { not: null } },
    select: { confidenceScore: true },
  });

  const buckets = [
    { range: "90-100%", count: 0 },
    { range: "80-90%", count: 0 },
    { range: "70-80%", count: 0 },
    { range: "60-70%", count: 0 },
    { range: "<60%", count: 0 },
  ];

  for (const r of rows) {
    const pct = Math.round((r.confidenceScore ?? 0) * 100);
    if (pct >= 90) buckets[0].count++;
    else if (pct >= 80) buckets[1].count++;
    else if (pct >= 70) buckets[2].count++;
    else if (pct >= 60) buckets[3].count++;
    else buckets[4].count++;
  }

  return buckets;
}

