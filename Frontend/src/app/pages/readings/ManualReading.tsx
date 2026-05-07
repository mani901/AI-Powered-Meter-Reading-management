import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ClipboardList, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

export default function ManualReading() {
  const navigate = useNavigate();
  const { currentUser, meters, addReading } = useApp();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ meterId: '', readingValue: '', readingDate: new Date().toISOString().split('T')[0], notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState('');

  const userMeters = meters.filter(m => m.userId === currentUser?.id && m.status === 'ACTIVE');
  const selectedMeter = meters.find(m => m.id === form.meterId);

  const checkValue = (value: string) => {
    if (!selectedMeter || !value) { setWarning(''); return; }
    const lastReading = selectedMeter.lastReadingValue ?? 0;
    if (parseFloat(value) < lastReading) {
      setWarning(`Warning: Entered value (${Number(value).toLocaleString()}) is lower than previous reading (${lastReading.toLocaleString()}). This may indicate a meter reset.`);
    } else {
      setWarning('');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.meterId) e.meterId = 'Please select a meter';
    if (!form.readingValue || parseFloat(form.readingValue) < 0) e.readingValue = 'Valid reading value is required';
    if (!form.readingDate) e.readingDate = 'Reading date is required';
    if (form.readingDate > new Date().toISOString().split('T')[0]) e.readingDate = 'Reading date cannot be in the future';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser) return;

    if (warning && !confirm('There is an anomaly with this reading. Do you want to proceed?')) return;

    setLoading(true);
    try {
      const lastReading = selectedMeter?.lastReadingValue ?? undefined;
      const consumption = lastReading !== undefined ? parseFloat(form.readingValue) - lastReading : undefined;

      await addReading({
        meterId: form.meterId,
        meterSerial: selectedMeter?.meterSerial,
        meterLabel: selectedMeter?.meterLabel,
        userId: currentUser.id,
        readingValue: parseFloat(form.readingValue),
        previousReading: lastReading,
        consumption: consumption !== undefined ? consumption : undefined,
        readingDate: form.readingDate,
        source: 'MANUAL',
        status: 'ACCEPTED',
        isAnomalous: parseFloat(form.readingValue) < (lastReading ?? 0),
        anomalyReason: parseFloat(form.readingValue) < (lastReading ?? 0) ? 'Manual reading lower than previous reading' : undefined,
      });

      toast.success('Manual reading submitted successfully!');
      setSubmitted(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit reading.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg">
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Reading Submitted!</h3>
          <p className="text-slate-500 text-sm mb-2">Your manual reading has been recorded for</p>
          <p className="text-blue-600 font-medium mb-8">{selectedMeter?.meterLabel ?? selectedMeter?.meterSerial}</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Reading Value</span>
              <span className="font-mono font-medium text-slate-900">{Number(form.readingValue).toLocaleString()} kWh</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-700">{new Date(form.readingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSubmitted(false); setForm({ meterId: '', readingValue: '', readingDate: new Date().toISOString().split('T')[0], notes: '' }); setWarning(''); }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium">
              Add Another
            </button>
            <button onClick={() => navigate('/readings')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/readings')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manual Entry</h1>
          <p className="text-slate-500 text-sm">Submit a meter reading manually</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ClipboardList size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-0.5">Manual Entry Mode</p>
          <p className="text-xs text-blue-600">Use this when you can read the meter directly but don't want to upload a photo. Manual readings are marked as MANUAL source.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Meter <span className="text-red-500">*</span></label>
            <select
              value={form.meterId}
              onChange={e => setForm(p => ({ ...p, meterId: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm transition-all ${errors.meterId ? 'border-red-400' : 'border-slate-200'}`}
            >
              <option value="">Choose a meter...</option>
              {userMeters.map(m => (
                <option key={m.id} value={m.id}>{m.meterLabel || m.meterSerial} — Last: {m.lastReadingValue?.toLocaleString() ?? 'N/A'}</option>
              ))}
            </select>
            {errors.meterId && <p className="text-red-500 text-xs mt-1">{errors.meterId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Reading (kWh) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={form.readingValue}
              onChange={e => { setForm(p => ({ ...p, readingValue: e.target.value })); checkValue(e.target.value); }}
              placeholder="e.g. 45321"
              min="0"
              step="0.01"
              className={`w-full px-4 py-2.5 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm transition-all ${errors.readingValue ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.readingValue && <p className="text-red-500 text-xs mt-1">{errors.readingValue}</p>}
            {selectedMeter?.lastReadingValue && (
              <p className="text-slate-400 text-xs mt-1">Previous reading: {selectedMeter.lastReadingValue.toLocaleString()} kWh</p>
            )}
          </div>

          {warning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs">{warning}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reading Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.readingDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, readingDate: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm transition-all ${errors.readingDate ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.readingDate && <p className="text-red-500 text-xs mt-1">{errors.readingDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional notes about this reading..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/readings')} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Submit Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
