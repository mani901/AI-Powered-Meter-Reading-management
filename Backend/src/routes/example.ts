import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { NotFoundError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

export const exampleRouter = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
  }),
});

exampleRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

exampleRouter.post("/", validate(createSchema), async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  res.status(201).json(user);
});

exampleRouter.put("/:id", validate(updateSchema), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new NotFoundError("User not found");
  const updated = await prisma.user.update({ where: { id: user.id }, data: req.body });
  res.json(updated);
});

exampleRouter.delete("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new NotFoundError("User not found");
  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
});
