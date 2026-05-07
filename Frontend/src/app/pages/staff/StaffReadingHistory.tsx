import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, AlertTriangle, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useStaff } from '../../hooks/useStaff';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  PENDING_REVIEW: { color: 'bg-amber-100 text-amber-700', label: 'Pending Review', icon: Clock },
  ACCEPTED: { color: 'bg-green-100 text-green-700', label: 'Approved', icon: CheckCircle2 },
  REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejected', icon: XCircle },
  FLAGGED: { color: 'bg-orange-100 text-orange-700', label: 'Flagged', icon: AlertTriangle },
};

export default function StaffReadingHistory() {
  const navigate = useNavigate();
  const { submissions, loading } = useStaff();
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL' ? submissions : submissions.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Submissions"
        subtitle="All readings you have submitted"
        actions={
          <button
            onClick={() => navigate('/staff/submit')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Camera size={16} /> Submit New
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'FLAGGED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
            {' '}({s === 'ALL' ? submissions.length : submissions.filter(r => r.status === s).length})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Clock size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const cfg = STATUS_CONFIG[r.status] ?? { color: 'bg-slate-100 text-slate-700', label: r.status, icon: Clock };
            const StatusIcon = cfg.icon;
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {r.meterLabel ?? r.meterSerial}
                      </p>
                      <span className="text-slate-400 text-xs font-mono flex-shrink-0">{r.meterSerial}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="font-mono font-medium text-slate-800">{r.readingValue.toLocaleString()} kWh</span>
                      <span>Date: {r.readingDate}</span>
                      <span>Source: {r.source === 'AI_EXTRACTED' ? 'AI' : r.source === 'AI_CORRECTED' ? 'AI (corrected)' : 'Manual'}</span>
                    </div>
                    {r.meterOwner && (
                      <p className="text-xs text-slate-400 mt-1">Owner: {r.meterOwner}</p>
                    )}
                    {r.isAnomalous && (
                      <div className="flex items-center gap-1.5 mt-2 text-amber-600 text-xs">
                        <AlertTriangle size={12} />
                        <span>{r.anomalyReason}</span>
                      </div>
                    )}
                    {r.reviewNotes && (
                      <div className={`mt-2 text-xs p-2 rounded-lg ${r.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
                        <span className="font-medium">Admin note:</span> {r.reviewNotes}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                    {r.imageUrl && (
                      <a href={r.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={r.imageUrl} alt="Reading" className="w-16 h-12 object-cover rounded border border-slate-200" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
