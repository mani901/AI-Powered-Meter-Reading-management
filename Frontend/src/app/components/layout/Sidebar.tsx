import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Gauge, Camera, Clock, BarChart3, Receipt,
  Bell, Download, User, Settings, ShieldCheck, LogOut,
  ChevronLeft, ChevronRight, Zap, Users, AlertTriangle,
  DollarSign, FileText, ClipboardCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Meters', path: '/meters', icon: Gauge },
  { label: 'Upload Reading', path: '/readings/upload', icon: Camera },
  { label: 'Reading History', path: '/readings', icon: Clock },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Billing', path: '/billing', icon: Receipt },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Export Data', path: '/export', icon: Download },
];

const adminItems: NavItem[] = [
  { label: 'Admin Dashboard', path: '/admin', icon: ShieldCheck, adminOnly: true },
  { label: 'Approvals', path: '/admin/approvals', icon: ClipboardCheck, adminOnly: true },
  { label: 'Users', path: '/admin/users', icon: Users, adminOnly: true },
  { label: 'Flagged Readings', path: '/admin/readings', icon: AlertTriangle, adminOnly: true },
  { label: 'Tariffs', path: '/admin/tariffs', icon: DollarSign, adminOnly: true },
  { label: 'Reports', path: '/admin/reports', icon: FileText, adminOnly: true },
];

export function Sidebar() {
  const { currentUser, unreadCount, pendingUsersCount, pendingMetersCount, isSidebarCollapsed, toggleSidebar, logout } = useApp();
  const totalPendingApprovals = pendingUsersCount + pendingMetersCount;
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
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
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <p className="text-white font-semibold text-sm leading-none">SmartMeter</p>
              <p className="text-slate-400 text-xs">AI Reading System</p>
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
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
                ${isActive
                  ? 'bg-blue-600 text-white'
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
              {isSidebarCollapsed && item.path === '/notifications' && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full hidden lg:block" />
              )}
            </NavLink>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className={`pt-4 pb-2 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-slate-600 text-xs uppercase tracking-wider px-3 font-medium">Administration</p>
              </div>
              {isSidebarCollapsed && <div className="border-t border-slate-800 my-2 hidden lg:block" />}
              {adminItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                    ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
                    ${isActive
                      ? 'bg-purple-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.path === '/admin/approvals' && totalPendingApprovals > 0 && (
                        <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {totalPendingApprovals > 9 ? '9+' : totalPendingApprovals}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
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
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-slate-500 text-xs truncate">{currentUser?.role}</p>
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
