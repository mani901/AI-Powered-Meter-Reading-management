import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Filter, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { apiFetchBlob } from '../../lib/apiClient';

export default function Export() {
  const { currentUser, meters } = useApp();
  const [exporting, setExporting] = useState('');
  const [readingForm, setReadingForm] = useState({ meterId: 'ALL', startDate: '2026-01-01', endDate: '2026-02-28', format: 'csv' });
  const [billForm, setBillForm] = useState({ startDate: '2025-09-01', endDate: '2026-02-28', format: 'csv' });

  const userMeters = meters.filter(m => m.userId === currentUser?.id);

  const handleExport = async (type: string, path: string, query?: Record<string, string>) => {
    setExporting(type);
    try {
      const qs = new URLSearchParams(query).toString();
      const fullPath = qs ? `${path}?${qs}` : path;
      const response = await apiFetchBlob(fullPath);
      const blob = await response.blob();
      const filename = getFilenameFromHeader(response.headers.get('content-disposition')) || getFallbackFileName(type);
      triggerDownload(blob, filename);
      toast.success(`${type} exported successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to export ${type}.`);
    } finally {
      setExporting('');
    }
  };

  const ExportCard = ({
    title, desc, icon: Icon, color, onExport, loading,
  }: {
    title: string; desc: string; icon: React.ElementType; color: string;
    onExport: () => void; loading: boolean;
  }) => (
    <button
      onClick={onExport}
      disabled={loading}
      className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 hover:border-blue-400 rounded-xl text-center transition-all hover:shadow-md group disabled:opacity-60"
    >
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {loading ? <Loader2 size={24} className="animate-spin text-white" /> : <Icon size={24} className="text-white" />}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>
        <p className="text-slate-500 text-sm mt-1">Download your readings and bills in CSV or PDF format</p>
      </div>

      {/* Quick export cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Export</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ExportCard title="Readings CSV" desc="All readings as spreadsheet" icon={FileSpreadsheet} color="bg-green-500" onExport={() => void handleExport('Readings CSV', '/api/export/readings.csv', { meterId: 'ALL' })} loading={exporting === 'Readings CSV'} />
          <ExportCard title="Readings PDF" desc="Formatted readings report" icon={FileText} color="bg-red-500" onExport={() => void handleExport('Readings PDF', '/api/export/readings.pdf', { meterId: 'ALL' })} loading={exporting === 'Readings PDF'} />
          <ExportCard title="Bills CSV" desc="All bills as spreadsheet" icon={FileSpreadsheet} color="bg-blue-500" onExport={() => void handleExport('Bills CSV', '/api/export/bills.csv')} loading={exporting === 'Bills CSV'} />
          <ExportCard title="Bills PDF" desc="Formatted billing report" icon={FileText} color="bg-purple-500" onExport={() => void handleExport('Bills PDF', '/api/export/bills.pdf')} loading={exporting === 'Bills PDF'} />
        </div>
      </div>

      {/* Custom reading export */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Filter size={18} className="text-slate-600" /> Custom Reading Export
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Meter</label>
            <select
              value={readingForm.meterId}
              onChange={e => setReadingForm(p => ({ ...p, meterId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Meters</option>
              {userMeters.map(m => <option key={m.id} value={m.id}>{m.meterLabel || m.meterSerial}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
            <input type="date" value={readingForm.startDate} onChange={e => setReadingForm(p => ({ ...p, startDate: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">End Date</label>
            <input type="date" value={readingForm.endDate} onChange={e => setReadingForm(p => ({ ...p, endDate: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Format</label>
            <select value={readingForm.format} onChange={e => setReadingForm(p => ({ ...p, format: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="pdf">PDF (Report)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-slate-600 text-xs font-medium mb-2">Columns included:</p>
          <div className="flex flex-wrap gap-2">
            {['Date', 'Meter Serial', 'Meter Label', 'Reading Value', 'Consumption (kWh)', 'Source', 'Confidence Score', 'Status'].map(c => (
              <span key={c} className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={11} className="text-green-500" /> {c}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => void handleExport(
          'Custom Readings',
          `/api/export/readings.${readingForm.format}`,
          {
            meterId: readingForm.meterId,
            from: readingForm.startDate,
            to: readingForm.endDate,
          },
        )} disabled={!!exporting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {exporting === 'Custom Readings' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export Readings ({readingForm.format.toUpperCase()})
        </button>
      </div>

      {/* Custom bill export */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-slate-600" /> Custom Bill Export
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Month</label>
            <input type="date" value={billForm.startDate} onChange={e => setBillForm(p => ({ ...p, startDate: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">End Month</label>
            <input type="date" value={billForm.endDate} onChange={e => setBillForm(p => ({ ...p, endDate: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Format</label>
            <select value={billForm.format} onChange={e => setBillForm(p => ({ ...p, format: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="pdf">PDF (Report)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-slate-600 text-xs font-medium mb-2">Columns included:</p>
          <div className="flex flex-wrap gap-2">
            {['Month', 'Meter', 'Units Consumed', 'Energy Charges', 'Fixed Charges', 'Tax Amount', 'Total', 'Status'].map(c => (
              <span key={c} className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={11} className="text-green-500" /> {c}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => void handleExport(
          'Custom Bills',
          `/api/export/bills.${billForm.format}`,
          {
            from: billForm.startDate,
            to: billForm.endDate,
          },
        )} disabled={!!exporting}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {exporting === 'Custom Bills' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export Bills ({billForm.format.toUpperCase()})
        </button>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getFilenameFromHeader(contentDisposition: string | null) {
  if (!contentDisposition) return null;
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return asciiMatch?.[1] ?? null;
}

function getFallbackFileName(type: string) {
  if (type.includes('Readings') && type.includes('PDF')) return 'readings.pdf';
  if (type.includes('Readings')) return 'readings.csv';
  if (type.includes('Bills') && type.includes('PDF')) return 'bills.pdf';
  return 'bills.csv';
}
