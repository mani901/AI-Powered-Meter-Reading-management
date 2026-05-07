import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ImageIcon, X, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { READING_STATUS_BADGE } from '../../constants/statusConfig';
import { ReadingStatusBadge } from '../../components/common/StatusBadge';
import { ImageModal } from '../../components/common/ImageModal';

export default function AdminReadings() {
  const { readings, meters, users } = useApp();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [localReadings, setLocalReadings] = useState(readings);

  const flaggedReadings = localReadings.filter(r =>
    r.status === 'FLAGGED' || r.status === 'PENDING_REVIEW'
  );

  const getMeter = (meterId: string) => meters.find(m => m.id === meterId);
  const getUser = (userId: string) => users.find(u => u.id === userId);

  const handleReview = (id: string, action: 'ACCEPTED' | 'REJECTED') => {
    setLocalReadings(prev => prev.map(r =>
      r.id === id ? { ...r, status: action, reviewNotes: reviewNote } : r
    ));
    setReviewingId(null);
    setReviewNote('');
    toast.success(`Reading ${action.toLowerCase()} successfully`);
  };

  const statusColors = READING_STATUS_BADGE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Flagged Readings</h1>
        <p className="text-slate-500 text-sm mt-1">{flaggedReadings.length} readings require review</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-600 text-xs font-medium">Flagged (Low Confidence)</p>
          <p className="text-2xl font-bold text-amber-700">{localReadings.filter(r => r.status === 'FLAGGED').length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-purple-600 text-xs font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-purple-700">{localReadings.filter(r => r.status === 'PENDING_REVIEW').length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-xs font-medium">Anomalous</p>
          <p className="text-2xl font-bold text-red-700">{localReadings.filter(r => r.isAnomalous).length}</p>
        </div>
      </div>

      {flaggedReadings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">All Clear!</h3>
          <p className="text-slate-500 text-sm">No flagged readings at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedReadings.map(r => {
            const meter = getMeter(r.meterId);
            const user = getUser(r.userId);
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                <div className={`h-1 ${r.status === 'FLAGGED' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                <div className="p-5">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Left: Reading info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
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
                          <p className="text-slate-900 text-sm font-medium">{meter?.meterLabel || meter?.meterSerial}</p>
                          <p className="text-slate-400 text-xs font-mono">{meter?.meterSerial}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Consumer</p>
                          <p className="text-slate-900 text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                          <p className="text-slate-400 text-xs">{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">AI Extracted Value</p>
                          <p className="text-slate-900 text-xl font-bold font-mono">{r.readingValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Confidence Score</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-20 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${(r.confidenceScore ?? 0) >= 0.65 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${(r.confidenceScore ?? 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-slate-700 text-sm font-medium">{((r.confidenceScore ?? 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {r.consumption !== undefined && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Previous: <strong className="text-slate-700">{r.previousReading?.toLocaleString()}</strong></span>
                            <span className="text-slate-500">Consumption: <strong className={r.isAnomalous ? 'text-red-600' : 'text-slate-700'}>{r.consumption} kWh</strong></span>
                          </div>
                          {r.anomalyReason && (
                            <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                              <AlertTriangle size={11} /> {r.anomalyReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Image */}
                    <div className="flex flex-col items-end gap-3">
                      {r.imageUrl && (
                        <div className="relative cursor-pointer" onClick={() => setSelectedImage(r.imageUrl!)}>
                          <img src={r.imageUrl} alt="Meter" className="w-28 h-20 object-cover rounded-xl border border-slate-200" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                            <ImageIcon size={20} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review section */}
                  {reviewingId === r.id ? (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add review notes (optional)..."
                        rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(r.id, 'ACCEPTED')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                          <CheckCircle2 size={15} /> Accept
                        </button>
                        <button onClick={() => handleReview(r.id, 'REJECTED')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                          <XCircle size={15} /> Reject
                        </button>
                        <button onClick={() => setReviewingId(null)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => setReviewingId(r.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
                        <MessageSquare size={15} /> Review
                      </button>
                      <button onClick={() => handleReview(r.id, 'ACCEPTED')} className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors">
                        <CheckCircle2 size={15} /> Quick Accept
                      </button>
                      <button onClick={() => handleReview(r.id, 'REJECTED')} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-medium transition-colors">
                        <XCircle size={15} /> Quick Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageModal src={selectedImage} alt="Meter" onClose={() => setSelectedImage(null)} />
    </div>
  );
}