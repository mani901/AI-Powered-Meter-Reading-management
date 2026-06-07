import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/apiClient';
import { useApp } from '../context/AppContext';
import type { User, Meter, Reading, Bill, Tariff, StaffMember, Dispute } from '../types';

export function useAdmin() {
  const { users, meters, readings, bills, tariffs, updateUserRole, updateUserStatus, updateTariff, addTariff, deleteTariff } = useApp();

  const createUser = useCallback(async (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    role: 'FIELD_STAFF' | 'CONSUMER';
  }) => {
    const res = await apiFetch<{ user: User }>('/api/admin/users/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.user;
  }, []);

  const assignMeterOwner = useCallback(async (meterId: string, consumerId: string) => {
    return apiFetch(`/api/admin/meters/${meterId}/assign-owner`, {
      method: 'POST',
      body: JSON.stringify({ consumerId }),
    });
  }, []);

  const assignMeterStaff = useCallback(async (meterId: string, staffId: string) => {
    return apiFetch(`/api/admin/meters/${meterId}/assign-staff`, {
      method: 'POST',
      body: JSON.stringify({ staffId }),
    });
  }, []);

  const unassignMeterStaff = useCallback(async (meterId: string, staffId: string) => {
    return apiFetch(`/api/admin/meters/${meterId}/unassign-staff/${staffId}`, { method: 'DELETE' });
  }, []);

  const createMeter = useCallback(async (input: {
    meterSerial: string;
    meterLabel?: string;
    meterType: 'analog' | 'digital';
    installationDate?: string;
    location?: string;
    maxDigits?: number;
    initialReading?: number;
    consumerId?: string;
  }) => {
    const res = await apiFetch<{ meter: Meter }>('/api/admin/meters', {
      method: 'POST',
      body: JSON.stringify({ ...input, maxDigits: input.maxDigits ?? 5 }),
    });
    return res.meter;
  }, []);

  const updateMeter = useCallback(async (id: string, updates: Partial<Meter>) => {
    const res = await apiFetch<{ meter: Meter }>(`/api/meters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.meter;
  }, []);

  const deactivateMeter = useCallback(async (id: string) => {
    return apiFetch(`/api/meters/${id}`, { method: 'DELETE' });
  }, []);

  const reviewReading = useCallback(async (id: string, action: 'ACCEPT' | 'REJECT', notes?: string) => {
    const res = await apiFetch<{ reading: Reading }>(`/api/readings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
    return res.reading;
  }, []);

  return {
    users,
    meters,
    readings,
    bills,
    tariffs,
    updateUserRole,
    updateUserStatus,
    updateTariff,
    addTariff,
    deleteTariff,
    createUser,
    assignMeterOwner,
    assignMeterStaff,
    unassignMeterStaff,
    createMeter,
    updateMeter,
    deactivateMeter,
    reviewReading,
  };
}

export function useAdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: StaffMember[] }>('/api/admin/staff?limit=200');
      setStaff(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  return { staff, loading, refresh: fetchStaff };
}

export function useAdminMeters() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Meter[] }>('/api/meters?limit=500');
      setMeters(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMeters();
  }, [fetchMeters]);

  return { meters, loading, refresh: fetchMeters };
}

export function useAdminReadings() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReadings = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const query = status && status !== 'ALL' ? `?status=${status}&limit=200` : '?limit=200';
      const res = await apiFetch<{ data: Reading[] }>(`/api/readings${query}`);
      setReadings(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReadings('PENDING_REVIEW');
  }, [fetchReadings]);

  const reviewReading = useCallback(async (id: string, action: 'ACCEPT' | 'REJECT', notes?: string) => {
    const res = await apiFetch<{ reading: Reading }>(`/api/readings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
    setReadings(prev => prev.map(r => r.id === id ? res.reading : r));
    return res.reading;
  }, []);

  return { readings, loading, fetchReadings, reviewReading };
}

export function useAdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Dispute[] }>('/api/admin/disputes?limit=200');
      setDisputes(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  const updateDispute = useCallback(async (id: string, updates: { status?: string; adminNotes?: string }) => {
    const res = await apiFetch<{ dispute: Dispute }>(`/api/admin/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setDisputes(prev => prev.map(d => d.id === id ? res.dispute : d));
    return res.dispute;
  }, []);

  return { disputes, loading, updateDispute, refresh: fetchDisputes };
}
