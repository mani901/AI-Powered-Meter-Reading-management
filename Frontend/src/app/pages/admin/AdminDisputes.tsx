import { useState } from 'react';
import { MessageSquareWarning, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { useAdminDisputes } from '../../hooks/useAdmin';
import type { DisputeStatus } from '../../types';

const STATUS_COLORS: Record<DisputeStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function AdminDisputes() {
  const { disputes, loading, updateDispute } = useAdminDisputes();
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const displayed = filter === 'ALL' ? disputes : disputes.filter(d => d.status === filter);

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateDispute(id, { status, adminNotes: adminNotes || undefined });
      toast.success('Dispute updated');
      setUpdatingId(null);
      setSelectedId(null);
      setAdminNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update dispute');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dispute Management" subtitle={`${disputes.length} total disputes`} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as DisputeStatus[]).map(s => (
          <div key={s} className={`bg-white border ${STATUS_COLORS[s].includes('amber') ? 'border-amber-200' : STATUS_COLORS[s].includes('blue') ? 'border-blue-200' : STATUS_COLORS[s].includes('green') ? 'border-green-200' : 'border-red-200'} rounded-xl p-4`}>
            <p className="text-slate-500 text-xs">{s.replace('_', ' ')}</p>
            <p className={`text-2xl font-bold ${STATUS_COLORS[s].split(' ')[1]}`}>{disputes.filter(d => d.status === s).length}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading disputes...</div>
      ) : displayed.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-slate-500">No disputes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquareWarning size={15} className="text-slate-400" />
                    <p className="font-semibold text-slate-900 text-sm">{d.subject}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{d.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Consumer: <strong className="text-slate-700">{d.user ? `${d.user.firstName} ${d.user.lastName}` : '—'}</strong></span>
                    <span>Meter: <strong className="text-slate-700">{d.meter?.meterLabel ?? d.meter?.meterSerial ?? '—'}</strong></span>
                    <span>Filed: <strong className="text-slate-700">{new Date(d.createdAt).toLocaleDateString('en-GB')}</strong></span>
                  </div>
                  {d.adminNotes && (
                    <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700">
                      <span className="font-medium">Admin notes:</span> {d.adminNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action panel */}
              {selectedId === d.id ? (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Add admin notes..." rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <div className="flex gap-2 flex-wrap">
                    {(['UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const).map(s => (
                      <button key={s} onClick={() => void handleUpdate(d.id, s)} disabled={updatingId === d.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          s === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700 text-white' :
                          s === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 text-white' :
                          'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Mark as {s.replace('_', ' ')}
                      </button>
                    ))}
                    <button onClick={() => { setSelectedId(null); setAdminNotes(''); }} className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
                  </div>
                </div>
              ) : (
                d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => setSelectedId(d.id)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Update Status
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
