import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import type { DisputeStatus } from "../generated/prisma/client.js";

export const disputesRouter = Router();
disputesRouter.use(requireAuth);

// POST /api/disputes/ — consumer files a dispute
const createDisputeSchema = z.object({
  body: z.object({
    meterId: z.string().min(1),
    readingId: z.string().optional(),
    subject: z.string().min(3).max(200),
    description: z.string().min(10).max(2000),
  }),
});

disputesRouter.post("/", requireRole(["CONSUMER"]), validate(createDisputeSchema), async (req, res) => {
  const meter = await prisma.meter.findUnique({ where: { id: req.body.meterId } });
  if (!meter) throw new NotFoundError("Meter not found");
  if (meter.userId !== req.user!.id) throw new ForbiddenError("You can only file disputes for your own meters");

  const dispute = await prisma.dispute.create({
    data: {
      userId: req.user!.id,
      meterId: req.body.meterId,
      readingId: req.body.readingId ?? null,
      subject: req.body.subject.trim(),
      description: req.body.description.trim(),
      status: "OPEN",
    },
    include: {
      meter: { select: { meterSerial: true, meterLabel: true } },
    },
  });

  res.status(201).json({ dispute });
});

// GET /api/disputes/ — consumer sees own; admin sees all
disputesRouter.get("/", async (req, res) => {
  const { page, limit, skip } = toPagination(req.query);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const isAdmin = req.user!.role === "ADMIN";

  const where = {
    ...(isAdmin ? {} : { userId: req.user!.id }),
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
        meter: { select: { id: true, meterSerial: true, meterLabel: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  res.json(toPaginatedResponse({ data: rows, page, limit, total }));
});

// GET /api/disputes/:id
disputesRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      meter: { select: { id: true, meterSerial: true, meterLabel: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!dispute) throw new NotFoundError("Dispute not found");
  if (req.user!.role !== "ADMIN" && dispute.userId !== req.user!.id) throw new ForbiddenError();
  res.json({ dispute });
});
