import { useNavigate, useLocation } from 'react-router';
import { Bell, Menu, Search, Moon, Sun, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/meters': 'My Meters',
  '/meters/add': 'Add Meter',
  '/readings': 'Reading History',
  '/readings/upload': 'Upload Reading',
  '/readings/manual': 'Manual Entry',
  '/analytics': 'Analytics',
  '/billing': 'Billing',
  '/notifications': 'Notifications',
  '/export': 'Export Data',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/readings': 'Flagged Readings',
  '/admin/tariffs': 'Tariff Management',
  '/admin/reports': 'System Reports',
};

export function Header() {
  const { currentUser, unreadCount, isDarkMode, toggleDarkMode, toggleSidebar } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentLabel = routeLabels[location.pathname] || 'Page';

  const breadcrumbs = pathParts.map((part, idx) => {
    const path = '/' + pathParts.slice(0, idx + 1).join('/');
    return { label: routeLabels[path] || part, path };
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <Menu size={20} />
        </button>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <span className="text-slate-400">Home</span>
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.path} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-300" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-slate-800 font-medium">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </nav>

        <h1 className="md:hidden text-slate-900 font-semibold">{currentLabel}</h1>
      </div>

      {/* Right: Search + Notifications + Theme + Avatar */}
      <div className="flex items-center gap-2">
        {/* Search - hidden on mobile */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-500 text-sm hover:bg-slate-200 transition-colors">
          <Search size={14} />
          <span>Search...</span>
          <span className="text-xs text-slate-400 ml-2">⌘K</span>
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </span>
          </div>
          <span className="hidden md:block text-sm text-slate-700 font-medium">
            {currentUser?.firstName}
          </span>
        </button>
      </div>
    </header>
  );
}
