import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { addMonths, format } from "date-fns";
export const metersRouter = Router();
metersRouter.use(requireAuth);
function isMeterStatus(v) {
    return v === "ACTIVE" || v === "INACTIVE" || v === "FAULTY";
}
metersRouter.get("/", async (req, res) => {
    const { page, limit, skip } = toPagination(req.query);
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const status = statusRaw && isMeterStatus(statusRaw) ? statusRaw : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const userId = req.user.role === "ADMIN" && typeof req.query.userId === "string"
        ? req.query.userId
        : req.user.id;
    const where = {
        userId,
        ...(status ? { status } : {}),
        ...(search
            ? {
                OR: [
                    { meterSerial: { contains: search, mode: "insensitive" } },
                    { meterLabel: { contains: search, mode: "insensitive" } },
                    { location: { contains: search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.meter.count({ where }),
        prisma.meter.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    ]);
    res.json(toPaginatedResponse({ data: rows.map(toMeterDto), page, limit, total }));
});
const createSchema = z.object({
    body: z.object({
        meterSerial: z.string().min(4).max(20).regex(/^[A-Za-z0-9-]+$/),
        meterLabel: z.string().optional(),
        meterType: z.enum(["analog", "digital"]),
        installationDate: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "FAULTY"]).optional(),
        maxDigits: z.number().int().min(4).max(7),
        initialReading: z.number().nonnegative().optional(),
    }),
});
metersRouter.post("/", validate(createSchema), async (req, res) => {
    const serial = req.body.meterSerial.toUpperCase();
    const count = await prisma.meter.count({ where: { userId: req.user.id } });
    if (count >= 10)
        throw new ValidationError("Maximum 10 meters allowed per account");
    const existing = await prisma.meter.findUnique({ where: { meterSerial: serial } });
    if (existing)
        throw new ConflictError("This serial number is already registered");
    const meter = await prisma.meter.create({
        data: {
            userId: req.user.id,
            meterSerial: serial,
            meterLabel: req.body.meterLabel?.trim() || null,
            meterType: req.body.meterType === "analog" ? "ANALOG" : "DIGITAL",
            installationDate: req.body.installationDate ? new Date(req.body.installationDate) : null,
            location: req.body.location?.trim() || null,
            status: req.body.status ?? "ACTIVE",
            maxDigits: req.body.maxDigits,
            initialReading: req.body.initialReading ?? null,
            lastReadingValue: req.body.initialReading ?? null,
            lastReadingDate: req.body.initialReading ? new Date() : null,
        },
    });
    res.status(201).json({ meter: toMeterDto(meter) });
});
metersRouter.get("/:id", async (req, res) => {
    const id = req.params.id;
    const meter = await prisma.meter.findUnique({ where: { id } });
    if (!meter)
        throw new NotFoundError("Meter not found");
    if (req.user.role !== "ADMIN" && meter.userId !== req.user.id)
        throw new ForbiddenError();
    res.json({ meter: toMeterDto(meter) });
});
const patchSchema = z.object({
    params: z.object({ id: z.string() }),
    body: z.object({
        meterLabel: z.string().optional(),
        installationDate: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "FAULTY"]).optional(),
    }),
});
metersRouter.patch("/:id", validate(patchSchema), async (req, res) => {
    const id = req.params.id;
    const meter = await prisma.meter.findUnique({ where: { id } });
    if (!meter)
        throw new NotFoundError("Meter not found");
    if (req.user.role !== "ADMIN" && meter.userId !== req.user.id)
        throw new ForbiddenError();
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
metersRouter.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const meter = await prisma.meter.findUnique({ where: { id } });
    if (!meter)
        throw new NotFoundError("Meter not found");
    if (req.user.role !== "ADMIN" && meter.userId !== req.user.id)
        throw new ForbiddenError();
    await prisma.meter.delete({ where: { id: meter.id } });
    res.status(204).end();
});
metersRouter.get("/:id/readings", async (req, res) => {
    const id = req.params.id;
    const meter = await prisma.meter.findUnique({ where: { id } });
    if (!meter)
        throw new NotFoundError("Meter not found");
    if (req.user.role !== "ADMIN" && meter.userId !== req.user.id)
        throw new ForbiddenError();
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
    const id = req.params.id;
    const meter = await prisma.meter.findUnique({ where: { id } });
    if (!meter)
        throw new NotFoundError("Meter not found");
    if (req.user.role !== "ADMIN" && meter.userId !== req.user.id)
        throw new ForbiddenError();
    const period = typeof req.query.period === "string" ? req.query.period : "12";
    if (!["3", "6", "12"].includes(period))
        throw new ValidationError("Invalid period");
    const months = Number(period);
    const from = addMonths(new Date(), -months);
    const readings = await prisma.reading.findMany({
        where: { meterId: meter.id, readingDate: { gte: from } },
        select: { readingDate: true, consumption: true },
    });
    const buckets = new Map();
    for (let i = months - 1; i >= 0; i--) {
        const k = format(addMonths(new Date(), -i), "MMM yy");
        buckets.set(k, 0);
    }
    for (const r of readings) {
        const k = format(r.readingDate, "MMM yy");
        if (!buckets.has(k))
            continue;
        const c = Number(r.consumption ?? 0);
        buckets.set(k, (buckets.get(k) ?? 0) + c);
    }
    res.json({
        data: Array.from(buckets.entries()).map(([month, consumption]) => ({ month, consumption })),
    });
});
function toMeterDto(m) {
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
function toReadingDto(r) {
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
//# sourceMappingURL=meters.js.map