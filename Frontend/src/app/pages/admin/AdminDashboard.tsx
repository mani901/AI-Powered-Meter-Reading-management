import { useNavigate } from 'react-router';
import {
  Users, Gauge, Camera, AlertTriangle, TrendingUp,
  DollarSign, CheckCircle2, Clock, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ADMIN_STATS, MOCK_AUDIT_LOGS } from '../../data/mockData';
import { AUDIT_ACTION_BADGE } from '../../constants/statusConfig';
import { timeAgo } from '../../utils/time';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';

const COLORS = ['#2563eb', '#10b981', '#f59e0b'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const stats = ADMIN_STATS;

  const pieData = [
    { name: 'AI Extracted', value: stats.readingsBySource.AI_EXTRACTED },
    { name: 'Manual', value: stats.readingsBySource.MANUAL },
    { name: 'AI Corrected', value: stats.readingsBySource.AI_CORRECTED },
  ];

  const actionColors = AUDIT_ACTION_BADGE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview and management"
        actions={(
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full">Admin Panel</span>
        )}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${stats.activeUsers} active`} color="bg-blue-50 text-blue-600" change={{ value: '12 this month', up: true }} />
        <StatCard icon={Gauge} label="Total Meters" value={stats.totalMeters} sub={`${stats.activeMeters} active`} color="bg-green-50 text-green-600" />
        <StatCard icon={Camera} label="Readings This Month" value={stats.readingsThisMonth} sub="Total readings ever: 2,847" color="bg-purple-50 text-purple-600" change={{ value: '8.7%', up: true }} />
        <StatCard icon={AlertTriangle} label="Flagged Readings" value={stats.flaggedReadings} sub={`${stats.pendingReviews} pending review`} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Avg. Confidence" value={`${(stats.avgConfidenceScore * 100).toFixed(0)}%`} sub="AI extraction accuracy" color="bg-teal-50 text-teal-600" />
        <StatCard icon={DollarSign} label="Est. Revenue" value={`PKR ${(stats.revenueThisMonth / 1000).toFixed(0)}K`} sub="This month total bills" color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Monthly Growth" value="+13.5%" sub="vs last month" color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Clock} label="Pending Reviews" value={stats.pendingReviews} sub="Flagged readings" color="bg-red-50 text-red-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly readings bar chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Monthly Readings Volume</h3>
          <p className="text-slate-500 text-xs mb-5">Number of readings submitted per month</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyReadingTrend} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 11 }} />
              <Bar dataKey="readings" name="Readings" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source distribution pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Reading Sources</h3>
          <p className="text-slate-500 text-xs mb-4">AI vs Manual distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-medium text-slate-900">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confidence distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Confidence Score Distribution</h3>
        <div className="space-y-3">
          {stats.confidenceDistribution.map(d => {
            const total = stats.confidenceDistribution.reduce((sum, x) => sum + x.count, 0);
            const pct = (d.count / total * 100).toFixed(1);
            const barColor = d.range.startsWith('9') ? 'bg-green-500' : d.range.startsWith('8') ? 'bg-teal-500' : d.range.startsWith('7') ? 'bg-amber-500' : d.range.startsWith('6') ? 'bg-orange-500' : 'bg-red-500';
            return (
              <div key={d.range} className="flex items-center gap-4">
                <span className="text-slate-600 text-xs w-16 flex-shrink-0">{d.range}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-slate-500 text-xs w-16 text-right">{d.count.toLocaleString()} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <span className="text-slate-400 text-xs">Audit log</span>
          </div>
          <div className="divide-y divide-slate-50">
            {MOCK_AUDIT_LOGS.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 truncate">{log.userName} — {log.details}</p>
                  <p className="text-xs text-slate-400">{timeAgo(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Review Flagged Readings', badge: stats.pendingReviews, path: '/admin/readings', color: 'bg-amber-600 hover:bg-amber-700 text-white', icon: AlertTriangle },
              { label: 'Manage Users', badge: null, path: '/admin/users', color: 'bg-blue-600 hover:bg-blue-700 text-white', icon: Users },
              { label: 'Update Tariff Slabs', badge: null, path: '/admin/tariffs', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700', icon: DollarSign },
              { label: 'System Reports', badge: null, path: '/admin/reports', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700', icon: BarChart3 },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${a.color}`}
              >
                <a.icon size={16} />
                <span className="flex-1 text-left">{a.label}</span>
                {a.badge && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{a.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
