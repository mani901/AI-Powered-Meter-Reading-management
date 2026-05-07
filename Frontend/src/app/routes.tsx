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

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';
import MetersList from './pages/meters/MetersList';
import AddMeter from './pages/meters/AddMeter';
import MeterDetail from './pages/meters/MeterDetail';
import UploadReading from './pages/readings/UploadReading';
import ManualReading from './pages/readings/ManualReading';
import ReadingHistory from './pages/readings/ReadingHistory';
import Analytics from './pages/analytics/Analytics';
import Billing from './pages/billing/Billing';
import Notifications from './pages/notifications/Notifications';
import Export from './pages/export/Export';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReadings from './pages/admin/AdminReadings';
import AdminTariffs from './pages/admin/AdminTariffs';
import AdminReports from './pages/admin/AdminReports';
import AdminApprovals from './pages/admin/AdminApprovals';

function AdminRoute({ Component }: { Component: ComponentType }) {
  const { currentUser, loadingAuth } = useApp();
  if (loadingAuth) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
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
          { path: 'dashboard', Component: Dashboard },
          { path: 'meters', Component: MetersList },
          { path: 'meters/add', Component: AddMeter },
          { path: 'meters/:id', Component: MeterDetail },
          { path: 'readings', Component: ReadingHistory },
          { path: 'readings/upload', Component: UploadReading },
          { path: 'readings/manual', Component: ManualReading },
          { path: 'analytics', Component: Analytics },
          { path: 'billing', Component: Billing },
          { path: 'notifications', Component: Notifications },
          { path: 'export', Component: Export },
          { path: 'profile', Component: Profile },
          { path: 'settings', Component: Settings },
          // Admin routes (inside same DashboardLayout)
          { path: 'admin', Component: () => <AdminRoute Component={AdminDashboard} /> },
          { path: 'admin/approvals', Component: () => <AdminRoute Component={AdminApprovals} /> },
          { path: 'admin/users', Component: () => <AdminRoute Component={AdminUsers} /> },
          { path: 'admin/readings', Component: () => <AdminRoute Component={AdminReadings} /> },
          { path: 'admin/tariffs', Component: () => <AdminRoute Component={AdminTariffs} /> },
          { path: 'admin/reports', Component: () => <AdminRoute Component={AdminReports} /> },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
