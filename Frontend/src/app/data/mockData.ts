import type { AuditLog, Bill, Meter, Notification, Reading, Tariff, User } from '../types';

// ==================== USERS ====================
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'admin@smartmeter.com',
    password: 'Admin@123',
    firstName: 'Ahmed',
    lastName: 'Khan',
    phone: '+92-300-1234567',
    address: '42 Clifton Block 5',
    city: 'Karachi',
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-02-21T08:30:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    totalMeters: 0,
    totalReadings: 0,
  },
  {
    id: 'u2',
    email: 'user@test.com',
    password: 'User@123',
    firstName: 'Sara',
    lastName: 'Ali',
    phone: '+92-321-9876543',
    address: 'House 12, Street 4, DHA Phase 6',
    city: 'Karachi',
    role: 'CONSUMER',
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-02-20T19:15:00Z',
    createdAt: '2024-03-10T00:00:00Z',
    totalMeters: 3,
    totalReadings: 18,
  },
  {
    id: 'u3',
    email: 'bilal@example.com',
    password: 'User@123',
    firstName: 'Bilal',
    lastName: 'Hussain',
    phone: '+92-333-5551234',
    address: 'Flat 5B, Gulshan-e-Iqbal',
    city: 'Karachi',
    role: 'CONSUMER',
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-02-18T14:22:00Z',
    createdAt: '2024-05-20T00:00:00Z',
    totalMeters: 2,
    totalReadings: 12,
  },
  {
    id: 'u4',
    email: 'fatima@example.com',
    password: 'User@123',
    firstName: 'Fatima',
    lastName: 'Malik',
    phone: '+92-311-7778899',
    address: '8 Johar Town',
    city: 'Lahore',
    role: 'CONSUMER',
    isActive: false,
    isEmailVerified: true,
    lastLoginAt: '2026-01-05T10:00:00Z',
    createdAt: '2024-06-01T00:00:00Z',
    totalMeters: 1,
    totalReadings: 6,
  },
];

// ==================== METERS ====================
export const MOCK_METERS: Meter[] = [
  {
    id: 'm1',
    userId: 'u2',
    meterSerial: 'KHI-2024-0081',
    meterLabel: 'Home Main Meter',
    meterType: 'analog',
    installationDate: '2020-03-15',
    location: 'DHA Phase 6, House 12',
    status: 'ACTIVE',
    maxDigits: 5,
    initialReading: 41000,
    lastReadingValue: 45321,
    lastReadingDate: '2026-02-15',
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'm2',
    userId: 'u2',
    meterSerial: 'KHI-2023-0055',
    meterLabel: 'Shop Meter',
    meterType: 'digital',
    installationDate: '2019-08-20',
    location: 'Tariq Road, Shop #7',
    status: 'ACTIVE',
    maxDigits: 6,
    initialReading: 8000,
    lastReadingValue: 12450,
    lastReadingDate: '2026-02-10',
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'm3',
    userId: 'u2',
    meterSerial: 'KHI-2022-0033',
    meterLabel: 'Storage Unit',
    meterType: 'analog',
    installationDate: '2018-01-10',
    location: 'SITE Area, Warehouse Block B',
    status: 'INACTIVE',
    maxDigits: 5,
    initialReading: 2000,
    lastReadingValue: 3210,
    lastReadingDate: '2025-11-30',
    createdAt: '2024-03-10T00:00:00Z',
  },
];

// ==================== READINGS ====================
export const MOCK_READINGS: Reading[] = [
  // Home Main Meter readings
  { id: 'r1', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 45321, previousReading: 45100, consumption: 221, readingDate: '2026-02-15', source: 'AI_EXTRACTED', confidenceScore: 0.94, status: 'ACCEPTED', isAnomalous: false, createdAt: '2026-02-15T10:00:00Z' },
  { id: 'r2', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 45100, previousReading: 44843, consumption: 257, readingDate: '2026-01-14', source: 'AI_EXTRACTED', confidenceScore: 0.88, status: 'ACCEPTED', isAnomalous: false, createdAt: '2026-01-14T11:30:00Z' },
  { id: 'r3', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 44843, previousReading: 44543, consumption: 300, readingDate: '2025-12-12', source: 'MANUAL', status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-12-12T09:00:00Z' },
  { id: 'r4', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 44543, previousReading: 44093, consumption: 450, readingDate: '2025-11-11', source: 'AI_EXTRACTED', confidenceScore: 0.62, status: 'FLAGGED', isAnomalous: true, anomalyReason: 'Unusually high consumption (450 kWh vs avg 280 kWh)', createdAt: '2025-11-11T14:00:00Z' },
  { id: 'r5', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 44093, previousReading: 43713, consumption: 380, readingDate: '2025-10-10', source: 'AI_EXTRACTED', confidenceScore: 0.91, status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-10-10T10:00:00Z' },
  { id: 'r6', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 43713, previousReading: 43223, consumption: 490, readingDate: '2025-09-09', source: 'AI_EXTRACTED', confidenceScore: 0.87, status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-09-09T10:00:00Z' },
  { id: 'r7', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 43223, previousReading: 42711, consumption: 512, readingDate: '2025-08-08', source: 'AI_EXTRACTED', confidenceScore: 0.79, status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-08-08T10:00:00Z' },
  { id: 'r8', meterId: 'm1', meterSerial: 'KHI-2024-0081', meterLabel: 'Home Main Meter', userId: 'u2', readingValue: 42711, previousReading: 42231, consumption: 480, readingDate: '2025-07-07', source: 'AI_CORRECTED', confidenceScore: 0.71, status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-07-07T10:00:00Z' },
  // Shop Meter readings
  { id: 'r9', meterId: 'm2', meterSerial: 'KHI-2023-0055', meterLabel: 'Shop Meter', userId: 'u2', readingValue: 12450, previousReading: 12180, consumption: 270, readingDate: '2026-02-10', source: 'AI_EXTRACTED', confidenceScore: 0.96, status: 'ACCEPTED', isAnomalous: false, createdAt: '2026-02-10T10:00:00Z' },
  { id: 'r10', meterId: 'm2', meterSerial: 'KHI-2023-0055', meterLabel: 'Shop Meter', userId: 'u2', readingValue: 12180, previousReading: 11940, consumption: 240, readingDate: '2026-01-08', source: 'AI_EXTRACTED', confidenceScore: 0.93, status: 'ACCEPTED', isAnomalous: false, createdAt: '2026-01-08T10:00:00Z' },
  { id: 'r11', meterId: 'm2', meterSerial: 'KHI-2023-0055', meterLabel: 'Shop Meter', userId: 'u2', readingValue: 11940, previousReading: 11660, consumption: 280, readingDate: '2025-12-05', source: 'MANUAL', status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-12-05T10:00:00Z' },
  { id: 'r12', meterId: 'm2', meterSerial: 'KHI-2023-0055', meterLabel: 'Shop Meter', userId: 'u2', readingValue: 11660, previousReading: 11310, consumption: 350, readingDate: '2025-11-04', source: 'AI_EXTRACTED', confidenceScore: 0.58, status: 'PENDING_REVIEW', isAnomalous: false, createdAt: '2025-11-04T10:00:00Z' },
  // Storage Unit readings
  { id: 'r13', meterId: 'm3', meterSerial: 'KHI-2022-0033', meterLabel: 'Storage Unit', userId: 'u2', readingValue: 3210, previousReading: 3160, consumption: 50, readingDate: '2025-11-30', source: 'MANUAL', status: 'ACCEPTED', isAnomalous: false, createdAt: '2025-11-30T10:00:00Z' },
];

// ==================== ANALYTICS DATA ====================
export const MONTHLY_CONSUMPTION_DATA = [
  { month: 'Mar 25', consumption: 310, cost: 6200 },
  { month: 'Apr 25', consumption: 345, cost: 7100 },
  { month: 'May 25', consumption: 420, cost: 9800 },
  { month: 'Jun 25', consumption: 468, cost: 11200 },
  { month: 'Jul 25', consumption: 480, cost: 11800 },
  { month: 'Aug 25', consumption: 512, cost: 12900 },
  { month: 'Sep 25', consumption: 490, cost: 12100 },
  { month: 'Oct 25', consumption: 380, cost: 8800 },
  { month: 'Nov 25', consumption: 450, cost: 10500 },
  { month: 'Dec 25', consumption: 300, cost: 6100 },
  { month: 'Jan 26', consumption: 257, cost: 5200 },
  { month: 'Feb 26', consumption: 221, cost: 4400 },
];

export const COMPARISON_DATA = [
  { name: 'Jan 2026', current: 257, previous: 300 },
  { name: 'Feb 2026', current: 221, previous: 257 },
];

// ==================== TARIFFS ====================
export const MOCK_TARIFFS: Tariff[] = [
  { id: 't1', name: 'Residential A-1 (1-100 units)', description: 'First 100 units slab', minUnits: 1, maxUnits: 100, ratePerUnit: 7.74, fixedCharges: 75, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: '2024-07-01' },
  { id: 't2', name: 'Residential A-1 (101-200 units)', description: 'Second 100 units slab', minUnits: 101, maxUnits: 200, ratePerUnit: 11.50, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: '2024-07-01' },
  { id: 't3', name: 'Residential A-1 (201-300 units)', description: 'Third 100 units slab', minUnits: 201, maxUnits: 300, ratePerUnit: 16.00, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: '2024-07-01' },
  { id: 't4', name: 'Residential A-1 (301-700 units)', description: 'Fourth 400 units slab', minUnits: 301, maxUnits: 700, ratePerUnit: 22.00, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: '2024-07-01' },
  { id: 't5', name: 'Residential A-1 (700+ units)', description: 'Peak consumption slab', minUnits: 701, maxUnits: undefined, ratePerUnit: 27.00, fixedCharges: 150, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: '2024-07-01' },
  { id: 't6', name: 'Commercial B-1', description: 'Commercial meter rate', minUnits: 1, maxUnits: undefined, ratePerUnit: 24.50, fixedCharges: 300, fuelAdjustment: 3.23, taxPercentage: 17, isActive: true, effectiveFrom: '2024-07-01' },
];

// ==================== BILLS ====================
export const MOCK_BILLS: Bill[] = [
  { id: 'b1', userId: 'u2', meterId: 'm1', meterLabel: 'Home Main Meter', billingMonth: '2026-02', previousReading: 45100, currentReading: 45321, unitsConsumed: 221, energyCharges: 2260, fixedCharges: 150, fuelAdjustment: 713.83, taxAmount: 545.35, totalAmount: 3669.18, status: 'ESTIMATED', dueDate: '2026-03-15', createdAt: '2026-02-16T00:00:00Z' },
  { id: 'b2', userId: 'u2', meterId: 'm1', meterLabel: 'Home Main Meter', billingMonth: '2026-01', previousReading: 44843, currentReading: 45100, unitsConsumed: 257, energyCharges: 2952, fixedCharges: 150, fuelAdjustment: 830.11, taxAmount: 666.37, totalAmount: 4598.48, status: 'CONFIRMED', dueDate: '2026-02-15', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'b3', userId: 'u2', meterId: 'm1', meterLabel: 'Home Main Meter', billingMonth: '2025-12', previousReading: 44543, currentReading: 44843, unitsConsumed: 300, energyCharges: 3650, fixedCharges: 150, fuelAdjustment: 969, taxAmount: 810.13, totalAmount: 5579.13, status: 'PAID', dueDate: '2026-01-15', paidAt: '2026-01-12T00:00:00Z', createdAt: '2025-12-13T00:00:00Z' },
  { id: 'b4', userId: 'u2', meterId: 'm1', meterLabel: 'Home Main Meter', billingMonth: '2025-11', previousReading: 44093, currentReading: 44543, unitsConsumed: 450, energyCharges: 6350, fixedCharges: 150, fuelAdjustment: 1453.5, taxAmount: 1334.5, totalAmount: 9288, status: 'PAID', dueDate: '2025-12-15', paidAt: '2025-12-10T00:00:00Z', createdAt: '2025-11-12T00:00:00Z' },
  { id: 'b5', userId: 'u2', meterId: 'm2', meterLabel: 'Shop Meter', billingMonth: '2026-02', previousReading: 12180, currentReading: 12450, unitsConsumed: 270, energyCharges: 6615, fixedCharges: 300, fuelAdjustment: 872.1, taxAmount: 1325.25, totalAmount: 9112.35, status: 'ESTIMATED', dueDate: '2026-03-15', createdAt: '2026-02-11T00:00:00Z' },
  { id: 'b6', userId: 'u2', meterId: 'm2', meterLabel: 'Shop Meter', billingMonth: '2026-01', previousReading: 11940, currentReading: 12180, unitsConsumed: 240, energyCharges: 5880, fixedCharges: 300, fuelAdjustment: 775.2, taxAmount: 1175.38, totalAmount: 8130.58, status: 'OVERDUE', dueDate: '2026-02-15', createdAt: '2026-01-09T00:00:00Z' },
];

// ==================== NOTIFICATIONS ====================
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u2', type: 'LOW_CONFIDENCE_READING', title: 'Low Confidence Reading Detected', message: 'A reading from Shop Meter has low confidence (58%). Please verify the extracted value.', isRead: false, link: '/readings', createdAt: '2026-02-16T09:00:00Z' },
  { id: 'n2', userId: 'u2', type: 'BILLING_GENERATED', title: 'Bill Generated - February 2026', message: 'Your electricity bill for Feb 2026 (Home Main Meter) is estimated at PKR 3,669.', isRead: false, link: '/billing', createdAt: '2026-02-16T08:00:00Z' },
  { id: 'n3', userId: 'u2', type: 'ABNORMAL_USAGE', title: 'Unusual Consumption Alert', message: 'Unusual consumption detected on Home Main Meter. Nov reading (450 kWh) is 160% of average (280 kWh).', isRead: false, link: '/analytics', createdAt: '2025-11-12T10:00:00Z' },
  { id: 'n4', userId: 'u2', type: 'READING_SUBMITTED', title: 'Reading Submitted Successfully', message: 'Your meter reading of 45,321 for Home Main Meter has been recorded.', isRead: true, link: '/readings', createdAt: '2026-02-15T10:30:00Z' },
  { id: 'n5', userId: 'u2', type: 'READING_REMINDER', title: 'Monthly Reading Reminder', message: "It's time to submit your meter reading for Storage Unit. Your last reading was on Nov 30, 2025.", isRead: true, link: '/readings/upload', createdAt: '2026-02-01T08:00:00Z' },
  { id: 'n6', userId: 'u2', type: 'BILLING_GENERATED', title: 'Bill Generated - January 2026', message: 'Your electricity bill for Jan 2026 (Shop Meter) is estimated at PKR 8,130. Payment is overdue!', isRead: true, link: '/billing', createdAt: '2026-01-09T08:00:00Z' },
];

// ==================== AUDIT LOGS ====================
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', userId: 'u2', userName: 'Sara Ali', action: 'READING_CREATED', entity: 'Reading', entityId: 'r1', details: 'AI extracted reading 45321 for meter KHI-2024-0081', ipAddress: '192.168.1.10', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'a2', userId: 'u2', userName: 'Sara Ali', action: 'USER_LOGIN', entity: 'User', entityId: 'u2', details: 'User logged in successfully', ipAddress: '192.168.1.10', createdAt: '2026-02-15T09:58:00Z' },
  { id: 'a3', userId: 'u1', userName: 'Ahmed Khan', action: 'READING_REVIEWED', entity: 'Reading', entityId: 'r4', details: 'Admin flagged reading reviewed - Accepted', ipAddress: '10.0.0.1', createdAt: '2026-02-14T14:30:00Z' },
  { id: 'a4', userId: 'u2', userName: 'Sara Ali', action: 'METER_ADDED', entity: 'Meter', entityId: 'm1', details: 'New meter KHI-2024-0081 registered', ipAddress: '192.168.1.10', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'a5', userId: 'u1', userName: 'Ahmed Khan', action: 'TARIFF_UPDATED', entity: 'Tariff', entityId: 't1', details: 'Updated rate for slab 1-100 units', ipAddress: '10.0.0.1', createdAt: '2026-01-15T11:00:00Z' },
  { id: 'a6', userId: 'u3', userName: 'Bilal Hussain', action: 'USER_LOGIN', entity: 'User', entityId: 'u3', details: 'User logged in successfully', ipAddress: '172.16.0.5', createdAt: '2026-02-18T14:22:00Z' },
  { id: 'a7', userId: 'u2', userName: 'Sara Ali', action: 'BILL_VIEWED', entity: 'Bill', entityId: 'b3', details: 'User viewed bill for December 2025', ipAddress: '192.168.1.10', createdAt: '2026-02-13T16:00:00Z' },
  { id: 'a8', userId: 'u1', userName: 'Ahmed Khan', action: 'USER_DEACTIVATED', entity: 'User', entityId: 'u4', details: 'Admin deactivated user account', ipAddress: '10.0.0.1', createdAt: '2026-02-10T10:00:00Z' },
];

// ==================== BILL BREAKDOWN HELPER ====================
export function calculateBillBreakdown(units: number, tariffs: Tariff[]) {
  const slabs: { slab: string; units: number; rate: number; amount: number }[] = [];
  let remainingUnits = units;
  let energyCharges = 0;
  const activeTariffs = tariffs.filter(t => t.isActive && t.name.startsWith('Residential')).sort((a, b) => a.minUnits - b.minUnits);

  for (const tariff of activeTariffs) {
    if (remainingUnits <= 0) break;
    const slabCapacity = tariff.maxUnits ? tariff.maxUnits - tariff.minUnits + 1 : remainingUnits;
    const unitsInSlab = Math.min(remainingUnits, slabCapacity);
    const amount = unitsInSlab * tariff.ratePerUnit;
    slabs.push({ slab: tariff.maxUnits ? `${tariff.minUnits}-${tariff.maxUnits}` : `${tariff.minUnits}+`, units: unitsInSlab, rate: tariff.ratePerUnit, amount });
    energyCharges += amount;
    remainingUnits -= unitsInSlab;
  }

  const fixedCharges = 150;
  const fuelAdjustment = units * 3.23;
  const subtotal = energyCharges + fixedCharges + fuelAdjustment;
  const taxAmount = subtotal * 0.17;
  const totalAmount = subtotal + taxAmount;

  return { slabs, energyCharges, fixedCharges, fuelAdjustment, taxAmount, totalAmount };
}

// ==================== ADMIN STATS ====================
export const ADMIN_STATS = {
  totalUsers: 148,
  activeUsers: 142,
  totalMeters: 213,
  activeMeters: 198,
  totalReadings: 2847,
  readingsThisMonth: 187,
  flaggedReadings: 14,
  pendingReviews: 6,
  avgConfidenceScore: 0.87,
  revenueThisMonth: 485000,
  readingsBySource: { AI_EXTRACTED: 2401, MANUAL: 310, AI_CORRECTED: 136 },
  monthlyReadingTrend: [
    { month: 'Sep 25', readings: 142 },
    { month: 'Oct 25', readings: 165 },
    { month: 'Nov 25', readings: 158 },
    { month: 'Dec 25', readings: 145 },
    { month: 'Jan 26', readings: 172 },
    { month: 'Feb 26', readings: 187 },
  ],
  confidenceDistribution: [
    { range: '90-100%', count: 1240 },
    { range: '80-90%', count: 820 },
    { range: '70-80%', count: 510 },
    { range: '60-70%', count: 180 },
    { range: '<60%', count: 97 },
  ],
};
