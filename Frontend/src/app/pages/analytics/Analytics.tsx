import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MONTHLY_CONSUMPTION_DATA } from '../../data/mockData';
import { PageHeader } from '../../components/common/PageHeader';
import { ChartTooltip } from '../../components/common/ChartTooltip';

export default function Analytics() {
  const { currentUser, meters, readings } = useApp();
  const [period, setPeriod] = useState<'3' | '6' | '12'>('12');
  const [selectedMeter, setSelectedMeter] = useState('ALL');

  const userMeters = meters.filter(m => m.userId === currentUser?.id);
  const data = MONTHLY_CONSUMPTION_DATA.slice(-parseInt(period));
  const avg = Math.round(data.reduce((sum, d) => sum + d.consumption, 0) / data.length);
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const changePercent = prev ? (((latest.consumption - prev.consumption) / prev.consumption) * 100).toFixed(1) : '0';
  const isUp = latest.consumption > prev?.consumption;

  const highest = [...data].sort((a, b) => b.consumption - a.consumption)[0];
  const lowest = [...data].sort((a, b) => a.consumption - b.consumption)[0];

  // Trend detection
  const trend = data.slice(-4).every((d, i, arr) => i === 0 || d.consumption >= arr[i - 1].consumption) ? 'INCREASING'
    : data.slice(-4).every((d, i, arr) => i === 0 || d.consumption <= arr[i - 1].consumption) ? 'DECREASING'
    : 'STABLE';

  const TrendIcon = trend === 'INCREASING' ? TrendingUp : trend === 'DECREASING' ? TrendingDown : Minus;
  const trendColor = trend === 'INCREASING' ? 'text-red-600' : trend === 'DECREASING' ? 'text-green-600' : 'text-slate-600';

  // Cost estimate data
  const costData = data.map(d => ({ ...d, cost: Math.round(d.consumption * 14.5) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consumption Analytics"
        subtitle="Detailed electricity usage insights"
        actions={(
          <div className="flex gap-3">
          <select
            value={selectedMeter}
            onChange={e => setSelectedMeter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Meters</option>
            {userMeters.map(m => <option key={m.id} value={m.id}>{m.meterLabel || m.meterSerial}</option>)}
          </select>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            {(['3', '6', '12'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {p}M
              </button>
            ))}
          </div>
          </div>
        )}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Current Month',
            value: `${latest.consumption} kWh`,
            sub: `Estimated PKR ${latest.cost.toLocaleString()}`,
            icon: Zap,
            extra: <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-red-600' : 'text-green-600'}`}>
              {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(Number(changePercent))}%
            </span>,
            color: 'bg-blue-50 text-blue-600',
          },
          { label: `${period}M Average`, value: `${avg} kWh`, sub: 'Per month average', icon: TrendIcon, color: 'bg-purple-50 text-purple-600' },
          { label: 'Peak Month', value: `${highest.consumption} kWh`, sub: highest.month, icon: TrendingUp, color: 'bg-red-50 text-red-600' },
          { label: 'Lowest Month', value: `${lowest.consumption} kWh`, sub: lowest.month, icon: TrendingDown, color: 'bg-green-50 text-green-600' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              {(card as any).extra}
            </div>
            <p className="text-slate-500 text-xs">{card.label}</p>
            <p className="text-slate-900 text-xl font-bold mt-0.5">{card.value}</p>
            <p className="text-slate-400 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
        trend === 'INCREASING' ? 'bg-red-50 border-red-200 text-red-700'
        : trend === 'DECREASING' ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <TrendIcon size={16} />
        Consumption trend: <strong>{trend}</strong> over the last {period} months
      </div>

      {/* Main consumption bar chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-1">Monthly Consumption</h3>
        <p className="text-slate-500 text-xs mb-5">kWh consumed per month • Blue bar = average reference</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={(props) => (
              <ChartTooltip
                {...props}
                valueFormatter={(key, value) => (key === 'cost' ? `PKR ${value?.toLocaleString?.() ?? value}` : `${value} kWh`)}
              />
            )} />
            <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Avg: ${avg}`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
            <Bar dataKey="consumption" name="Consumption" fill="#2563eb" radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 9, fill: '#94a3b8', formatter: (v: number) => `${v}` }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area + Cost charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend line chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Usage Trend</h3>
          <p className="text-slate-500 text-xs mb-5">Consumption trend over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={(props) => (
                <ChartTooltip
                  {...props}
                  valueFormatter={(key, value) => (key === 'cost' ? `PKR ${value?.toLocaleString?.() ?? value}` : `${value} kWh`)}
                />
              )} />
              <Area type="monotone" dataKey="consumption" name="Consumption" stroke="#2563eb" fill="url(#blueGrad)" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost estimate */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Estimated Cost</h3>
          <p className="text-slate-500 text-xs mb-5">Approximate bill based on NEPRA tariffs (PKR)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`PKR ${v.toLocaleString()}`, 'Est. Cost']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 11 }} />
              <Line type="monotone" dataKey="cost" name="Est. Cost" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Month', 'Consumption (kWh)', 'vs Average', 'Est. Cost (PKR)', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d, idx) => {
                const diff = d.consumption - avg;
                const pct = ((d.consumption / avg - 1) * 100).toFixed(1);
                const isHigh = d.consumption > avg * 1.2;
                const isLow = d.consumption < avg * 0.8;
                return (
                  <tr key={d.month} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${idx === 0 ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">
                      {d.month} {idx === 0 && <span className="text-blue-600 text-xs ml-1">(latest)</span>}
                    </td>
                    <td className="px-6 py-3 font-mono text-sm text-slate-900">{d.consumption}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium flex items-center gap-1 ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {diff > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(Number(pct))}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">PKR {Math.round(d.consumption * 14.5).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isHigh ? 'bg-red-100 text-red-700' : isLow ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isHigh ? 'High' : isLow ? 'Low' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
