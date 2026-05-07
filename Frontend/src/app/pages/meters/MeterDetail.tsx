import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Camera, Pencil, Trash2, MapPin, Calendar, Hash, Zap, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

const statusConfig = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  FAULTY: 'bg-red-100 text-red-700 border-red-200',
};

export default function MeterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { meters, readings, deleteMeter } = useApp();

  const meter = meters.find(m => m.id === id);
  const meterReadings = readings.filter(r => r.meterId === id).sort((a, b) =>
    new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
  );

  const chartData = meterReadings.slice(0, 6).reverse().map(r => ({
    date: new Date(r.readingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    consumption: r.consumption ?? 0,
  }));

  if (!meter) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Meter not found.</p>
        <button onClick={() => navigate('/meters')} className="mt-4 text-blue-600 hover:underline text-sm">Back to meters</button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete meter "${meter.meterLabel}"? All readings will also be removed.`)) {
      deleteMeter(meter.id);
      toast.success('Meter deleted');
      navigate('/meters');
    }
  };

  const sourceColors: Record<string, string> = {
    AI_EXTRACTED: 'bg-blue-100 text-blue-700',
    MANUAL: 'bg-slate-100 text-slate-600',
    AI_CORRECTED: 'bg-indigo-100 text-indigo-700',
  };
  const statusColors: Record<string, string> = {
    ACCEPTED: 'bg-green-100 text-green-700',
    FLAGGED: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-700',
    PENDING_REVIEW: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/meters')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{meter.meterLabel || meter.meterSerial}</h1>
            <p className="text-slate-500 text-sm font-mono">{meter.meterSerial}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/readings/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Camera size={16} /> Upload Reading
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Meter Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Hash, label: 'Serial Number', value: meter.meterSerial },
              { icon: Zap, label: 'Meter Type', value: meter.meterType.charAt(0).toUpperCase() + meter.meterType.slice(1) },
              { icon: Calendar, label: 'Installation Date', value: meter.installationDate ? new Date(meter.installationDate).toLocaleDateString('en-GB') : '—' },
              { icon: Hash, label: 'Digit Wheels', value: `${meter.maxDigits} digits` },
              { icon: MapPin, label: 'Location', value: meter.location || '—' },
              { icon: Zap, label: 'Status', value: meter.status },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon size={14} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">{item.label}</p>
                  <p className={`text-slate-900 text-sm font-medium ${item.label === 'Status' ? `inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusConfig[meter.status]}` : ''}`}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
            <p className="text-blue-200 text-xs mb-1">Latest Reading</p>
            <p className="text-4xl font-bold font-mono">{meter.lastReadingValue?.toLocaleString() ?? '—'}</p>
            <p className="text-blue-200 text-xs mt-1">kWh</p>
            {meter.lastReadingDate && (
              <p className="text-blue-300 text-xs mt-2">
                {new Date(meter.lastReadingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-slate-500 text-xs">Total Readings</p>
            <p className="text-slate-900 text-2xl font-bold">{meterReadings.length}</p>
            <p className="text-slate-400 text-xs mt-1">Across all time</p>
          </div>
        </div>
      </div>

      {/* Mini chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Consumption (kWh)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: any) => [`${v} kWh`, 'Consumption']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="consumption" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Readings table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Reading History</h3>
          <button onClick={() => navigate('/readings')} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View all readings</button>
        </div>
        {meterReadings.length === 0 ? (
          <div className="text-center py-12">
            <Camera size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No readings yet</p>
            <button onClick={() => navigate('/readings/upload')} className="mt-3 text-blue-600 text-sm hover:underline">Upload first reading</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Date', 'Reading', 'Consumption', 'Source', 'Confidence', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meterReadings.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-700">{new Date(r.readingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-3 text-sm font-mono font-medium text-slate-900">{r.readingValue.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      {r.consumption !== undefined ? (
                        <span className={`text-xs font-medium flex items-center gap-1 ${r.isAnomalous ? 'text-red-600' : 'text-slate-700'}`}>
                          {r.isAnomalous && <AlertTriangle size={11} />}
                          {r.consumption} kWh
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[r.source]}`}>
                        {r.source === 'AI_EXTRACTED' ? 'AI' : r.source === 'MANUAL' ? 'Manual' : 'Corrected'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {r.confidenceScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${r.confidenceScore >= 0.85 ? 'bg-green-500' : r.confidenceScore >= 0.65 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${r.confidenceScore * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{(r.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
