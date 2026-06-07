import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Gauge, Camera, Clock, BarChart3, Receipt,
  Bell, Download, Settings, ShieldCheck, LogOut,
  ChevronLeft, ChevronRight, Zap, Users, AlertTriangle,
  DollarSign, FileText, ClipboardCheck, HardHat, Wrench,
  MessageSquareWarning, CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  end?: boolean;
}

const consumerNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Meters', path: '/meters', icon: Gauge },
  { label: 'Billing', path: '/billing', icon: Receipt },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Disputes', path: '/disputes', icon: MessageSquareWarning },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Export Data', path: '/export', icon: Download },
];

const staffNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/staff', icon: LayoutDashboard, end: true },
  { label: 'My Meters', path: '/staff/meters', icon: Gauge },
  { label: 'Submit Reading', path: '/staff/submit', icon: Camera },
  { label: 'My Submissions', path: '/staff/history', icon: Clock },
  { label: 'Notifications', path: '/notifications', icon: Bell },
];

const adminNavItems: NavItem[] = [
  { label: 'Overview', path: '/admin', icon: ShieldCheck, end: true },
  { label: 'Approvals', path: '/admin/approvals', icon: ClipboardCheck },
  { label: 'Meters', path: '/admin/meters', icon: Gauge },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Field Staff', path: '/admin/staff', icon: HardHat },
  { label: 'Reading Verification', path: '/admin/readings', icon: CheckSquare },
  { label: 'Billing', path: '/billing', icon: Receipt },
  { label: 'Tariffs', path: '/admin/tariffs', icon: DollarSign },
  { label: 'Disputes', path: '/admin/disputes', icon: MessageSquareWarning },
  { label: 'Reports', path: '/admin/reports', icon: FileText },
];

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-600',
  FIELD_STAFF: 'bg-emerald-600',
  CONSUMER: 'bg-blue-600',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  FIELD_STAFF: 'Field Staff',
  CONSUMER: 'Consumer',
};

export function Sidebar() {
  const { currentUser, unreadCount, pendingUsersCount, isSidebarCollapsed, toggleSidebar, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = currentUser?.role ?? 'CONSUMER';
  const navItems = role === 'ADMIN' ? adminNavItems : role === 'FIELD_STAFF' ? staffNavItems : consumerNavItems;
  const activeColor = role === 'ADMIN' ? 'bg-purple-700' : role === 'FIELD_STAFF' ? 'bg-emerald-700' : 'bg-blue-600';
  const accentColor = roleColors[role] ?? 'bg-blue-600';

  return (
    <>
      {!isSidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-slate-950 text-slate-100
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          <div className={`w-8 h-8 ${accentColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
            {role === 'FIELD_STAFF' ? <Wrench size={16} className="text-white" /> : <Zap size={18} className="text-white" />}
          </div>
          {!isSidebarCollapsed && (
            <div>
              <p className="text-white font-semibold text-sm leading-none">SmartMeter</p>
              <p className="text-slate-400 text-xs">{roleLabels[role] ?? 'User'} Portal</p>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center hover:bg-slate-700 transition-colors z-10"
        >
          {isSidebarCollapsed
            ? <ChevronRight size={12} className="text-slate-300" />
            : <ChevronLeft size={12} className="text-slate-300" />
          }
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
                ${isActive
                  ? `${activeColor} text-white`
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!isSidebarCollapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.path === '/notifications' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {!isSidebarCollapsed && item.path === '/admin/approvals' && pendingUsersCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {pendingUsersCount > 9 ? '9+' : pendingUsersCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-800 p-3 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
              ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
              ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <div className={`w-6 h-6 ${accentColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-medium">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-slate-500 text-xs truncate">{roleLabels[role]}</p>
              </div>
            )}
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
              ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
              ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <Settings size={16} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Settings</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all
            ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
