import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function useUserMeters() {
  const { currentUser, meters } = useApp();
  return useMemo(
    () => meters.filter(m => m.userId === currentUser?.id),
    [meters, currentUser?.id]
  );
}

export function useUserReadings() {
  const { currentUser, readings } = useApp();
  return useMemo(
    () => readings.filter(r => r.userId === currentUser?.id),
    [readings, currentUser?.id]
  );
}

export function useUserBills() {
  const { currentUser, bills } = useApp();
  return useMemo(
    () => bills.filter(b => b.userId === currentUser?.id),
    [bills, currentUser?.id]
  );
}

export function useUserNotifications() {
  const { currentUser, notifications } = useApp();
  const userNotifs = useMemo(
    () => notifications.filter(n => n.userId === currentUser?.id),
    [notifications, currentUser?.id]
  );
  const unreadCount = useMemo(
    () => userNotifs.filter(n => !n.isRead).length,
    [userNotifs]
  );
  return { userNotifs, unreadCount };
}

