import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, MeterStatus, MeterType, ReadingSource, ReadingStatus, BillStatus, NotificationType, DisputeStatus } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

  // Idempotent reset (dev/demo only)
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.staffMeterAssignment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.meter.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash("Admin@123", rounds);
  const userPass = await bcrypt.hash("User@123", rounds);
  const staffPass = await bcrypt.hash("Staff@123", rounds);

  const admin = await prisma.user.create({
    data: {
      email: "admin@smartmeter.com",
      passwordHash: adminPass,
      firstName: "Ahmed",
      lastName: "Khan",
      phone: "+92-300-1234567",
      address: "42 Clifton Block 5",
      city: "Karachi",
      role: UserRole.ADMIN,
      isActive: true,
      isPendingApproval: false,
      isEmailVerified: true,
      lastLoginAt: new Date("2026-02-21T08:30:00Z"),
      settings: { create: {} },
    },
  });

  const consumer = await prisma.user.create({
    data: {
      email: "user@test.com",
      passwordHash: userPass,
      firstName: "Sara",
      lastName: "Ali",
      phone: "+92-321-9876543",
      address: "House 12, Street 4, DHA Phase 6",
      city: "Karachi",
      role: UserRole.CONSUMER,
      isActive: true,
      isPendingApproval: false,
      isEmailVerified: true,
      lastLoginAt: new Date("2026-02-20T19:15:00Z"),
      settings: { create: {} },
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@test.com",
      passwordHash: staffPass,
      firstName: "Bilal",
      lastName: "Hussain",
      phone: "+92-333-5551234",
      address: "Flat 3, Block 9, Gulshan-e-Iqbal",
      city: "Karachi",
      role: UserRole.FIELD_STAFF,
      isActive: true,
      isPendingApproval: false,
      isEmailVerified: true,
      lastLoginAt: new Date("2026-02-21T07:00:00Z"),
      settings: { create: {} },
    },
  });

  const meter1 = await prisma.meter.create({
    data: {
      userId: consumer.id,
      meterSerial: "KHI-2024-0081",
      meterLabel: "Home Main Meter",
      meterType: MeterType.ANALOG,
      installationDate: new Date("2020-03-15"),
      location: "DHA Phase 6, House 12",
      status: MeterStatus.ACTIVE,
      maxDigits: 5,
      initialReading: 41000,
      lastReadingValue: 45321,
      lastReadingDate: new Date("2026-02-15"),
    },
  });

  const meter2 = await prisma.meter.create({
    data: {
      userId: consumer.id,
      meterSerial: "KHI-2023-0055",
      meterLabel: "Shop Meter",
      meterType: MeterType.DIGITAL,
      installationDate: new Date("2019-08-20"),
      location: "Tariq Road, Shop #7",
      status: MeterStatus.ACTIVE,
      maxDigits: 6,
      initialReading: 8000,
      lastReadingValue: 12450,
      lastReadingDate: new Date("2026-02-10"),
    },
  });

  const meter3 = await prisma.meter.create({
    data: {
      userId: consumer.id,
      meterSerial: "KHI-2022-0033",
      meterLabel: "Storage Unit",
      meterType: MeterType.ANALOG,
      installationDate: new Date("2018-01-10"),
      location: "SITE Area, Warehouse Block B",
      status: MeterStatus.INACTIVE,
      maxDigits: 5,
      initialReading: 2000,
      lastReadingValue: 3210,
      lastReadingDate: new Date("2025-11-30"),
    },
  });

  // Tariffs (from frontend mock)
  const tariffs = await prisma.tariff.createMany({
    data: [
      { name: "Residential A-1 (1-100 units)", description: "First 100 units slab", minUnits: 1, maxUnits: 100, ratePerUnit: 7.74, fixedCharges: 75, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: new Date("2024-07-01") },
      { name: "Residential A-1 (101-200 units)", description: "Second 100 units slab", minUnits: 101, maxUnits: 200, ratePerUnit: 11.5, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: new Date("2024-07-01") },
      { name: "Residential A-1 (201-300 units)", description: "Third 100 units slab", minUnits: 201, maxUnits: 300, ratePerUnit: 16, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: new Date("2024-07-01") },
      { name: "Residential A-1 (301-700 units)", description: "Fourth 400 units slab", minUnits: 301, maxUnits: 700, ratePerUnit: 22, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: new Date("2024-07-01") },
      { name: "Residential A-1 (700+ units)", description: "Peak consumption slab", minUnits: 701, maxUnits: null, ratePerUnit: 27, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: new Date("2024-07-01") },
      { name: "Commercial B-1", description: "Commercial meter rate", minUnits: 1, maxUnits: null, ratePerUnit: 24.5, fixedCharges: 300, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: new Date("2024-07-01") },
    ],
  });
  void tariffs;

  // Assign staff to meters 1 and 2
  await prisma.staffMeterAssignment.createMany({
    data: [
      { staffId: staff.id, meterId: meter1.id, isActive: true },
      { staffId: staff.id, meterId: meter2.id, isActive: true },
    ],
  });

  await prisma.reading.createMany({
    data: [
      // Staff-submitted readings (userId = staff)
      { userId: staff.id, meterId: meter1.id, readingValue: 45321, previousReading: 45100, consumption: 221, readingDate: new Date("2026-02-15"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.94, status: ReadingStatus.ACCEPTED, isAnomalous: false },
      { userId: staff.id, meterId: meter1.id, readingValue: 45100, previousReading: 44843, consumption: 257, readingDate: new Date("2026-01-14"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.88, status: ReadingStatus.ACCEPTED, isAnomalous: false },
      { userId: staff.id, meterId: meter1.id, readingValue: 44843, previousReading: 44543, consumption: 300, readingDate: new Date("2025-12-12"), source: ReadingSource.MANUAL, status: ReadingStatus.ACCEPTED, isAnomalous: false },
      { userId: staff.id, meterId: meter1.id, readingValue: 44543, previousReading: 44093, consumption: 450, readingDate: new Date("2025-11-11"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.62, status: ReadingStatus.FLAGGED, isAnomalous: true, anomalyReason: "Unusually high consumption (450 kWh vs avg 280 kWh)" },
      { userId: staff.id, meterId: meter1.id, readingValue: 44093, previousReading: 43713, consumption: 380, readingDate: new Date("2025-10-10"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.91, status: ReadingStatus.ACCEPTED, isAnomalous: false },

      { userId: staff.id, meterId: meter2.id, readingValue: 12450, previousReading: 12180, consumption: 270, readingDate: new Date("2026-02-10"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.96, status: ReadingStatus.ACCEPTED, isAnomalous: false },
      { userId: staff.id, meterId: meter2.id, readingValue: 12180, previousReading: 11940, consumption: 240, readingDate: new Date("2026-01-08"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.93, status: ReadingStatus.ACCEPTED, isAnomalous: false },
      { userId: staff.id, meterId: meter2.id, readingValue: 11940, previousReading: 11660, consumption: 280, readingDate: new Date("2025-12-05"), source: ReadingSource.MANUAL, status: ReadingStatus.ACCEPTED, isAnomalous: false },
      { userId: staff.id, meterId: meter2.id, readingValue: 11660, previousReading: 11310, consumption: 350, readingDate: new Date("2025-11-04"), source: ReadingSource.AI_EXTRACTED, confidenceScore: 0.58, status: ReadingStatus.PENDING_REVIEW, isAnomalous: false },

      { userId: staff.id, meterId: meter3.id, readingValue: 3210, previousReading: 3160, consumption: 50, readingDate: new Date("2025-11-30"), source: ReadingSource.MANUAL, status: ReadingStatus.ACCEPTED, isAnomalous: false },
    ],
  });

  await prisma.bill.createMany({
    data: [
      { userId: consumer.id, meterId: meter1.id, billingMonth: "2026-02", previousReading: 45100, currentReading: 45321, unitsConsumed: 221, energyCharges: 2260, fixedCharges: 150, fuelAdjustment: 713.83, taxAmount: 545.35, totalAmount: 3669.18, status: BillStatus.ESTIMATED, dueDate: new Date("2026-03-15") },
      { userId: consumer.id, meterId: meter1.id, billingMonth: "2026-01", previousReading: 44843, currentReading: 45100, unitsConsumed: 257, energyCharges: 2952, fixedCharges: 150, fuelAdjustment: 830.11, taxAmount: 666.37, totalAmount: 4598.48, status: BillStatus.CONFIRMED, dueDate: new Date("2026-02-15") },
      { userId: consumer.id, meterId: meter2.id, billingMonth: "2026-02", previousReading: 12180, currentReading: 12450, unitsConsumed: 270, energyCharges: 6615, fixedCharges: 300, fuelAdjustment: 872.1, taxAmount: 1325.25, totalAmount: 9112.35, status: BillStatus.ESTIMATED, dueDate: new Date("2026-03-15") },
      { userId: consumer.id, meterId: meter2.id, billingMonth: "2026-01", previousReading: 11940, currentReading: 12180, unitsConsumed: 240, energyCharges: 5880, fixedCharges: 300, fuelAdjustment: 775.2, taxAmount: 1175.38, totalAmount: 8130.58, status: BillStatus.OVERDUE, dueDate: new Date("2026-02-15") },
    ],
  });

  await prisma.dispute.createMany({
    data: [
      {
        userId: consumer.id,
        meterId: meter1.id,
        subject: "Wrong reading recorded for November",
        description: "The November reading shows 450 kWh which is much higher than my usual consumption of around 280 kWh. I was on vacation that month and the house was empty. Please re-check.",
        status: DisputeStatus.UNDER_REVIEW,
        adminNotes: "Flagged reading under investigation. Field staff has been asked to re-visit.",
        createdAt: new Date("2025-11-13T10:00:00Z"),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: consumer.id, type: NotificationType.LOW_CONFIDENCE_READING, title: "Low Confidence Reading Detected", message: "A reading from Shop Meter has low confidence (58%). Please verify the extracted value.", isRead: false, link: "/readings", createdAt: new Date("2026-02-16T09:00:00Z") },
      { userId: consumer.id, type: NotificationType.BILLING_GENERATED, title: "Bill Generated - February 2026", message: "Your electricity bill for Feb 2026 (Home Main Meter) is estimated at PKR 3,669.", isRead: false, link: "/billing", createdAt: new Date("2026-02-16T08:00:00Z") },
      { userId: consumer.id, type: NotificationType.ABNORMAL_USAGE, title: "Unusual Consumption Alert", message: "Unusual consumption detected on Home Main Meter. Nov reading (450 kWh) is 160% of average (280 kWh).", isRead: false, link: "/analytics", createdAt: new Date("2025-11-12T10:00:00Z") },
      { userId: consumer.id, type: NotificationType.READING_SUBMITTED, title: "Reading Submitted Successfully", message: "Your meter reading of 45,321 for Home Main Meter has been recorded.", isRead: true, link: "/readings", createdAt: new Date("2026-02-15T10:30:00Z") },
      { userId: consumer.id, type: NotificationType.READING_REMINDER, title: "Monthly Reading Reminder", message: "It's time to submit your meter reading for Storage Unit. Your last reading was on Nov 30, 2025.", isRead: true, link: "/readings/upload", createdAt: new Date("2026-02-01T08:00:00Z") },
      { userId: consumer.id, type: NotificationType.BILLING_GENERATED, title: "Bill Generated - January 2026", message: "Your electricity bill for Jan 2026 (Shop Meter) is estimated at PKR 8,130. Payment is overdue!", isRead: true, link: "/billing", createdAt: new Date("2026-01-09T08:00:00Z") },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: consumer.id, action: "READING_CREATED", entity: "Reading", details: "AI extracted reading 45321 for meter KHI-2024-0081", ipAddress: "192.168.1.10", userAgent: "seed", createdAt: new Date("2026-02-15T10:00:00Z") },
      { userId: consumer.id, action: "USER_LOGIN", entity: "User", details: "User logged in successfully", ipAddress: "192.168.1.10", userAgent: "seed", createdAt: new Date("2026-02-15T09:58:00Z") },
      { userId: admin.id, action: "READING_REVIEWED", entity: "Reading", details: "Admin flagged reading reviewed - Accepted", ipAddress: "10.0.0.1", userAgent: "seed", createdAt: new Date("2026-02-14T14:30:00Z") },
      { userId: consumer.id, action: "METER_ADDED", entity: "Meter", details: "New meter KHI-2024-0081 registered", ipAddress: "192.168.1.10", userAgent: "seed", createdAt: new Date("2026-01-20T09:00:00Z") },
      { userId: admin.id, action: "TARIFF_UPDATED", entity: "Tariff", details: "Updated rate for slab 1-100 units", ipAddress: "10.0.0.1", userAgent: "seed", createdAt: new Date("2026-01-15T11:00:00Z") },
      { userId: consumer.id, action: "BILL_VIEWED", entity: "Bill", details: "User viewed bill for December 2025", ipAddress: "192.168.1.10", userAgent: "seed", createdAt: new Date("2026-02-13T16:00:00Z") },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

