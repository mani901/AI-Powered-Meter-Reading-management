import { Outlet, Navigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  const { currentUser, isSidebarCollapsed, loadingAuth } = useApp();

  if (loadingAuth) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300
          ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
