import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, Meter, Reading, Notification, Bill, Tariff } from '../types';
import {
  MOCK_USERS, MOCK_METERS, MOCK_READINGS, MOCK_NOTIFICATIONS, MOCK_BILLS, MOCK_TARIFFS,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  meters: Meter[];
  readings: Reading[];
  notifications: Notification[];
  bills: Bill[];
  tariffs: Tariff[];
  unreadCount: number;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  addMeter: (meter: Omit<Meter, 'id' | 'createdAt'>) => Meter;
  updateMeter: (id: string, updates: Partial<Meter>) => void;
  deleteMeter: (id: string) => void;
  addReading: (reading: Omit<Reading, 'id' | 'createdAt'>) => Reading;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  updateTariff: (id: string, updates: Partial<Tariff>) => void;
  addTariff: (tariff: Omit<Tariff, 'id'>) => void;
  deleteTariff: (id: string) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  updateUserStatus: (userId: string, isActive: boolean) => void;
  updateUserRole: (userId: string, role: 'ADMIN' | 'CONSUMER') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sm_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [meters, setMeters] = useState<Meter[]>(MOCK_METERS);
  const [readings, setReadings] = useState<Reading[]>(MOCK_READINGS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bills] = useState<Bill[]>(MOCK_BILLS);
  const [tariffs, setTariffs] = useState<Tariff[]>(MOCK_TARIFFS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead && n.userId === currentUser?.id).length;

  const login = useCallback((email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, message: 'Invalid email or password.' };
    if (!user.isActive) return { success: false, message: 'Account is deactivated. Contact admin.' };
    const updated = { ...user, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updated);
    localStorage.setItem('sm_current_user', JSON.stringify(updated));
    return { success: true, message: 'Login successful' };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('sm_current_user');
  }, []);

  const addMeter = useCallback((meterData: Omit<Meter, 'id' | 'createdAt'>) => {
    const newMeter: Meter = { ...meterData, id: `m${Date.now()}`, createdAt: new Date().toISOString() };
    setMeters(prev => [...prev, newMeter]);
    return newMeter;
  }, []);

  const updateMeter = useCallback((id: string, updates: Partial<Meter>) => {
    setMeters(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMeter = useCallback((id: string) => {
    setMeters(prev => prev.filter(m => m.id !== id));
  }, []);

  const addReading = useCallback((readingData: Omit<Reading, 'id' | 'createdAt'>) => {
    const newReading: Reading = { ...readingData, id: `r${Date.now()}`, createdAt: new Date().toISOString() };
    setReadings(prev => [newReading, ...prev]);
    // Update meter's last reading
    setMeters(prev => prev.map(m =>
      m.id === readingData.meterId
        ? { ...m, lastReadingValue: readingData.readingValue, lastReadingDate: readingData.readingDate }
        : m
    ));
    return newReading;
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, isRead: true } : n));
  }, [currentUser]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt'>) => {
    const newN: Notification = { ...n, id: `n${Date.now()}`, createdAt: new Date().toISOString() };
    setNotifications(prev => [newN, ...prev]);
  }, []);

  const updateTariff = useCallback((id: string, updates: Partial<Tariff>) => {
    setTariffs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const addTariff = useCallback((tariffData: Omit<Tariff, 'id'>) => {
    const newTariff: Tariff = { ...tariffData, id: `t${Date.now()}` };
    setTariffs(prev => [...prev, newTariff]);
  }, []);

  const deleteTariff = useCallback((id: string) => {
    setTariffs(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('sm_current_user', JSON.stringify(updated));
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  }, [currentUser]);

  const updateUserStatus = useCallback((userId: string, isActive: boolean) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
  }, []);

  const updateUserRole = useCallback((userId: string, role: 'ADMIN' | 'CONSUMER') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, meters, readings, notifications, bills, tariffs,
      unreadCount, isDarkMode, isSidebarCollapsed,
      login, logout, addMeter, updateMeter, deleteMeter, addReading,
      markNotificationRead, markAllNotificationsRead, deleteNotification, addNotification,
      updateTariff, addTariff, deleteTariff, toggleDarkMode, toggleSidebar,
      updateUserProfile, updateUserStatus, updateUserRole,
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
