import { Router } from "express";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import { env } from "../config/env.js";
import { calculateSlabBreakdown, getActiveResidentialTariffs } from "../services/billing/tariff.service.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import type { Prisma, BillStatus } from "../generated/prisma/client.js";

export const billsRouter = Router();
billsRouter.use(requireAuth);

billsRouter.get("/", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const meterId = typeof req.query.meterId === "string" ? req.query.meterId : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const monthFrom = typeof req.query.monthFrom === "string" ? req.query.monthFrom : undefined;
  const monthTo = typeof req.query.monthTo === "string" ? req.query.monthTo : undefined;

  const where: Prisma.BillWhereInput = {
    userId: req.user!.role === "ADMIN" && typeof req.query.userId === "string" ? req.query.userId : req.user!.id,
    ...(meterId ? { meterId } : {}),
    ...(status ? { status: status as BillStatus } : {}),
    ...(monthFrom || monthTo
      ? { billingMonth: { ...(monthFrom ? { gte: monthFrom } : {}), ...(monthTo ? { lte: monthTo } : {}) } }
      : {}),
  };

  const [total, bills] = await Promise.all([
    prisma.bill.count({ where }),
    prisma.bill.findMany({ where, orderBy: { billingMonth: "desc" }, skip, take: limit }),
  ]);

  res.json(toPaginatedResponse({ data: bills.map(toBillDto), page, limit, total }));
});

billsRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new NotFoundError("Bill not found");
  if (req.user!.role !== "ADMIN" && bill.userId !== req.user!.id) throw new ForbiddenError();
  res.json({ bill: toBillDto(bill) });
});

const calcSchema = z.object({
  body: z.object({
    unitsConsumed: z.number().int().min(0),
  }),
});

billsRouter.post("/calculate", validate(calcSchema), async (req, res) => {
  const tariffs = await getActiveResidentialTariffs();
  const breakdown = calculateSlabBreakdown(req.body.unitsConsumed, tariffs);
  res.json(breakdown);
});

billsRouter.post("/:id/pay", async (req, res) => {
  const id = req.params.id as string;
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new NotFoundError("Bill not found");
  if (req.user!.role !== "ADMIN" && bill.userId !== req.user!.id) throw new ForbiddenError();

  const updated = await prisma.bill.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  res.json({ bill: toBillDto(updated) });
});

const regenSchema = z.object({
  body: z.object({
    meterId: z.string().min(1),
    billingMonth: z.string().regex(/^\\d{4}-\\d{2}$/),
  }),
});

billsRouter.post("/regenerate", requireRole("ADMIN"), validate(regenSchema), async (req, res) => {
  const meter = await prisma.meter.findUnique({ where: { id: req.body.meterId } });
  if (!meter) throw new NotFoundError("Meter not found");

  const monthStart = new Date(`${req.body.billingMonth}-01T00:00:00.000Z`);
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const latestInMonth = await prisma.reading.findFirst({
    where: { meterId: meter.id, readingDate: { gte: monthStart, lt: nextMonth } },
    orderBy: { readingDate: "desc" },
  });
  if (!latestInMonth) throw new NotFoundError("No readings found for this month");

  const prev = await prisma.reading.findFirst({
    where: { meterId: meter.id, readingDate: { lt: monthStart } },
    orderBy: { readingDate: "desc" },
  });
  const previousReading = prev ? Number(prev.readingValue) : Number(latestInMonth.previousReading ?? 0);
  const currentReading = Number(latestInMonth.readingValue);
  const unitsConsumed = Math.max(0, Math.round(currentReading - previousReading));

  const tariffs = await getActiveResidentialTariffs();
  const breakdown = calculateSlabBreakdown(unitsConsumed, tariffs);

  const dueDate = addDays(new Date(), env.BILL_DUE_DAYS);

  const bill = await prisma.bill.upsert({
    where: { meterId_billingMonth: { meterId: meter.id, billingMonth: req.body.billingMonth } },
    create: {
      userId: meter.userId,
      meterId: meter.id,
      billingMonth: req.body.billingMonth,
      previousReading,
      currentReading,
      unitsConsumed,
      energyCharges: breakdown.energyCharges,
      fixedCharges: breakdown.fixedCharges,
      fuelAdjustment: breakdown.fuelAdjustment,
      taxAmount: breakdown.taxAmount,
      totalAmount: breakdown.totalAmount,
      status: "ESTIMATED",
      dueDate,
      tariffSnapshot: { slabs: breakdown.slabs, meta: { fixedCharges: breakdown.fixedCharges } },
    },
    update: {
      previousReading,
      currentReading,
      unitsConsumed,
      energyCharges: breakdown.energyCharges,
      fixedCharges: breakdown.fixedCharges,
      fuelAdjustment: breakdown.fuelAdjustment,
      taxAmount: breakdown.taxAmount,
      totalAmount: breakdown.totalAmount,
      status: "ESTIMATED",
      dueDate,
      tariffSnapshot: { slabs: breakdown.slabs, meta: { fixedCharges: breakdown.fixedCharges } },
    },
  });

  res.json({ bill: toBillDto(bill), breakdown });
});

function toBillDto(b: Prisma.BillGetPayload<Record<string, never>>) {
  return {
    id: b.id,
    userId: b.userId,
    meterId: b.meterId,
    billingMonth: b.billingMonth,
    previousReading: Number(b.previousReading),
    currentReading: Number(b.currentReading),
    unitsConsumed: b.unitsConsumed,
    energyCharges: Number(b.energyCharges),
    fixedCharges: Number(b.fixedCharges),
    fuelAdjustment: Number(b.fuelAdjustment),
    taxAmount: Number(b.taxAmount),
    totalAmount: Number(b.totalAmount),
    status: b.status,
    dueDate: b.dueDate ? b.dueDate.toISOString().slice(0, 10) : undefined,
    paidAt: b.paidAt ? b.paidAt.toISOString() : undefined,
    createdAt: b.createdAt.toISOString(),
  };
}

