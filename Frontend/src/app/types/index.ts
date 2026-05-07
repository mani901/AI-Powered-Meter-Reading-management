export type UserRole = 'ADMIN' | 'CONSUMER';
export type MeterStatus = 'ACTIVE' | 'INACTIVE' | 'FAULTY';
export type ReadingSource = 'AI_EXTRACTED' | 'MANUAL' | 'AI_CORRECTED';
export type ReadingStatus = 'ACCEPTED' | 'FLAGGED' | 'REJECTED' | 'PENDING_REVIEW';
export type BillStatus = 'ESTIMATED' | 'CONFIRMED' | 'PAID' | 'OVERDUE';
export type NotificationType =
  | 'READING_REMINDER'
  | 'ABNORMAL_USAGE'
  | 'BILLING_GENERATED'
  | 'LOW_CONFIDENCE_READING'
  | 'SYSTEM_ALERT'
  | 'READING_SUBMITTED';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  totalMeters?: number;
  totalReadings?: number;
}

export interface Meter {
  id: string;
  userId: string;
  meterSerial: string;
  meterLabel?: string;
  meterType: 'analog' | 'digital';
  installationDate?: string;
  location?: string;
  status: MeterStatus;
  maxDigits: number;
  initialReading?: number;
  lastReadingValue?: number;
  lastReadingDate?: string;
  createdAt: string;
}

export interface Reading {
  id: string;
  meterId: string;
  meterSerial?: string;
  meterLabel?: string;
  userId: string;
  readingValue: number;
  previousReading?: number;
  consumption?: number;
  readingDate: string;
  imageUrl?: string;
  source: ReadingSource;
  confidenceScore?: number;
  status: ReadingStatus;
  isAnomalous: boolean;
  anomalyReason?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface Tariff {
  id: string;
  name: string;
  description?: string;
  minUnits: number;
  maxUnits?: number;
  ratePerUnit: number;
  fixedCharges: number;
  fuelAdjustment: number;
  taxPercentage: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Bill {
  id: string;
  userId: string;
  meterId: string;
  meterLabel?: string;
  billingMonth: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  energyCharges: number;
  fixedCharges: number;
  fuelAdjustment: number;
  taxAmount: number;
  totalAmount: number;
  status: BillStatus;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

