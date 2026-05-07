import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/apiClient';
import type { Dispute } from '../types';

export function useDisputes(isAdmin = false) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Dispute[] }>(
        isAdmin ? '/api/admin/disputes?limit=200' : '/api/disputes?limit=200'
      );
      setDisputes(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  const fileDispute = useCallback(async (input: {
    meterId: string;
    readingId?: string;
    subject: string;
    description: string;
  }) => {
    const res = await apiFetch<{ dispute: Dispute }>('/api/disputes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setDisputes(prev => [res.dispute, ...prev]);
    return res.dispute;
  }, []);

  const updateDispute = useCallback(async (id: string, updates: { status?: string; adminNotes?: string }) => {
    const res = await apiFetch<{ dispute: Dispute }>(`/api/admin/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setDisputes(prev => prev.map(d => d.id === id ? res.dispute : d));
    return res.dispute;
  }, []);

  return { disputes, loading, fileDispute, updateDispute, refresh: fetchDisputes };
}
