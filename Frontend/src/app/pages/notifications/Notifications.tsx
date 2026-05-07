import { Bell, BellOff, Trash2, CheckCheck, Zap, AlertTriangle, Receipt, Camera, Info, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NotificationType } from '../../types';
import { NOTIFICATION_TYPE_STYLES } from '../../constants/statusConfig';
import { timeAgo } from '../../utils/time';
import { useUserNotifications } from '../../hooks/useUserData';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';

const typeIcons: Record<NotificationType, React.ElementType> = {
  READING_REMINDER: Clock,
  ABNORMAL_USAGE: AlertTriangle,
  BILLING_GENERATED: Receipt,
  LOW_CONFIDENCE_READING: Camera,
  SYSTEM_ALERT: Info,
  READING_SUBMITTED: Zap,
};

export default function Notifications() {
  const { markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp();
  const { userNotifs: raw } = useUserNotifications();
  const userNotifs = raw
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unread = userNotifs.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
        actions={unread > 0 ? (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <CheckCheck size={16} className="text-blue-600" />
            Mark all as read
          </button>
        ) : undefined}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {['All', 'Unread', 'Alerts', 'Billing'].map(tab => (
          <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'All' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {tab}
            {tab === 'Unread' && unread > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {userNotifs.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description="You're all caught up! Notifications will appear here."
          className="py-0 border-0 bg-transparent"
        />
      ) : (
        <div className="space-y-3">
          {userNotifs.map(n => {
            const config = NOTIFICATION_TYPE_STYLES[n.type];
            const Icon = typeIcons[n.type];
            return (
              <div
                key={n.id}
                className={`relative bg-white border rounded-xl p-5 transition-all hover:shadow-sm
                  ${!n.isRead ? `border-l-4 ${config.border} shadow-sm` : 'border-slate-200'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${config.bg} border ${config.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                        {!n.isRead && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                      </p>
                      <span className="text-slate-400 text-xs whitespace-nowrap flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color} border ${config.border}`}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-300 text-xs">
                        {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  {!n.isRead && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={12} /> Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 ml-auto transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
