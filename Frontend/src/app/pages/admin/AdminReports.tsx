import { Download, FileText, Loader2, TrendingUp, TrendingDown, Users, Gauge } from 'lucide-react';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ADMIN_STATS, MOCK_AUDIT_LOGS } from '../../data/mockData';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';

const monthlyUsers = [
  { month: 'Sep 25', users: 125 }, { month: 'Oct 25', users: 130 },
  { month: 'Nov 25', users: 134 }, { month: 'Dec 25', users: 139 },
  { month: 'Jan 26', users: 143 }, { month: 'Feb 26', users: 148 },
];

const revenueData = [
  { month: 'Sep 25', revenue: 380000 },
  { month: 'Oct 25', revenue: 412000 },
  { month: 'Nov 25', revenue: 445000 },
  { month: 'Dec 25', revenue: 398000 },
  { month: 'Jan 26', revenue: 470000 },
  { month: 'Feb 26', revenue: 485000 },
];

export default function AdminReports() {
  const [exporting, setExporting] = useState('');

  const handleExport = async (type: string) => {
    setExporting(type);
    await new Promise(r => setTimeout(r, 1200));
    setExporting('');
    toast.success(`${type} report exported! (Demo)`);
  };

  const actionColors: Record<string, string> = {
    READING_CREATED: 'bg-blue-100 text-blue-700',
    USER_LOGIN: 'bg-green-100 text-green-700',
    READING_REVIEWED: 'bg-purple-100 text-purple-700',
    METER_ADDED: 'bg-indigo-100 text-indigo-700',
    TARIFF_UPDATED: 'bg-amber-100 text-amber-700',
    BILL_VIEWED: 'bg-slate-100 text-slate-700',
    USER_DEACTIVATED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Reports"
        subtitle="Analytics and reporting for administrators"
        actions={(
          <button
            onClick={() => handleExport('Full System')}
            disabled={!!exporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {exporting === 'Full System' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Full Report
          </button>
        )}
      />

      {/* Quick report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Monthly System Report', desc: 'Readings, users, revenue summary', icon: FileText, color: 'bg-blue-600', type: 'Monthly System' },
          { label: 'AI Performance Report', desc: 'Confidence scores, accuracy stats', icon: TrendingUp, color: 'bg-purple-600', type: 'AI Performance' },
          { label: 'Audit Log Export', desc: 'Full system activity history', icon: FileText, color: 'bg-slate-700', type: 'Audit Log' },
        ].map(r => (
          <button key={r.type} onClick={() => handleExport(r.type)} disabled={!!exporting}
            className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:shadow-md transition-all group disabled:opacity-60"
          >
            <div className={`w-10 h-10 ${r.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              {exporting === r.type ? <Loader2 size={18} className="text-white animate-spin" /> : <r.icon size={18} className="text-white" />}
            </div>
            <p className="font-semibold text-slate-900 text-sm">{r.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">User Growth</h3>
              <p className="text-slate-500 text-xs">Total registered users</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp size={14} /> +18.4% this period
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyUsers}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[100, 'auto']} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 11 }} />
              <Area type="monotone" dataKey="users" name="Users" stroke="#2563eb" fill="url(#userGrad)" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Estimated Revenue</h3>
              <p className="text-slate-500 text-xs">Total billing amounts (PKR)</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp size={14} /> +27.6% this period
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [`PKR ${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">System Summary — February 2026</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Users', value: ADMIN_STATS.totalUsers, change: '+12', up: true, icon: Users },
            { label: 'Active Meters', value: ADMIN_STATS.activeMeters, change: '+8', up: true, icon: Gauge },
            { label: 'Readings This Month', value: ADMIN_STATS.readingsThisMonth, change: '+15', up: true, icon: TrendingUp },
            { label: 'Avg. Confidence', value: `${(ADMIN_STATS.avgConfidenceScore * 100).toFixed(0)}%`, change: '+2.1%', up: true, icon: TrendingUp },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <s.icon size={20} className="text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
              <span className={`text-xs font-medium ${s.up ? 'text-green-600' : 'text-red-600'}`}>
                {s.change} this month
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full audit log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Audit Log</h3>
          <button onClick={() => handleExport('Audit Log')} disabled={!!exporting}
            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {exporting === 'Audit Log' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP Address'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT_LOGS.map(log => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700">{log.userName ?? 'System'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{log.entity}</td>
                  <td className="px-5 py-3 text-xs text-slate-600 max-w-xs truncate">{log.details}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
