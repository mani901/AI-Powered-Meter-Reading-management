import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const tariffsRouter = Router();

tariffsRouter.get("/", async (req, res) => {
  const where = { isActive: true };
  const tariffs = await prisma.tariff.findMany({ where, orderBy: { minUnits: "asc" } });
  res.json({ tariffs });
});

tariffsRouter.use(requireAuth);
tariffsRouter.get("/all", requireRole("ADMIN"), async (_req, res) => {
  const tariffs = await prisma.tariff.findMany({ orderBy: { minUnits: "asc" } });
  res.json({ tariffs });
});

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    minUnits: z.number().int().min(1),
    maxUnits: z.number().int().min(1).optional(),
    ratePerUnit: z.number().nonnegative(),
    fixedCharges: z.number().nonnegative(),
    fuelAdjustment: z.number().nonnegative(),
    taxPercentage: z.number().nonnegative(),
    isActive: z.boolean(),
    effectiveFrom: z.string().min(1),
    effectiveTo: z.string().optional(),
  }),
});

tariffsRouter.post("/", requireRole("ADMIN"), validate(createSchema), async (req, res) => {
  const t = await prisma.tariff.create({
    data: {
      name: req.body.name,
      description: req.body.description ?? null,
      minUnits: req.body.minUnits,
      maxUnits: req.body.maxUnits ?? null,
      ratePerUnit: req.body.ratePerUnit,
      fixedCharges: req.body.fixedCharges,
      fuelAdjustment: req.body.fuelAdjustment,
      taxPercentage: req.body.taxPercentage,
      isActive: req.body.isActive,
      effectiveFrom: new Date(req.body.effectiveFrom),
      effectiveTo: req.body.effectiveTo ? new Date(req.body.effectiveTo) : null,
    },
  });
  res.status(201).json({ tariff: t });
});

const patchSchema = z.object({
  params: z.object({ id: z.string() }),
  body: createSchema.shape.body.partial(),
});

tariffsRouter.patch("/:id", requireRole("ADMIN"), validate(patchSchema), async (req, res) => {
  const id = req.params.id as string;
  const t = await prisma.tariff.update({
    where: { id },
    data: {
      name: req.body.name,
      description: req.body.description === undefined ? undefined : req.body.description ?? null,
      minUnits: req.body.minUnits,
      maxUnits: req.body.maxUnits === undefined ? undefined : req.body.maxUnits ?? null,
      ratePerUnit: req.body.ratePerUnit,
      fixedCharges: req.body.fixedCharges,
      fuelAdjustment: req.body.fuelAdjustment,
      taxPercentage: req.body.taxPercentage,
      isActive: req.body.isActive,
      effectiveFrom: req.body.effectiveFrom ? new Date(req.body.effectiveFrom) : undefined,
      effectiveTo: req.body.effectiveTo ? new Date(req.body.effectiveTo) : req.body.effectiveTo === null ? null : undefined,
    },
  });
  res.json({ tariff: t });
});

tariffsRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  await prisma.tariff.delete({ where: { id } });
  res.status(204).end();
});

