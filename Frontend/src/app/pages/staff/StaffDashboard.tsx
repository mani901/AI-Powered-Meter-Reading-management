import { useNavigate } from 'react-router';
import {
  Gauge, Camera, Clock, CheckCircle2, AlertTriangle,
  XCircle, TrendingUp, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useApp } from '../../context/AppContext';
import { useStaff } from '../../hooks/useStaff';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { dashboard, recentSubmissions, assignedMeters, loading } = useStaff();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${currentUser?.firstName}!`}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
            Field Staff
          </span>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Gauge}
          label="Assigned Meters"
          value={loading ? '...' : String(dashboard?.assignedMeters ?? 0)}
          sub="Active assignments"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Camera}
          label="Submitted Today"
          value={loading ? '...' : String(dashboard?.submittedToday ?? 0)}
          sub="Readings today"
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={loading ? '...' : String(dashboard?.pendingReviews ?? 0)}
          sub="Awaiting admin"
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={loading ? '...' : String(dashboard?.approved ?? 0)}
          sub="Total approved"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={loading ? '...' : String(dashboard?.rejected ?? 0)}
          sub="Need attention"
          color="bg-red-50 text-red-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Submitted"
          value={loading ? '...' : String(dashboard?.totalSubmitted ?? 0)}
          sub="All time"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/staff/submit')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Camera size={16} />
              <span className="flex-1 text-left">Submit New Reading</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate('/staff/meters')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Gauge size={16} />
              <span className="flex-1 text-left">View My Meters</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate('/staff/history')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Clock size={16} />
              <span className="flex-1 text-left">Submission History</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Submissions</h3>
            <button onClick={() => navigate('/staff/history')} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Loading...</div>
            ) : recentSubmissions.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No submissions yet</div>
            ) : (
              recentSubmissions.slice(0, 5).map((r) => {
                const statusConfig: Record<string, { color: string; label: string }> = {
                  PENDING_REVIEW: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
                  ACCEPTED: { color: 'bg-green-100 text-green-700', label: 'Approved' },
                  REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
                  FLAGGED: { color: 'bg-orange-100 text-orange-700', label: 'Flagged' },
                };
                const cfg = statusConfig[r.status] ?? { color: 'bg-slate-100 text-slate-700', label: r.status };
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{r.meterLabel ?? r.meterSerial}</p>
                      <p className="text-xs text-slate-400">{r.readingDate} · {r.readingValue.toLocaleString()} kWh</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {r.status === 'REJECTED' && r.reviewNotes && (
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0" title={r.reviewNotes} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Assigned Meters Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">My Assigned Meters</h3>
          <button onClick={() => navigate('/staff/meters')} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Meter', 'Location', 'Owner', 'Last Reading', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : assignedMeters.slice(0, 5).map((a) => (
                <tr key={a.assignmentId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-slate-800">{a.meter.meterLabel ?? a.meter.meterSerial}</p>
                    <p className="text-xs text-slate-400">{a.meter.meterSerial}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{a.meter.location ?? '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {a.meter.owner ? `${a.meter.owner.firstName} ${a.meter.owner.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {a.meter.lastReadingValue != null ? a.meter.lastReadingValue.toLocaleString() : '—'}
                    {a.meter.lastReadingDate ? ` (${a.meter.lastReadingDate})` : ''}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.meter.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      a.meter.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {a.meter.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
