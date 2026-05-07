import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { uploadImageBuffer } from "../services/storage/cloudinary.service.js";
import { extractReadingFromImage } from "../services/ai/gemini.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { getClientIp, getUserAgent } from "../middleware/audit.js";
import type { Prisma, ReadingSource, ReadingStatus } from "../generated/prisma/client.js";

export const readingsRouter = Router();
readingsRouter.use(requireAuth);

// POST /api/readings/upload (no persistence)
readingsRouter.post(
  "/upload",
  upload.single("image"),
  async (req, res) => {
    const meterId = typeof req.body.meterId === "string" ? req.body.meterId : undefined;
    if (!meterId) throw new ValidationError("meterId is required");
    if (!req.file?.buffer) throw new ValidationError("image file is required (field name: image)");

    const meter = await prisma.meter.findUnique({ where: { id: meterId } });
    if (!meter) throw new NotFoundError("Meter not found");
    if (req.user!.role !== "ADMIN" && meter.userId !== req.user!.id) throw new ForbiddenError();

    const uploaded = await uploadImageBuffer({
      buffer: req.file.buffer,
      folder: "smartmeter/readings",
    });

    const meterType = meter.meterType === "ANALOG" ? "analog" : "digital";
    const ai = await extractReadingFromImage({ imageBuffer: req.file.buffer, meterType });

    const previousReading = meter.lastReadingValue !== null && meter.lastReadingValue !== undefined ? Number(meter.lastReadingValue) : undefined;
    const consumption = previousReading !== undefined ? ai.readingValue - previousReading : undefined;

    const isAnomalous = consumption !== undefined ? consumption > 450 || consumption < 0 : false;
    const anomalyReason =
      consumption === undefined ? undefined :
      consumption < 0 ? "Reading is lower than previous reading (possible meter reset)" :
      consumption > 450 ? `Unusually high consumption (${consumption} kWh)` :
      undefined;

    res.json({
      readingValue: ai.readingValue,
      confidenceScore: ai.confidenceScore,
      meterType,
      previousReading,
      consumption,
      isAnomalous,
      anomalyReason,
      imageUrl: uploaded.url,
      imagePublicId: uploaded.publicId,
    });
  },
);

const commitSchema = z.object({
  body: z.object({
    meterId: z.string().min(1),
    readingValue: z.number().nonnegative(),
    readingDate: z.string().min(1),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().optional(),
    source: z.enum(["AI_EXTRACTED", "AI_CORRECTED", "MANUAL"]),
    confidenceScore: z.number().min(0).max(1).optional(),
  }),
});

readingsRouter.post("/", validate(commitSchema), async (req, res) => {
  const meter = await prisma.meter.findUnique({ where: { id: req.body.meterId } });
  if (!meter) throw new NotFoundError("Meter not found");
  if (req.user!.role !== "ADMIN" && meter.userId !== req.user!.id) throw new ForbiddenError();

  const userSettings = await prisma.userSettings.findUnique({ where: { userId: req.user!.id } });
  const threshold = (userSettings?.confidenceThreshold ?? 75) / 100;

  const previous = meter.lastReadingValue !== null && meter.lastReadingValue !== undefined ? Number(meter.lastReadingValue) : undefined;
  const consumption = previous !== undefined ? req.body.readingValue - previous : undefined;

  const isAnomalous = consumption !== undefined ? consumption < 0 || consumption > 450 : false;
  const anomalyReason =
    consumption === undefined ? undefined :
    consumption < 0 ? "Reading is lower than previous reading (possible meter reset)" :
    consumption > 450 ? `Unusually high consumption (${consumption} kWh)` :
    undefined;

  const status =
    req.body.source !== "MANUAL" && (req.body.confidenceScore ?? 1) < threshold
      ? "FLAGGED"
      : "ACCEPTED";

  const reading = await prisma.reading.create({
    data: {
      meterId: meter.id,
      userId: meter.userId,
      readingValue: req.body.readingValue,
      previousReading: previous ?? null,
      consumption: consumption ?? null,
      readingDate: new Date(req.body.readingDate),
      imageUrl: req.body.imageUrl ?? null,
      imagePublicId: req.body.imagePublicId ?? null,
      source: req.body.source,
      confidenceScore: req.body.confidenceScore ?? null,
      status,
      isAnomalous,
      anomalyReason: anomalyReason ?? null,
    },
  });

  await prisma.meter.update({
    where: { id: meter.id },
    data: {
      lastReadingValue: req.body.readingValue,
      lastReadingDate: new Date(req.body.readingDate),
    },
  });

  const meterLabel = meter.meterLabel ?? meter.meterSerial;
  await prisma.notification.create({
    data: {
      userId: meter.userId,
      type: "READING_SUBMITTED",
      title: req.body.source === "MANUAL" ? "Manual Reading Submitted" : "Reading Submitted Successfully",
      message: `Your meter reading of ${Math.round(req.body.readingValue).toLocaleString()} for ${meterLabel} has been recorded.`,
      isRead: false,
      link: "/readings",
    },
  });

  if (status === "FLAGGED") {
    await prisma.notification.create({
      data: {
        userId: meter.userId,
        type: "LOW_CONFIDENCE_READING",
        title: "Low Confidence Reading",
        message: `Reading from ${meterLabel} has ${Math.round((req.body.confidenceScore ?? 0) * 100)}% confidence. An admin will review it.`,
        isRead: false,
        link: "/admin/readings",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: "READING_CREATED",
      entity: "Reading",
      entityId: reading.id,
      details: `${req.body.source} reading ${req.body.readingValue} for meter ${meter.meterSerial}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    },
  });

  res.status(201).json({ reading: toReadingDto(reading, meter) });
});

const manualSchema = z.object({
  body: z.object({
    meterId: z.string().min(1),
    readingValue: z.number().nonnegative(),
    readingDate: z.string().min(1),
  }),
});

readingsRouter.post("/manual", validate(manualSchema), async (req, res) => {
  req.body = { ...req.body, source: "MANUAL" };
  // Delegate to the main commit handler shape
  const result = await prisma.$transaction(async () => {
    const meter = await prisma.meter.findUnique({ where: { id: req.body.meterId } });
    if (!meter) throw new NotFoundError("Meter not found");
    if (req.user!.role !== "ADMIN" && meter.userId !== req.user!.id) throw new ForbiddenError();

    const previous = meter.lastReadingValue !== null && meter.lastReadingValue !== undefined ? Number(meter.lastReadingValue) : undefined;
    const consumption = previous !== undefined ? req.body.readingValue - previous : undefined;

    const isAnomalous = consumption !== undefined ? consumption < 0 || consumption > 450 : false;
    const anomalyReason =
      consumption === undefined ? undefined :
      consumption < 0 ? "Manual reading lower than previous reading" :
      consumption > 450 ? `Unusually high consumption (${consumption} kWh)` :
      undefined;

    const reading = await prisma.reading.create({
      data: {
        meterId: meter.id,
        userId: meter.userId,
        readingValue: req.body.readingValue,
        previousReading: previous ?? null,
        consumption: consumption ?? null,
        readingDate: new Date(req.body.readingDate),
        source: "MANUAL",
        status: "ACCEPTED",
        isAnomalous,
        anomalyReason: anomalyReason ?? null,
      },
    });

    await prisma.meter.update({
      where: { id: meter.id },
      data: {
        lastReadingValue: req.body.readingValue,
        lastReadingDate: new Date(req.body.readingDate),
      },
    });

    await prisma.notification.create({
      data: {
        userId: meter.userId,
        type: "READING_SUBMITTED",
        title: "Manual Reading Submitted",
        message: `Manual reading of ${Math.round(req.body.readingValue).toLocaleString()} for ${meter.meterLabel ?? meter.meterSerial} has been recorded.`,
        isRead: false,
        link: "/readings",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "READING_CREATED",
        entity: "Reading",
        entityId: reading.id,
        details: `MANUAL reading ${req.body.readingValue} for meter ${meter.meterSerial}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    return { reading, meter };
  });

  res.status(201).json({ reading: toReadingDto(result.reading, result.meter) });
});

readingsRouter.get("/", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query, { limit: 10 });
  const meterId = typeof req.query.meterId === "string" ? req.query.meterId : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const source = typeof req.query.source === "string" ? req.query.source : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const where: Prisma.ReadingWhereInput = {
    userId: req.user!.role === "ADMIN" && typeof req.query.userId === "string" ? req.query.userId : req.user!.id,
    ...(meterId && meterId !== "ALL" ? { meterId } : {}),
    ...(status && status !== "ALL" ? { status: status as ReadingStatus } : {}),
    ...(source && source !== "ALL" ? { source: source as ReadingSource } : {}),
    ...(from || to
      ? { readingDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };

  if (search) {
    const ownerUserId = req.user!.role === "ADMIN" && typeof req.query.userId === "string"
      ? req.query.userId
      : req.user!.id;
    const meters = await prisma.meter.findMany({
      where: {
        userId: ownerUserId,
        OR: [
          { meterSerial: { contains: search, mode: "insensitive" } },
          { meterLabel: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    where.meterId = { in: meters.map((m) => m.id) };
  }

  const [total, rows] = await Promise.all([
    prisma.reading.count({ where }),
    prisma.reading.findMany({
      where,
      orderBy: { readingDate: "desc" },
      skip,
      take: limit,
      include: { meter: true },
    }),
  ]);

  res.json(toPaginatedResponse({ data: rows.map((r) => toReadingDto(r, r.meter)), page, limit, total }));
});

readingsRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const reading = await prisma.reading.findUnique({ where: { id }, include: { meter: true } });
  if (!reading) throw new NotFoundError("Reading not found");
  if (req.user!.role !== "ADMIN" && reading.userId !== req.user!.id) throw new ForbiddenError();
  res.json({ reading: toReadingDto(reading, reading.meter) });
});

readingsRouter.delete("/:id", async (req, res) => {
  const id = req.params.id as string;
  const reading = await prisma.reading.findUnique({ where: { id } });
  if (!reading) throw new NotFoundError("Reading not found");
  if (req.user!.role !== "ADMIN" && reading.userId !== req.user!.id) throw new ForbiddenError();
  await prisma.reading.delete({ where: { id } });
  res.status(204).end();
});

const reviewSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    action: z.enum(["ACCEPT", "REJECT"]),
    notes: z.string().optional(),
  }),
});

readingsRouter.post("/:id/review", requireRole("ADMIN"), validate(reviewSchema), async (req, res) => {
  const id = req.params.id as string;
  const reading = await prisma.reading.findUnique({ where: { id }, include: { meter: true } });
  if (!reading) throw new NotFoundError("Reading not found");

  const updated = await prisma.reading.update({
    where: { id },
    data: {
      status: req.body.action === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      reviewNotes: req.body.notes?.trim() || null,
      reviewedById: req.user!.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: "READING_REVIEWED",
      entity: "Reading",
      entityId: updated.id,
      details: `Admin ${req.body.action} reading ${updated.id}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    },
  });

  const refreshed = await prisma.reading.findUnique({ where: { id }, include: { meter: true } });
  res.json({ reading: toReadingDto(refreshed!, reading.meter) });
});

function toReadingDto(
  r:
    | Prisma.ReadingGetPayload<{ include: { meter: true } }>
    | Prisma.ReadingGetPayload<Record<string, never>>,
  meter: Prisma.MeterGetPayload<Record<string, never>> | null,
) {
  return {
    id: r.id,
    meterId: r.meterId,
    meterSerial: meter?.meterSerial,
    meterLabel: meter?.meterLabel,
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

