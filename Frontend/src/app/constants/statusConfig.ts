import type { NotificationType, ReadingSource, ReadingStatus, MeterStatus } from '../types';

export const READING_STATUS_BADGE: Record<ReadingStatus, string> = {
  ACCEPTED: 'bg-green-100 text-green-700',
  FLAGGED: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING_REVIEW: 'bg-purple-100 text-purple-700',
};

export const READING_SOURCE_BADGE: Record<ReadingSource, string> = {
  AI_EXTRACTED: 'bg-blue-100 text-blue-700',
  MANUAL: 'bg-slate-100 text-slate-600',
  AI_CORRECTED: 'bg-indigo-100 text-indigo-700',
};

export const METER_STATUS_BADGE: Record<MeterStatus, string> = {
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  ACTIVE: 'text-green-600 bg-green-50 border-green-200',
  INACTIVE: 'text-slate-600 bg-slate-100 border-slate-200',
  FAULTY: 'text-red-600 bg-red-50 border-red-200',
  REJECTED: 'text-red-700 bg-red-100 border-red-300',
};

export const NOTIFICATION_TYPE_STYLES: Record<
  NotificationType,
  { color: string; bg: string; border: string }
> = {
  READING_REMINDER: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  ABNORMAL_USAGE: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  BILLING_GENERATED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  LOW_CONFIDENCE_READING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  SYSTEM_ALERT: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  READING_SUBMITTED: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  ACCOUNT_APPROVED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  ACCOUNT_REJECTED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  METER_APPROVED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  METER_REJECTED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export const AUDIT_ACTION_BADGE: Record<string, string> = {
  READING_CREATED: 'bg-blue-100 text-blue-700',
  USER_LOGIN: 'bg-green-100 text-green-700',
  READING_REVIEWED: 'bg-purple-100 text-purple-700',
  METER_ADDED: 'bg-indigo-100 text-indigo-700',
  TARIFF_UPDATED: 'bg-amber-100 text-amber-700',
  BILL_VIEWED: 'bg-slate-100 text-slate-700',
  USER_DEACTIVATED: 'bg-red-100 text-red-700',
};

