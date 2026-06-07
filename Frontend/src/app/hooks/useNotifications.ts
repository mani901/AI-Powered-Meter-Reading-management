import { useApp } from '../context/AppContext';
import { useUserNotifications } from './useUserData';

export function useNotifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp();
  const { userNotifs, unreadCount } = useUserNotifications();
  return {
    notifications,
    userNotifications: userNotifs,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  };
}

