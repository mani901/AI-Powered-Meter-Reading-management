import { createBrowserRouter } from 'react-router';
import { Navigate } from 'react-router';
import type { ComponentType } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Root } from './Root';
import { NotFound } from './NotFound';
import { useApp } from './context/AppContext';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Consumer pages
import Dashboard from './pages/dashboard/Dashboard';
import MetersList from './pages/meters/MetersList';
import MeterDetail from './pages/meters/MeterDetail';
import Analytics from './pages/analytics/Analytics';
import Billing from './pages/billing/Billing';
import Notifications from './pages/notifications/Notifications';
import Export from './pages/export/Export';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import Disputes from './pages/disputes/Disputes';

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffMeters from './pages/staff/StaffMeters';
import StaffReadingSubmit from './pages/staff/StaffReadingSubmit';
import StaffReadingHistory from './pages/staff/StaffReadingHistory';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStaff from './pages/admin/AdminStaff';
import AdminMeters from './pages/admin/AdminMeters';
import AdminReadings from './pages/admin/AdminReadings';
import AdminTariffs from './pages/admin/AdminTariffs';
import AdminReports from './pages/admin/AdminReports';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminDisputes from './pages/admin/AdminDisputes';

function AdminRoute({ Component }: { Component: ComponentType }) {
  const { currentUser, loadingAuth } = useApp();
  if (loadingAuth) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Component />;
}

function StaffRoute({ Component }: { Component: ComponentType }) {
  const { currentUser, loadingAuth } = useApp();
  if (loadingAuth) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'FIELD_STAFF') return <Navigate to="/dashboard" replace />;
  return <Component />;
}

function ConsumerRoute({ Component }: { Component: ComponentType }) {
  const { currentUser, loadingAuth } = useApp();
  if (loadingAuth) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (currentUser.role === 'FIELD_STAFF') return <Navigate to="/staff" replace />;
  return <Component />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'forgot-password', Component: ForgotPassword },
      {
        Component: DashboardLayout,
        children: [
          // Consumer routes
          { path: 'dashboard', Component: () => <ConsumerRoute Component={Dashboard} /> },
          { path: 'meters', Component: MetersList },
          { path: 'meters/:id', Component: MeterDetail },
          { path: 'analytics', Component: Analytics },
          { path: 'billing', Component: Billing },
          { path: 'disputes', Component: () => <ConsumerRoute Component={Disputes} /> },
          { path: 'notifications', Component: Notifications },
          { path: 'export', Component: Export },
          { path: 'profile', Component: Profile },
          { path: 'settings', Component: Settings },

          // Staff routes
          { path: 'staff', Component: () => <StaffRoute Component={StaffDashboard} /> },
          { path: 'staff/meters', Component: () => <StaffRoute Component={StaffMeters} /> },
          { path: 'staff/submit', Component: () => <StaffRoute Component={StaffReadingSubmit} /> },
          { path: 'staff/history', Component: () => <StaffRoute Component={StaffReadingHistory} /> },

          // Admin routes
          { path: 'admin', Component: () => <AdminRoute Component={AdminDashboard} /> },
          { path: 'admin/approvals', Component: () => <AdminRoute Component={AdminApprovals} /> },
          { path: 'admin/users', Component: () => <AdminRoute Component={AdminUsers} /> },
          { path: 'admin/staff', Component: () => <AdminRoute Component={AdminStaff} /> },
          { path: 'admin/meters', Component: () => <AdminRoute Component={AdminMeters} /> },
          { path: 'admin/readings', Component: () => <AdminRoute Component={AdminReadings} /> },
          { path: 'admin/tariffs', Component: () => <AdminRoute Component={AdminTariffs} /> },
          { path: 'admin/reports', Component: () => <AdminRoute Component={AdminReports} /> },
          { path: 'admin/disputes', Component: () => <AdminRoute Component={AdminDisputes} /> },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
