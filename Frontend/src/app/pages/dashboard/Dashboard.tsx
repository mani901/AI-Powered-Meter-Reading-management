import { useNavigate } from 'react-router';
import {
  Gauge, Zap, Calendar, Receipt, BarChart3,
  ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle2,
  MessageSquareWarning, Bell,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { MONTHLY_CONSUMPTION_DATA } from '../../data/mockData';
import { useUserBills, useUserMeters, useUserNotifications } from '../../hooks/useUserData';
import { StatCard } from '../../components/common/StatCard';
import { ChartTooltip } from '../../components/common/ChartTooltip';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const userMeters = useUserMeters();
  const { userNotifs } = useUserNotifications();
  const userBills = useUserBills();
  const latestBill = userBills[0];

  const currentMonth = MONTHLY_CONSUMPTION_DATA[MONTHLY_CONSUMPTION_DATA.length - 1];
  const prevMonth = MONTHLY_CONSUMPTION_DATA[MONTHLY_CONSUMPTION_DATA.length - 2];
  const changePercent = prevMonth ? (((currentMonth.consumption - prevMonth.consumption) / prevMonth.consumption) * 100).toFixed(1) : '0';
  const isUp = currentMonth.consumption > (prevMonth?.consumption ?? 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {currentUser?.firstName}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Gauge}
          label="My Meters"
          value={String(userMeters.length)}
          sub={`${userMeters.filter(m => m.status === 'ACTIVE').length} active`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Zap}
          label="This Month Usage"
          value={`${currentMonth.consumption} kWh`}
          sub="vs last month"
          color={isUp ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}
          trend={{ value: `${Math.abs(Number(changePercent))}%`, up: isUp, upIcon: ArrowUpRight, downIcon: ArrowDownRight }}
        />
        <StatCard
          icon={Receipt}
          label="Current Bill"
          value={latestBill ? `PKR ${latestBill.totalAmount.toLocaleString('en', { maximumFractionDigits: 0 })}` : '—'}
          sub={latestBill?.billingMonth ? `For ${latestBill.billingMonth}` : 'No bill yet'}
          color={latestBill?.status === 'OVERDUE' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
        />
        <StatCard
          icon={Calendar}
          label="Payment Status"
          value={latestBill?.status ?? '—'}
          sub={latestBill?.dueDate ? `Due: ${new Date(latestBill.dueDate).toLocaleDateString('en-GB')}` : ''}
          color={latestBill?.status === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Monthly Consumption</h3>
              <p className="text-slate-500 text-xs mt-0.5">Last 12 months (kWh)</p>
            </div>
            <button onClick={() => navigate('/analytics')} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
              Full analytics <BarChart3 size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_CONSUMPTION_DATA} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={(props) => (
                <ChartTooltip {...props} valueFormatter={(key, value) => (key === 'cost' ? `PKR ${value?.toLocaleString?.() ?? value}` : `${value} kWh`)} />
              )} />
              <Bar dataKey="consumption" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <button onClick={() => navigate('/notifications')} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View all</button>
          </div>
          {userNotifs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto text-green-400 mb-2" size={32} />
              <p className="text-slate-500 text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userNotifs.slice(0, 4).map(n => {
                const colors: Record<string, string> = {
                  BILLING_GENERATED: 'bg-green-50 border-green-200 text-green-700',
                  READING_SUBMITTED: 'bg-blue-50 border-blue-200 text-blue-700',
                  SYSTEM_ALERT: 'bg-purple-50 border-purple-200 text-purple-700',
                  ACCOUNT_APPROVED: 'bg-green-50 border-green-200 text-green-700',
                  METER_APPROVED: 'bg-teal-50 border-teal-200 text-teal-700',
                };
                return (
                  <div key={n.id} className={`border rounded-xl p-3 text-xs ${colors[n.type] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <p className="font-medium mb-0.5">{n.title}</p>
                    <p className="opacity-80 leading-relaxed">{n.message.slice(0, 80)}{n.message.length > 80 ? '...' : ''}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View My Bills', icon: Receipt, path: '/billing', color: 'bg-green-600 hover:bg-green-700 text-white' },
            { label: 'View Analytics', icon: BarChart3, path: '/analytics', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
            { label: 'My Meters', icon: Gauge, path: '/meters', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
            { label: 'File a Dispute', icon: MessageSquareWarning, path: '/disputes', color: 'bg-amber-100 hover:bg-amber-200 text-amber-700' },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${a.color}`}
            >
              <a.icon size={16} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <TrendingUp size={24} className="mb-3 opacity-80" />
        <p className="text-sm font-medium mb-1">Avg. Daily Usage</p>
        <p className="text-3xl font-bold">{(currentMonth.consumption / 28).toFixed(1)}</p>
        <p className="text-blue-200 text-xs mt-1">kWh/day this month</p>
      </div>
    </div>
  );
}
