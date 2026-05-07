import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/apiClient';
import type { StaffMeterAssignment } from '../types';

interface StaffDashboard {
  assignedMeters: number;
  totalSubmitted: number;
  submittedToday: number;
  pendingReviews: number;
  approved: number;
  rejected: number;
}

interface StaffReading {
  id: string;
  meterId: string;
  meterSerial: string;
  meterLabel?: string;
  meterOwner?: string;
  readingValue: number;
  previousReading?: number;
  consumption?: number;
  readingDate: string;
  imageUrl?: string;
  source: string;
  confidenceScore?: number;
  status: string;
  isAnomalous: boolean;
  anomalyReason?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface UploadResult {
  readingValue: number;
  confidenceScore: number;
  imageUrl: string;
  imagePublicId: string;
  previousReading?: number;
  consumption?: number;
  isAnomalous: boolean;
  anomalyReason?: string;
}

interface SubmitReadingInput {
  meterId: string;
  readingValue: number;
  readingDate: string;
  source: 'AI_EXTRACTED' | 'AI_CORRECTED' | 'MANUAL';
  confidenceScore?: number;
  imageUrl?: string;
  imagePublicId?: string;
}

export function useStaff() {
  const [dashboard, setDashboard] = useState<StaffDashboard | null>(null);
  const [assignedMeters, setAssignedMeters] = useState<StaffMeterAssignment[]>([]);
  const [submissions, setSubmissions] = useState<StaffReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, metersRes, readingsRes] = await Promise.all([
        apiFetch<StaffDashboard>('/api/staff/dashboard'),
        apiFetch<{ data: StaffMeterAssignment[] }>('/api/staff/meters?limit=200'),
        apiFetch<{ data: StaffReading[] }>('/api/staff/readings?limit=200'),
      ]);
      setDashboard(dashRes);
      setAssignedMeters(metersRes.data);
      setSubmissions(readingsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const uploadReadingImage = useCallback(async (meterId: string, file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('meterId', meterId);
    return apiFetch<UploadResult>('/api/readings/upload', { method: 'POST', body: formData });
  }, []);

  const submitReading = useCallback(async (input: SubmitReadingInput) => {
    const endpoint = input.source === 'MANUAL' ? '/api/readings/manual' : '/api/readings';
    const payload = input.source === 'MANUAL'
      ? { meterId: input.meterId, readingValue: input.readingValue, readingDate: input.readingDate }
      : { ...input };
    const res = await apiFetch<{ reading: StaffReading }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSubmissions(prev => [res.reading, ...prev]);
    await fetchAll();
    return res.reading;
  }, [fetchAll]);

  const recentSubmissions = submissions.slice(0, 10);

  return {
    dashboard,
    assignedMeters,
    submissions,
    recentSubmissions,
    loading,
    uploadReadingImage,
    submitReading,
    refresh: fetchAll,
  };
}
