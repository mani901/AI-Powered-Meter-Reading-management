import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Gauge, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

interface FormData {
  meterSerial: string; meterLabel: string; meterType: 'analog' | 'digital';
  installationDate: string; location: string; maxDigits: string; initialReading: string;
}

export default function AddMeter() {
  const navigate = useNavigate();
  const { currentUser, addMeter, meters } = useApp();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [form, setForm] = useState<FormData>({
    meterSerial: '', meterLabel: '', meterType: 'analog',
    installationDate: '', location: '', maxDigits: '5', initialReading: '',
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.meterSerial.trim()) e.meterSerial = 'Serial number is required';
    else if (!/^[A-Za-z0-9\-]{4,20}$/.test(form.meterSerial)) e.meterSerial = 'Must be 4-20 alphanumeric characters';
    else if (meters.some(m => m.meterSerial === form.meterSerial)) e.meterSerial = 'This serial number is already registered';
    if (!form.meterType) e.meterType = 'Meter type is required';
    const userMeters = meters.filter(m => m.userId === currentUser?.id);
    if (userMeters.length >= 10) e.meterSerial = 'Maximum 10 meters allowed per account';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    addMeter({
      userId: currentUser.id,
      meterSerial: form.meterSerial.toUpperCase(),
      meterLabel: form.meterLabel || undefined,
      meterType: form.meterType,
      installationDate: form.installationDate || undefined,
      location: form.location || undefined,
      status: 'ACTIVE',
      maxDigits: parseInt(form.maxDigits) || 5,
      initialReading: form.initialReading ? parseFloat(form.initialReading) : undefined,
      lastReadingValue: form.initialReading ? parseFloat(form.initialReading) : undefined,
    });
    setLoading(false);
    toast.success('Meter registered successfully!');
    navigate('/meters');
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-2.5 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all
    ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'}`;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/meters')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Meter</h1>
          <p className="text-slate-500 text-sm">Register a new electricity meter to your account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Gauge size={16} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Meter Information</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Meter Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.meterSerial}
                  onChange={set('meterSerial')}
                  placeholder="e.g. KHI-2024-0081"
                  className={inputClass('meterSerial')}
                />
                {errors.meterSerial && <p className="text-red-500 text-xs mt-1">{errors.meterSerial}</p>}
                <p className="text-slate-400 text-xs mt-1">Found on the meter plate, 4-20 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Meter Label / Name</label>
                <input value={form.meterLabel} onChange={set('meterLabel')} placeholder="e.g. Home Main Meter" className={inputClass('meterLabel')} />
                <p className="text-slate-400 text-xs mt-1">A friendly name to identify this meter</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Meter Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.meterType}
                  onChange={set('meterType')}
                  className={inputClass('meterType')}
                >
                  <option value="analog">Analog (Mechanical Dial)</option>
                  <option value="digital">Digital (LCD Display)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Number of Digit Wheels</label>
                <select value={form.maxDigits} onChange={set('maxDigits')} className={inputClass('maxDigits')}>
                  {[4, 5, 6, 7].map(n => <option key={n} value={n}>{n} digits</option>)}
                </select>
                <p className="text-slate-400 text-xs mt-1">For analog meters only</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Reading (kWh)</label>
              <input type="number" value={form.initialReading} onChange={set('initialReading')} placeholder="e.g. 41000" min="0" className={inputClass('initialReading')} />
              <p className="text-slate-400 text-xs mt-1">The reading when you first registered this meter</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-5">
          <h2 className="font-semibold text-slate-900 mb-5">Installation Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Installation Date</label>
                <input type="date" value={form.installationDate} onChange={set('installationDate')} className={inputClass('installationDate')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location Description</label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. DHA Phase 6, House 12, Ground Floor" className={inputClass('location')} />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">After adding your meter:</p>
              <ul className="space-y-0.5 text-xs text-blue-600">
                <li>• You can upload meter images for AI-powered reading extraction</li>
                <li>• Track monthly consumption and view analytics</li>
                <li>• Receive automatic billing estimates based on NEPRA tariffs</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/meters')} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Registering...</> : 'Register Meter'}
          </button>
        </div>
      </form>
    </div>
  );
}
