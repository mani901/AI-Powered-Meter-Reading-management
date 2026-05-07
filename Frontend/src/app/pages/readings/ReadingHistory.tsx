import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, ClipboardList, AlertTriangle, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePagination } from '../../hooks/usePagination';
import { SearchInput } from '../../components/common/SearchInput';
import { ReadingSourceBadge, ReadingStatusBadge } from '../../components/common/StatusBadge';
import { ConfidenceBar } from '../../components/common/ConfidenceBar';
import { Pagination } from '../../components/common/Pagination';
import { ImageModal } from '../../components/common/ImageModal';

export default function ReadingHistory() {
  const navigate = useNavigate();
  const { currentUser, meters, readings } = useApp();
  const [search, setSearch] = useState('');
  const [meterFilter, setMeterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [viewImage, setViewImage] = useState<string | null>(null);
  const PER_PAGE = 10;

  const userMeters = meters.filter(m => m.userId === currentUser?.id);
  const userReadings = readings
    .filter(r => r.userId === currentUser?.id)
    .filter(r => meterFilter === 'ALL' || r.meterId === meterFilter)
    .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
    .filter(r => sourceFilter === 'ALL' || r.source === sourceFilter)
    .filter(r => !search || r.meterSerial?.toLowerCase().includes(search.toLowerCase()) || r.meterLabel?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());

  const { page, setPage, totalPages, paginated } = usePagination(userReadings, PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reading History</h1>
          <p className="text-slate-500 text-sm">{userReadings.length} total readings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/readings/upload')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Camera size={16} /> Upload
          </button>
          <button onClick={() => navigate('/readings/manual')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <ClipboardList size={16} /> Manual
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by meter name or serial..."
            className="flex-1"
          />
          <select value={meterFilter} onChange={e => { setMeterFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Meters</option>
            {userMeters.map(m => <option key={m.id} value={m.id}>{m.meterLabel || m.meterSerial}</option>)}
          </select>
          <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Sources</option>
            <option value="AI_EXTRACTED">AI Extracted</option>
            <option value="MANUAL">Manual</option>
            <option value="AI_CORRECTED">AI Corrected</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="FLAGGED">Flagged</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <Camera size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-700 mb-2">No readings found</h3>
            <p className="text-slate-500 text-sm mb-4">Try adjusting your filters or upload your first reading.</p>
            <button onClick={() => navigate('/readings/upload')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
              Upload Reading
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date', 'Meter', 'Reading (kWh)', 'Consumption', 'Source', 'Confidence', 'Status', 'Image'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-slate-700 whitespace-nowrap">
                        {new Date(r.readingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-slate-900">{r.meterLabel}</p>
                        <p className="text-xs text-slate-400 font-mono">{r.meterSerial}</p>
                      </td>
                      <td className="px-5 py-3 font-mono font-medium text-slate-900 text-sm">{r.readingValue.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        {r.consumption !== undefined ? (
                          <div className={`flex items-center gap-1 text-xs font-medium ${r.isAnomalous ? 'text-red-600' : 'text-slate-700'}`}>
                            {r.isAnomalous && <AlertTriangle size={11} />}
                            {r.consumption} kWh
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <ReadingSourceBadge source={r.source} />
                      </td>
                      <td className="px-5 py-3">
                        {r.confidenceScore !== undefined ? (
                          <ConfidenceBar score={r.confidenceScore} />
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <ReadingStatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3">
                        {r.imageUrl ? (
                          <button onClick={() => setViewImage(r.imageUrl!)} className="text-blue-600 hover:text-blue-700 p-1 rounded">
                            <ImageIcon size={16} />
                          </button>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              summary={`Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, userReadings.length)} of ${userReadings.length}`}
            />
          </>
        )}
      </div>

      <ImageModal src={viewImage} alt="Meter reading" onClose={() => setViewImage(null)} />
    </div>
  );
}
