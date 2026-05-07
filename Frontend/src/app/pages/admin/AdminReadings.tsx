import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ReadingStatusBadge } from '../../components/common/StatusBadge';
import { ImageModal } from '../../components/common/ImageModal';
import { PageHeader } from '../../components/common/PageHeader';
import { useAdminReadings } from '../../hooks/useAdmin';

export default function AdminReadings() {
  const { readings, loading, fetchReadings, reviewReading } = useAdminReadings();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [filter, setFilter] = useState('PENDING_REVIEW');

  const handleReview = async (id: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      await reviewReading(id, action, reviewNote || undefined);
      toast.success(`Reading ${action === 'ACCEPT' ? 'approved' : 'rejected'} successfully`);
      setReviewingId(null);
      setReviewNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    }
  };

  const displayed = readings.filter(r =>
    filter === 'ALL' ? true : r.status === filter
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Reading Verification" subtitle="Review and approve/reject submitted readings" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: readings.filter(r => r.status === 'PENDING_REVIEW').length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Flagged', value: readings.filter(r => r.status === 'FLAGGED').length, color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Approved', value: readings.filter(r => r.status === 'ACCEPTED').length, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Rejected', value: readings.filter(r => r.status === 'REJECTED').length, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.color.split(' ')[1]} rounded-xl p-4`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color.split(' ')[2]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['PENDING_REVIEW', 'FLAGGED', 'ALL'].map(s => (
          <button key={s}
            onClick={() => { setFilter(s); void fetchReadings(s); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'ALL' ? 'All Readings' : s === 'PENDING_REVIEW' ? 'Pending Review' : 'Flagged'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading readings...</div>
      ) : displayed.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">All Clear!</h3>
          <p className="text-slate-500 text-sm">No readings require review at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              <div className={`h-1 ${r.status === 'FLAGGED' ? 'bg-amber-400' : r.status === 'PENDING_REVIEW' ? 'bg-purple-400' : r.status === 'ACCEPTED' ? 'bg-green-400' : 'bg-red-400'}`} />
              <div className="p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <ReadingStatusBadge status={r.status} className="px-2.5 py-1" />
                      {r.isAnomalous && (
                        <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle size={11} /> Anomaly
                        </span>
                      )}
                      <span className="text-slate-400 text-xs">
                        {new Date(r.readingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-slate-500 text-xs">Meter</p>
                        <p className="text-slate-900 text-sm font-medium">{r.meterLabel || r.meterSerial}</p>
                        <p className="text-slate-400 text-xs font-mono">{r.meterSerial}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Submitted By (Staff)</p>
                        <p className="text-slate-900 text-sm font-medium">
                          {(r as unknown as Record<string, unknown>).submittedBy
                            ? ((r as unknown as Record<string, { name: string }>).submittedBy).name
                            : 'Unknown'}
                        </p>
                        <p className="text-slate-400 text-xs">{r.source === 'AI_EXTRACTED' ? 'AI' : r.source === 'AI_CORRECTED' ? 'AI (corrected)' : 'Manual'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Reading Value</p>
                        <p className="text-slate-900 text-xl font-bold font-mono">{r.readingValue.toLocaleString()}</p>
                      </div>
                      {r.confidenceScore !== undefined && (
                        <div>
                          <p className="text-slate-500 text-xs">Confidence</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-20 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${(r.confidenceScore ?? 0) >= 0.65 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${(r.confidenceScore ?? 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{((r.confidenceScore ?? 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {r.consumption !== undefined && (
                      <div className="bg-slate-50 rounded-xl p-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Previous: <strong className="text-slate-700">{r.previousReading?.toLocaleString()}</strong></span>
                          <span className="text-slate-500">Consumption: <strong className={r.isAnomalous ? 'text-red-600' : 'text-slate-700'}>{r.consumption} kWh</strong></span>
                        </div>
                        {r.anomalyReason && (
                          <p className="text-red-600 mt-2 flex items-center gap-1">
                            <AlertTriangle size={11} /> {r.anomalyReason}
                          </p>
                        )}
                      </div>
                    )}

                    {r.reviewNotes && (
                      <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
                        <span className="font-medium">Review note:</span> {r.reviewNotes}
                      </div>
                    )}
                  </div>

                  {r.imageUrl && (
                    <div className="flex flex-col items-end gap-3">
                      <div className="relative cursor-pointer" onClick={() => setSelectedImage(r.imageUrl!)}>
                        <img src={r.imageUrl} alt="Meter" className="w-28 h-20 object-cover rounded-xl border border-slate-200" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                          <ImageIcon size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(r.status === 'PENDING_REVIEW' || r.status === 'FLAGGED') && (
                  reviewingId === r.id ? (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                        placeholder="Add review notes (optional)..." rows={2}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                      <div className="flex gap-2">
                        <button onClick={() => void handleReview(r.id, 'ACCEPT')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                          <CheckCircle2 size={15} /> Approve
                        </button>
                        <button onClick={() => void handleReview(r.id, 'REJECT')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                          <XCircle size={15} /> Reject
                        </button>
                        <button onClick={() => setReviewingId(null)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => void handleReview(r.id, 'ACCEPT')} className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors">
                        <CheckCircle2 size={15} /> Approve
                      </button>
                      <button onClick={() => setReviewingId(r.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors">
                        <XCircle size={15} /> Reject with Note
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageModal src={selectedImage} alt="Meter" onClose={() => setSelectedImage(null)} />
    </div>
  );
}