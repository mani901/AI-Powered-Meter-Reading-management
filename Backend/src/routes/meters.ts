import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { addMonths, format } from "date-fns";
import type { Prisma } from "../generated/prisma/client.js";

export const metersRouter = Router();
metersRouter.use(requireAuth);

function isMeterStatus(v: string): v is "PENDING" | "ACTIVE" | "INACTIVE" | "FAULTY" | "REJECTED" {
  return v === "PENDING" || v === "ACTIVE" || v === "INACTIVE" || v === "FAULTY" || v === "REJECTED";
}

metersRouter.get("/", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);

  const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
  const status = statusRaw && isMeterStatus(statusRaw) ? statusRaw : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  let where: Prisma.MeterWhereInput;

  if (req.user!.role === "ADMIN") {
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    where = {
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { meterSerial: { contains: search, mode: "insensitive" as const } },
              { meterLabel: { contains: search, mode: "insensitive" as const } },
              { location: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
  } else if (req.user!.role === "FIELD_STAFF") {
    // Staff sees only their assigned meters
    const assignments = await prisma.staffMeterAssignment.findMany({
      where: { staffId: req.user!.id, isActive: true },
      select: { meterId: true },
    });
    const assignedIds = assignments.map((a) => a.meterId);
    where = {
      id: { in: assignedIds },
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { meterSerial: { contains: search, mode: "insensitive" as const } },
              { meterLabel: { contains: search, mode: "insensitive" as const } },
              { location: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
  } else {
    // CONSUMER sees only their own meters
    where = {
      userId: req.user!.id,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { meterSerial: { contains: search, mode: "insensitive" as const } },
              { meterLabel: { contains: search, mode: "insensitive" as const } },
              { location: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
  }

  const [total, rows] = await Promise.all([
    prisma.meter.count({ where }),
    prisma.meter.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
  ]);

  res.json(toPaginatedResponse({ data: rows.map(toMeterDto), page, limit, total }));
});

metersRouter.get("/:id/assignments", async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");
  if (req.user!.role !== "ADMIN" && meter.userId !== req.user!.id) throw new ForbiddenError();

  const assignments = await prisma.staffMeterAssignment.findMany({
    where: { meterId: id, isActive: true },
    include: { staff: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  res.json({ data: assignments });
});

metersRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");

  if (req.user!.role === "ADMIN") {
    return res.json({ meter: toMeterDto(meter) });
  }
  if (req.user!.role === "FIELD_STAFF") {
    const assignment = await prisma.staffMeterAssignment.findUnique({
      where: { staffId_meterId: { staffId: req.user!.id, meterId: id } },
    });
    if (!assignment?.isActive) throw new ForbiddenError();
    return res.json({ meter: toMeterDto(meter) });
  }
  // CONSUMER
  if (meter.userId !== req.user!.id) throw new ForbiddenError();
  res.json({ meter: toMeterDto(meter) });
});

const patchSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    meterLabel: z.string().optional(),
    installationDate: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "FAULTY", "REJECTED"]).optional(),
  }),
});

metersRouter.patch("/:id", requireRole("ADMIN"), validate(patchSchema), async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");

  const updated = await prisma.meter.update({
    where: { id: meter.id },
    data: {
      meterLabel: req.body.meterLabel?.trim() || null,
      installationDate: req.body.installationDate ? new Date(req.body.installationDate) : null,
      location: req.body.location?.trim() || null,
      status: req.body.status,
    },
  });

  res.json({ meter: toMeterDto(updated) });
});

metersRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");
  await prisma.meter.update({ where: { id }, data: { status: "INACTIVE" } });
  res.status(204).end();
});

async function canAccessMeter(userId: string, role: string, meterId: string): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role === "FIELD_STAFF") {
    const a = await prisma.staffMeterAssignment.findUnique({
      where: { staffId_meterId: { staffId: userId, meterId } },
    });
    return !!a?.isActive;
  }
  // CONSUMER
  const m = await prisma.meter.findUnique({ where: { id: meterId }, select: { userId: true } });
  return m?.userId === userId;
}

metersRouter.get("/:id/readings", async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");
  if (!await canAccessMeter(req.user!.id, req.user!.role, id)) throw new ForbiddenError();

  const { page, limit, skip } = toPagination(req.query);
  const [total, rows] = await Promise.all([
    prisma.reading.count({ where: { meterId: meter.id } }),
    prisma.reading.findMany({
      where: { meterId: meter.id },
      orderBy: { readingDate: "desc" },
      skip,
      take: limit,
    }),
  ]);
  res.json(toPaginatedResponse({ data: rows.map(toReadingDto), page, limit, total }));
});

metersRouter.get("/:id/stats", async (req, res) => {
  const id = req.params.id as string;
  const meter = await prisma.meter.findUnique({ where: { id } });
  if (!meter) throw new NotFoundError("Meter not found");
  if (!await canAccessMeter(req.user!.id, req.user!.role, id)) throw new ForbiddenError();

  const period = typeof req.query.period === "string" ? req.query.period : "12";
  if (!["3", "6", "12"].includes(period)) throw new ValidationError("Invalid period");

  const months = Number(period);
  const from = addMonths(new Date(), -months);
  const readings = await prisma.reading.findMany({
    where: { meterId: meter.id, readingDate: { gte: from } },
    select: { readingDate: true, consumption: true },
  });

  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const k = format(addMonths(new Date(), -i), "MMM yy");
    buckets.set(k, 0);
  }
  for (const r of readings) {
    const k = format(r.readingDate, "MMM yy");
    if (!buckets.has(k)) continue;
    const c = Number(r.consumption ?? 0);
    buckets.set(k, (buckets.get(k) ?? 0) + c);
  }

  res.json({
    data: Array.from(buckets.entries()).map(([month, consumption]) => ({ month, consumption })),
  });
});

function toMeterDto(m: Prisma.MeterGetPayload<Record<string, never>>) {
  return {
    id: m.id,
    userId: m.userId,
    meterSerial: m.meterSerial,
    meterLabel: m.meterLabel ?? undefined,
    meterType: m.meterType === "ANALOG" ? "analog" : "digital",
    installationDate: m.installationDate ? m.installationDate.toISOString().slice(0, 10) : undefined,
    location: m.location ?? undefined,
    status: m.status,
    maxDigits: m.maxDigits,
    initialReading: m.initialReading !== null && m.initialReading !== undefined ? Number(m.initialReading) : undefined,
    lastReadingValue: m.lastReadingValue !== null && m.lastReadingValue !== undefined ? Number(m.lastReadingValue) : undefined,
    lastReadingDate: m.lastReadingDate ? m.lastReadingDate.toISOString().slice(0, 10) : undefined,
    createdAt: m.createdAt.toISOString(),
  };
}

function toReadingDto(r: Prisma.ReadingGetPayload<Record<string, never>>) {
  return {
    id: r.id,
    meterId: r.meterId,
    userId: r.userId,
    readingValue: Number(r.readingValue),
    previousReading: r.previousReading !== null && r.previousReading !== undefined ? Number(r.previousReading) : undefined,
    consumption: r.consumption !== null && r.consumption !== undefined ? Number(r.consumption) : undefined,
    readingDate: r.readingDate.toISOString().slice(0, 10),
    imageUrl: r.imageUrl ?? undefined,
    source: r.source,
    confidenceScore: r.confidenceScore ?? undefined,
    status: r.status,
    isAnomalous: r.isAnomalous,
    anomalyReason: r.anomalyReason ?? undefined,
    reviewNotes: r.reviewNotes ?? undefined,
    createdAt: r.createdAt.toISOString(),
  };
}

