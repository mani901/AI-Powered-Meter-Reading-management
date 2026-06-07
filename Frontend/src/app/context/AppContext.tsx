import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User, Meter, Reading, Notification, Bill, Tariff, UserRole } from '../types';
import { apiFetch, loginRequest, logoutRequest, refreshAccessToken } from '../lib/apiClient';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  meters: Meter[];
  readings: Reading[];
  notifications: Notification[];
  bills: Bill[];
  tariffs: Tariff[];
  pendingUsersCount: number;
  pendingMetersCount: number;
  unreadCount: number;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  loadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  addMeter: (meter: Omit<Meter, 'id' | 'createdAt'>) => Promise<Meter>;
  updateMeter: (id: string, updates: Partial<Meter>) => Promise<void>;
  deleteMeter: (id: string) => Promise<void>;
  addReading: (reading: Omit<Reading, 'id' | 'createdAt'>) => Promise<Reading>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  updateTariff: (id: string, updates: Partial<Tariff>) => Promise<void>;
  addTariff: (tariff: Omit<Tariff, 'id'>) => Promise<void>;
  deleteTariff: (id: string) => Promise<void>;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string, reason?: string) => Promise<void>;
  approveMeter: (meterId: string) => Promise<void>;
  rejectMeter: (meterId: string, reason?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [pendingMetersCount, setPendingMetersCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const unreadCount = notifications.filter(n => !n.isRead && n.userId === currentUser?.id).length;

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    const [metersRes, notificationsRes, tariffsRes] = await Promise.all([
      apiFetch<{ data: Meter[] }>('/api/meters?limit=200'),
      apiFetch<{ data: Notification[] }>('/api/notifications?limit=100'),
      apiFetch<{ tariffs: Tariff[] }>(currentUser.role === 'ADMIN' ? '/api/tariffs/all' : '/api/tariffs'),
    ]);
    setMeters(metersRes.data);
    setNotifications(notificationsRes.data);
    setTariffs(tariffsRes.tariffs ?? []);

    if (currentUser.role !== 'FIELD_STAFF') {
      const [readingsRes, billsRes] = await Promise.all([
        apiFetch<{ data: Reading[] }>('/api/readings?limit=500'),
        apiFetch<{ data: Bill[] }>('/api/bills?limit=200'),
      ]);
      setReadings(readingsRes.data);
      setBills(billsRes.data);
    }

    if (currentUser.role === 'ADMIN') {
      const [usersRes, pendingUsersRes] = await Promise.all([
        apiFetch<{ data: User[] }>('/api/admin/users?limit=500'),
        apiFetch<{ total: number }>('/api/admin/users/pending?limit=1'),
      ]);
      setUsers(usersRes.data);
      setPendingUsersCount(pendingUsersRes.total ?? 0);
    } else {
      setUsers([currentUser]);
    }
  }, [currentUser]);

  useEffect(() => {
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (!token) {
          setCurrentUser(null);
          return;
        }
        const me = await apiFetch<{ user: User }>('/api/users/me');
        setCurrentUser(me.user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoadingAuth(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMeters([]);
      setReadings([]);
      setNotifications([]);
      setBills([]);
      setTariffs([]);
      setUsers([]);
      return;
    }
    void refreshData();
  }, [currentUser, refreshData]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginRequest(email, password);
      setCurrentUser(res.user as User);
      await refreshData();
      return { success: true, message: 'Login successful', role: (res.user as User).role };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Login failed', role: undefined };
    }
  }, [refreshData]);

  const logout = useCallback(async () => {
    await logoutRequest();
    setCurrentUser(null);
  }, []);

  const addMeter = useCallback(async (meterData: Omit<Meter, 'id' | 'createdAt'>) => {
    const res = await apiFetch<{ meter: Meter }>('/api/meters', {
      method: 'POST',
      body: JSON.stringify({
        meterSerial: meterData.meterSerial,
        meterLabel: meterData.meterLabel,
        meterType: meterData.meterType,
        installationDate: meterData.installationDate,
        location: meterData.location,
        status: meterData.status,
        maxDigits: meterData.maxDigits,
        initialReading: meterData.initialReading,
      }),
    });
    setMeters(prev => [res.meter, ...prev]);
    return res.meter;
  }, []);

  const updateMeter = useCallback(async (id: string, updates: Partial<Meter>) => {
    const res = await apiFetch<{ meter: Meter }>(`/api/meters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setMeters(prev => prev.map(m => m.id === id ? res.meter : m));
  }, []);

  const deleteMeter = useCallback(async (id: string) => {
    await apiFetch(`/api/meters/${id}`, { method: 'DELETE' });
    setMeters(prev => prev.filter(m => m.id !== id));
  }, []);

  const addReading = useCallback(async (readingData: Omit<Reading, 'id' | 'createdAt'>) => {
    const endpoint = readingData.source === 'MANUAL' ? '/api/readings/manual' : '/api/readings';
    const payload = readingData.source === 'MANUAL'
      ? {
          meterId: readingData.meterId,
          readingValue: readingData.readingValue,
          readingDate: readingData.readingDate,
        }
      : {
          meterId: readingData.meterId,
          readingValue: readingData.readingValue,
          readingDate: readingData.readingDate,
          imageUrl: readingData.imageUrl,
          source: readingData.source,
          confidenceScore: readingData.confidenceScore,
        };

    const res = await apiFetch<{ reading: Reading }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setReadings(prev => [res.reading, ...prev]);
    await refreshData();
    return res.reading;
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, isRead: true } : n));
  }, [currentUser]);

  const deleteNotification = useCallback(async (id: string) => {
    await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback(async (_n: Omit<Notification, 'id' | 'createdAt'>) => {}, []);

  const updateTariff = useCallback(async (id: string, updates: Partial<Tariff>) => {
    const res = await apiFetch<{ tariff: Tariff }>(`/api/tariffs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setTariffs(prev => prev.map(t => t.id === id ? res.tariff : t));
  }, []);

  const addTariff = useCallback(async (tariffData: Omit<Tariff, 'id'>) => {
    const res = await apiFetch<{ tariff: Tariff }>('/api/tariffs', {
      method: 'POST',
      body: JSON.stringify(tariffData),
    });
    setTariffs(prev => [...prev, res.tariff]);
  }, []);

  const deleteTariff = useCallback(async (id: string) => {
    await apiFetch(`/api/tariffs/${id}`, { method: 'DELETE' });
    setTariffs(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    const res = await apiFetch<{ user: User }>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setCurrentUser(res.user);
    setUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
  }, [currentUser]);

  const updateUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    await apiFetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    await apiFetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, []);

  const approveUser = useCallback(async (userId: string) => {
    await apiFetch(`/api/admin/users/${userId}/approve`, { method: 'POST' });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true, isPendingApproval: false } : u));
    setPendingUsersCount(prev => Math.max(0, prev - 1));
  }, []);

  const rejectUser = useCallback(async (userId: string, reason?: string) => {
    await apiFetch(`/api/admin/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false, isPendingApproval: false, rejectionReason: reason } : u));
    setPendingUsersCount(prev => Math.max(0, prev - 1));
  }, []);

  const approveMeter = useCallback(async (meterId: string) => {
    await apiFetch(`/api/admin/meters/${meterId}/approve`, { method: 'POST' });
    setMeters(prev => prev.map(m => m.id === meterId ? { ...m, status: 'ACTIVE' as const } : m));
    setPendingMetersCount(prev => Math.max(0, prev - 1));
  }, []);

  const rejectMeter = useCallback(async (meterId: string, reason?: string) => {
    await apiFetch(`/api/admin/meters/${meterId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    setMeters(prev => prev.map(m => m.id === meterId ? { ...m, status: 'REJECTED' as const } : m));
    setPendingMetersCount(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, meters, readings, notifications, bills, tariffs,
      pendingUsersCount, pendingMetersCount,
      unreadCount, isDarkMode, isSidebarCollapsed, loadingAuth,
      login, logout, addMeter, updateMeter, deleteMeter, addReading,
      markNotificationRead, markAllNotificationsRead, deleteNotification, addNotification,
      updateTariff, addTariff, deleteTariff, toggleDarkMode, toggleSidebar,
      updateUserProfile, updateUserStatus, updateUserRole,
      approveUser, rejectUser, approveMeter, rejectMeter,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
