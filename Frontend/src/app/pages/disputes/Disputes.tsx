import { useState } from 'react';
import { MessageSquareWarning, Plus, CheckCircle2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { useDisputes } from '../../hooks/useDisputes';
import { useUserMeters } from '../../hooks/useUserData';
import type { DisputeStatus } from '../../types';

const STATUS_COLORS: Record<DisputeStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function Disputes() {
  const { disputes, loading, fileDispute } = useDisputes(false);
  const userMeters = useUserMeters();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ meterId: '', subject: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meterId || !form.subject || !form.description) return;
    setSubmitting(true);
    try {
      await fileDispute(form);
      toast.success('Dispute filed successfully. Admin will review it shortly.');
      setShowCreate(false);
      setForm({ meterId: '', subject: '', description: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to file dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Disputes"
        subtitle="Report wrong readings or billing issues"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> File a Dispute
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as DisputeStatus[]).map(s => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-slate-500 text-xs">{s.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-slate-900">{disputes.filter(d => d.status === s).length}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-slate-600 font-medium">No disputes filed</p>
          <p className="text-slate-400 text-sm mt-1">If you see a wrong reading or billing issue, file a dispute above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquareWarning size={15} className="text-slate-400" />
                    <p className="font-semibold text-slate-900 text-sm">{d.subject}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{d.description}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Meter: <strong className="text-slate-700">{d.meter?.meterLabel ?? d.meter?.meterSerial ?? '—'}</strong></span>
                    <span>Filed: <strong className="text-slate-700">{new Date(d.createdAt).toLocaleDateString('en-GB')}</strong></span>
                  </div>
                  {d.adminNotes && (
                    <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700">
                      <span className="font-medium">Admin response:</span> {d.adminNotes}
                    </div>
                  )}
                  {d.resolvedAt && (
                    <p className="text-xs text-green-600 mt-2">Resolved on {new Date(d.resolvedAt).toLocaleDateString('en-GB')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dispute Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">File a Dispute</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={e => void handleSubmit(e)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Meter *</label>
                <select required value={form.meterId} onChange={e => setForm(p => ({ ...p, meterId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="">— Select meter —</option>
                  {userMeters.map(m => (
                    <option key={m.id} value={m.id}>{m.meterLabel ?? m.meterSerial} ({m.meterSerial})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
                <input required minLength={3} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Wrong reading recorded"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
                <textarea required minLength={10} rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Submitting...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
