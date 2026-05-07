import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Camera, CheckCircle2, AlertTriangle, Loader2, Upload } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useStaff } from '../../hooks/useStaff';
import type { StaffMeterAssignment } from '../../types';

interface LocationState {
  meterId?: string;
  meterSerial?: string;
  meterLabel?: string;
}

export default function StaffReadingSubmit() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const { assignedMeters, submitReading, uploadReadingImage, loading } = useStaff();

  const [selectedMeter, setSelectedMeter] = useState<StaffMeterAssignment | null>(
    state.meterId ? (assignedMeters.find(a => a.meter.id === state.meterId) ?? null) : null
  );
  const [readingValue, setReadingValue] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ readingValue: number; confidenceScore: number; imageUrl: string; imagePublicId: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setAiResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAIExtract = async () => {
    if (!imageFile || !selectedMeter) return;
    setUploading(true);
    setError('');
    try {
      const result = await uploadReadingImage(selectedMeter.meter.id, imageFile);
      setAiResult(result);
      setReadingValue(String(Math.round(result.readingValue)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI extraction failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter || !readingValue || !readingDate) return;
    setSubmitting(true);
    setError('');
    try {
      await submitReading({
        meterId: selectedMeter.meter.id,
        readingValue: Number(readingValue),
        readingDate,
        source: aiResult ? (Math.abs(Number(readingValue) - aiResult.readingValue) > 1 ? 'AI_CORRECTED' : 'AI_EXTRACTED') : 'MANUAL',
        confidenceScore: aiResult?.confidenceScore,
        imageUrl: aiResult?.imageUrl,
        imagePublicId: aiResult?.imagePublicId,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center bg-white border border-slate-200 rounded-xl p-10">
        <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Reading Submitted!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your reading has been submitted and is pending admin review.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSubmitted(false); setSelectedMeter(null); setReadingValue(''); setAiResult(null); setImageFile(null); setImagePreview(null); }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={() => navigate('/staff/history')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Submit Reading" subtitle="Select a meter and enter the reading value" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meter Selection */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Meter *</label>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading meters...</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {assignedMeters.filter(a => a.meter.status === 'ACTIVE').map(a => (
                <button
                  key={a.assignmentId}
                  type="button"
                  onClick={() => setSelectedMeter(a)}
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    selectedMeter?.assignmentId === a.assignmentId
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 hover:border-emerald-300 text-slate-700'
                  }`}
                >
                  <p className="font-medium">{a.meter.meterLabel ?? a.meter.meterSerial}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.meter.meterSerial}{a.meter.location ? ` · ${a.meter.location}` : ''}
                    {a.meter.owner ? ` · ${a.meter.owner.firstName} ${a.meter.owner.lastName}` : ''}
                  </p>
                  {a.meter.lastReadingValue != null && (
                    <p className="text-xs text-slate-400 mt-0.5">Last: {a.meter.lastReadingValue.toLocaleString()} kWh on {a.meter.lastReadingDate}</p>
                  )}
                </button>
              ))}
              {assignedMeters.filter(a => a.meter.status === 'ACTIVE').length === 0 && (
                <p className="text-slate-400 text-sm">No active meters assigned to you.</p>
              )}
            </div>
          )}
        </div>

        {selectedMeter && (
          <>
            {/* Photo Upload + AI */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Meter Photo (Optional)</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-emerald-400 transition-colors">
                  <Upload size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-500">{imageFile ? imageFile.name : 'Click to upload meter image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Meter" className="w-full max-h-48 object-contain rounded-lg border border-slate-200" />
                )}
                {imageFile && !aiResult && (
                  <button
                    type="button"
                    onClick={handleAIExtract}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                    {uploading ? 'Extracting...' : 'Extract with AI'}
                  </button>
                )}
                {aiResult && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-blue-800 font-medium">AI extracted: {Math.round(aiResult.readingValue).toLocaleString()} kWh</p>
                      <p className="text-blue-600 text-xs">Confidence: {Math.round(aiResult.confidenceScore * 100)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reading Value */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Reading Value (kWh) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={readingValue}
                onChange={e => setReadingValue(e.target.value)}
                placeholder="Enter reading from meter display"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {selectedMeter.meter.lastReadingValue != null && readingValue && Number(readingValue) < selectedMeter.meter.lastReadingValue && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 text-xs">
                  <AlertTriangle size={13} />
                  <span>Reading is lower than previous reading ({selectedMeter.meter.lastReadingValue.toLocaleString()}). This will be flagged.</span>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Reading Date *</label>
              <input
                type="date"
                required
                value={readingDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setReadingDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !readingValue || !selectedMeter}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {submitting ? 'Submitting...' : 'Submit Reading'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
