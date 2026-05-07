import { useNavigate } from 'react-router';
import {
  Gauge, Zap, Calendar, Receipt, Camera, ClipboardList,
  BarChart3, ArrowUpRight, ArrowDownRight, AlertTriangle,
  TrendingUp, CheckCircle2, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { MONTHLY_CONSUMPTION_DATA } from '../../data/mockData';
import { READING_SOURCE_BADGE, READING_STATUS_BADGE } from '../../constants/statusConfig';
import { useUserBills, useUserMeters, useUserNotifications, useUserReadings } from '../../hooks/useUserData';
import { StatCard } from '../../components/common/StatCard';
import { ChartTooltip } from '../../components/common/ChartTooltip';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const userMeters = useUserMeters();
  const userReadings = useUserReadings();
  const { userNotifs } = useUserNotifications();
  const userBills = useUserBills();
  const latestBill = userBills[0];
  const recentReadings = userReadings.slice(0, 5);

  const currentMonth = MONTHLY_CONSUMPTION_DATA[MONTHLY_CONSUMPTION_DATA.length - 1];
  const prevMonth = MONTHLY_CONSUMPTION_DATA[MONTHLY_CONSUMPTION_DATA.length - 2];
  const changePercent = prevMonth ? (((currentMonth.consumption - prevMonth.consumption) / prevMonth.consumption) * 100).toFixed(1) : '0';
  const isUp = currentMonth.consumption > (prevMonth?.consumption ?? 0);

  const statusColors = READING_STATUS_BADGE;
  const sourceColors = READING_SOURCE_BADGE;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {currentUser?.firstName}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/readings/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Camera size={16} /> Upload Reading
          </button>
          <button
            onClick={() => navigate('/readings/manual')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <ClipboardList size={16} /> Manual Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Gauge}
          label="Total Meters"
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
          icon={Calendar}
          label="Last Reading Date"
          value={recentReadings[0] ? new Date(recentReadings[0].readingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
          sub={recentReadings[0]?.meterLabel}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Receipt}
          label="Estimated Bill"
          value={latestBill ? `PKR ${latestBill.totalAmount.toLocaleString('en', { maximumFractionDigits: 0 })}` : '—'}
          sub={latestBill?.billingMonth ? `For ${latestBill.billingMonth}` : 'No bill yet'}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consumption chart */}
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
                <ChartTooltip
                  {...props}
                  valueFormatter={(key, value) => (key === 'cost' ? `PKR ${value?.toLocaleString?.() ?? value}` : `${value} kWh`)}
                />
              )} />
              <Bar dataKey="consumption" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts & notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Alerts</h3>
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
                  ABNORMAL_USAGE: 'bg-red-50 border-red-200 text-red-700',
                  LOW_CONFIDENCE_READING: 'bg-amber-50 border-amber-200 text-amber-700',
                  READING_REMINDER: 'bg-blue-50 border-blue-200 text-blue-700',
                  BILLING_GENERATED: 'bg-green-50 border-green-200 text-green-700',
                  READING_SUBMITTED: 'bg-slate-50 border-slate-200 text-slate-700',
                  SYSTEM_ALERT: 'bg-purple-50 border-purple-200 text-purple-700',
                };
                return (
                  <div key={n.id} className={`border rounded-xl p-3 text-xs ${colors[n.type] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <p className="font-medium mb-0.5">{n.title}</p>
                    <p className="opacity-80 leading-relaxed">{n.message.slice(0, 80)}...</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent readings + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent readings */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Readings</h3>
            <button onClick={() => navigate('/readings')} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Meter', 'Reading', 'Consumption', 'Source', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentReadings.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-slate-900 text-xs font-medium">{r.meterLabel}</p>
                      <p className="text-slate-400 text-xs">{new Date(r.readingDate).toLocaleDateString('en-GB')}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-900 text-sm font-mono font-medium">
                      {r.readingValue.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      {r.consumption ? (
                        <span className={`text-xs font-medium ${r.isAnomalous ? 'text-red-600' : 'text-slate-700'}`}>
                          {r.isAnomalous && <AlertTriangle size={12} className="inline mr-1" />}
                          {r.consumption} kWh
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[r.source]}`}>
                        {r.source === 'AI_EXTRACTED' ? 'AI' : r.source === 'MANUAL' ? 'Manual' : 'AI Corrected'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Upload Meter Image', icon: Camera, path: '/readings/upload', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
                { label: 'View Analytics', icon: BarChart3, path: '/analytics', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
                { label: 'Billing History', icon: Receipt, path: '/billing', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
                { label: 'Add New Meter', icon: Gauge, path: '/meters/add', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${a.color}`}
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
      </div>
    </div>
  );
}
