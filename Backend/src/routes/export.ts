import { Router } from "express";
import { stringify } from "csv-stringify";
import PDFDocument from "pdfkit";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Prisma } from "../generated/prisma/client.js";

export const exportRouter = Router();
exportRouter.use(requireAuth);

exportRouter.get("/readings.csv", async (req, res) => {
  const meterId = typeof req.query.meterId === "string" ? req.query.meterId : "ALL";
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const where: Prisma.ReadingWhereInput = {
    userId: req.user!.id,
    ...(meterId !== "ALL" ? { meterId } : {}),
    ...(from || to ? { readingDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
  };

  const rows = await prisma.reading.findMany({
    where,
    orderBy: { readingDate: "asc" },
    include: { meter: true },
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="readings.csv"`);

  const csv = stringify({
    header: true,
    columns: ["Date", "Meter Serial", "Meter Label", "Reading Value", "Consumption (kWh)", "Source", "Confidence Score", "Status"],
  });
  csv.pipe(res);

  for (const r of rows) {
    csv.write([
      r.readingDate.toISOString().slice(0, 10),
      r.meter.meterSerial,
      r.meter.meterLabel ?? "",
      Number(r.readingValue).toString(),
      r.consumption !== null ? Number(r.consumption).toString() : "",
      r.source,
      r.confidenceScore !== null ? r.confidenceScore.toString() : "",
      r.status,
    ]);
  }
  csv.end();
});

exportRouter.get("/readings.pdf", async (req, res) => {
  const meterId = typeof req.query.meterId === "string" ? req.query.meterId : "ALL";
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const where: Prisma.ReadingWhereInput = {
    userId: req.user!.id,
    ...(meterId !== "ALL" ? { meterId } : {}),
    ...(from || to ? { readingDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
  };

  const rows = await prisma.reading.findMany({ where, orderBy: { readingDate: "asc" }, include: { meter: true } });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="readings.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text("SmartMeter Readings Export", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown(1);
  doc.fillColor("black");

  for (const r of rows) {
    doc
      .fontSize(11)
      .text(`${r.readingDate.toISOString().slice(0, 10)}  •  ${r.meter.meterLabel ?? r.meter.meterSerial}  •  ${Number(r.readingValue)} kWh`, {
        continued: false,
      });
    doc.fontSize(9).fillColor("gray").text(`Source: ${r.source}   Status: ${r.status}   Confidence: ${r.confidenceScore ?? "—"}`);
    doc.fillColor("black").moveDown(0.6);
  }

  doc.end();
});

exportRouter.get("/bills.csv", async (req, res) => {
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const where: Prisma.BillWhereInput = {
    userId: req.user!.id,
    ...(from || to ? { billingMonth: { ...(from ? { gte: from.slice(0, 7) } : {}), ...(to ? { lte: to.slice(0, 7) } : {}) } } : {}),
  };

  const rows = await prisma.bill.findMany({ where, orderBy: { billingMonth: "asc" } });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bills.csv"`);

  const csv = stringify({
    header: true,
    columns: ["Month", "Meter", "Units Consumed", "Energy Charges", "Fixed Charges", "Tax Amount", "Total", "Status"],
  });
  csv.pipe(res);

  for (const b of rows) {
    csv.write([
      b.billingMonth,
      b.meterId,
      b.unitsConsumed,
      Number(b.energyCharges).toFixed(2),
      Number(b.fixedCharges).toFixed(2),
      Number(b.taxAmount).toFixed(2),
      Number(b.totalAmount).toFixed(2),
      b.status,
    ]);
  }
  csv.end();
});

exportRouter.get("/bills.pdf", async (req, res) => {
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const where: Prisma.BillWhereInput = {
    userId: req.user!.id,
    ...(from || to ? { billingMonth: { ...(from ? { gte: from.slice(0, 7) } : {}), ...(to ? { lte: to.slice(0, 7) } : {}) } } : {}),
  };

  const rows = await prisma.bill.findMany({ where, orderBy: { billingMonth: "asc" } });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="bills.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text("SmartMeter Bills Export");
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown(1);
  doc.fillColor("black");

  for (const b of rows) {
    doc.fontSize(11).text(`${b.billingMonth}  •  Meter: ${b.meterId}  •  Total: PKR ${Number(b.totalAmount).toFixed(0)}  •  ${b.status}`);
    doc.fontSize(9).fillColor("gray").text(`Units: ${b.unitsConsumed}   Energy: ${Number(b.energyCharges).toFixed(0)}   Tax: ${Number(b.taxAmount).toFixed(0)}`);
    doc.fillColor("black").moveDown(0.6);
  }

  doc.end();
});

exportRouter.get("/audit.csv", requireRole("ADMIN"), async (_req, res) => {
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "asc" } });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="audit.csv"`);

  const csv = stringify({
    header: true,
    columns: ["Timestamp", "UserId", "Action", "Entity", "EntityId", "Details", "IP Address", "User Agent"],
  });
  csv.pipe(res);

  for (const a of rows) {
    csv.write([
      a.createdAt.toISOString(),
      a.userId ?? "",
      a.action,
      a.entity,
      a.entityId ?? "",
      a.details ?? "",
      a.ipAddress ?? "",
      a.userAgent ?? "",
    ]);
  }
  csv.end();
});

