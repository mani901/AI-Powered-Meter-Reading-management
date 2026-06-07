import cron from "node-cron";
import { addDays } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { calculateSlabBreakdown, getActiveResidentialTariffs } from "../services/billing/tariff.service.js";
import { logger } from "../lib/logger.js";

export function startCronJobs() {
  // Mark overdue bills daily at 02:00
  cron.schedule("0 2 * * *", () => runSafe("markOverdueBills", markOverdueBills));

  // Auto-generate bills monthly on the 1st at 03:00 for previous month
  cron.schedule("0 3 1 * *", () => runSafe("generateMonthlyBills", generateMonthlyBills));

  // Reading reminders daily at 08:00
  cron.schedule("0 8 * * *", () => runSafe("sendReadingReminders", sendReadingReminders));

  // Cleanup hourly
  cron.schedule("0 * * * *", () => runSafe("cleanupTokens", cleanupTokens));

  logger.info("Cron jobs scheduled");
}

async function runSafe(name: string, fn: () => Promise<void>) {
  try {
    logger.info({ job: name }, "Cron job started");
    await fn();
    logger.info({ job: name }, "Cron job finished");
  } catch (err) {
    logger.error({ job: name, err }, "Cron job failed");
  }
}

async function markOverdueBills() {
  const now = new Date();
  await prisma.bill.updateMany({
    where: { status: { in: ["ESTIMATED", "CONFIRMED"] }, dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}

async function generateMonthlyBills() {
  const now = new Date();
  const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const billingMonth = `${prevMonth.getUTCFullYear()}-${String(prevMonth.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(`${billingMonth}-01T00:00:00.000Z`);
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const tariffs = await getActiveResidentialTariffs();
  const meters = await prisma.meter.findMany({ where: { status: "ACTIVE" } });

  for (const meter of meters) {
    const exists = await prisma.bill.findUnique({ where: { meterId_billingMonth: { meterId: meter.id, billingMonth } } });
    if (exists) continue;

    const latestInMonth = await prisma.reading.findFirst({
      where: { meterId: meter.id, readingDate: { gte: monthStart, lt: nextMonth } },
      orderBy: { readingDate: "desc" },
    });
    if (!latestInMonth) continue;

    const prev = await prisma.reading.findFirst({
      where: { meterId: meter.id, readingDate: { lt: monthStart } },
      orderBy: { readingDate: "desc" },
    });

    const previousReading = prev ? Number(prev.readingValue) : Number(latestInMonth.previousReading ?? 0);
    const currentReading = Number(latestInMonth.readingValue);
    const unitsConsumed = Math.max(0, Math.round(currentReading - previousReading));

    const breakdown = calculateSlabBreakdown(unitsConsumed, tariffs);

    await prisma.bill.create({
      data: {
        userId: meter.userId,
        meterId: meter.id,
        billingMonth,
        previousReading,
        currentReading,
        unitsConsumed,
        energyCharges: breakdown.energyCharges,
        fixedCharges: breakdown.fixedCharges,
        fuelAdjustment: breakdown.fuelAdjustment,
        taxAmount: breakdown.taxAmount,
        totalAmount: breakdown.totalAmount,
        status: "ESTIMATED",
        dueDate: addDays(new Date(), env.BILL_DUE_DAYS),
        tariffSnapshot: { slabs: breakdown.slabs },
      },
    });

    await prisma.notification.create({
      data: {
        userId: meter.userId,
        type: "BILLING_GENERATED",
        title: `Bill Generated - ${billingMonth}`,
        message: `Your electricity bill for ${billingMonth} has been generated.`,
        isRead: false,
        link: "/billing",
      },
    });
  }
}

async function sendReadingReminders() {
  const now = new Date();
  const day = now.getUTCDate();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const users = await prisma.user.findMany({
    where: { isActive: true, settings: { is: { readingReminders: true } } },
    include: { settings: true },
  });

  for (const u of users) {
    const reminderDay = u.settings?.reminderDay ?? 1;
    if (reminderDay !== day) continue;

    const hasReading = await prisma.reading.findFirst({
      where: { userId: u.id, readingDate: { gte: monthStart } },
    });
    if (hasReading) continue;

    const hasActiveMeters = await prisma.meter.count({ where: { userId: u.id, status: "ACTIVE" } });
    if (!hasActiveMeters) continue;

    await prisma.notification.create({
      data: {
        userId: u.id,
        type: "READING_REMINDER",
        title: "Monthly Reading Reminder",
        message: "It's time to submit your meter reading for this month.",
        isRead: false,
        link: "/readings/upload",
      },
    });
  }
}

async function cleanupTokens() {
  const now = new Date();
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
    },
  });
}

