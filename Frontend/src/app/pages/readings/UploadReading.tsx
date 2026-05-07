import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Camera, Upload, X, Loader2, CheckCircle2,
  AlertTriangle, RotateCcw, Pencil, ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { ConfidenceBadge } from '../../components/common/ConfidenceBadge';
import { apiFetch } from '../../lib/apiClient';

type Step = 'select' | 'upload' | 'analyzing' | 'result' | 'confirmed';

interface AIResult {
  readingValue: number;
  confidenceScore: number;
  meterType: string;
  previousReading?: number;
  consumption?: number;
  isAnomalous: boolean;
  anomalyReason?: string;
}

const STEPS = ['Select Meter', 'Upload Image', 'AI Analysis', 'Confirm'];

export default function UploadReading() {
  const navigate = useNavigate();
  const { currentUser, meters, addReading } = useApp();
  const [step, setStep] = useState<Step>('select');
  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [correctedValue, setCorrectedValue] = useState('');
  const [isCorreeting, setIsCorreeting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const userMeters = meters.filter(m => m.userId === currentUser?.id && m.status === 'ACTIVE');
  const selectedMeter = meters.find(m => m.id === selectedMeterId);

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Invalid file type. Please use JPG, PNG, or WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10MB allowed.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const runAiExtraction = async () => {
    if (!imageFile || !selectedMeterId) return;
    setStep('analyzing');
    try {
      const formData = new FormData();
      formData.append('meterId', selectedMeterId);
      formData.append('image', imageFile);
      formData.append('readingDate', readingDate);

      const res = await apiFetch<{
        preview: {
          readingValue: number;
          confidenceScore: number;
          source: 'AI_EXTRACTED';
          imageUrl?: string;
          meterType?: string;
          previousReading?: number;
          consumption?: number;
          isAnomalous: boolean;
          anomalyReason?: string;
        };
      }>('/api/readings/upload', { method: 'POST', body: formData });

      setImagePreview(res.preview.imageUrl ?? imagePreview);
      setAiResult({
        readingValue: res.preview.readingValue,
        confidenceScore: res.preview.confidenceScore,
        meterType: res.preview.meterType ?? selectedMeter?.meterType ?? 'analog',
        previousReading: res.preview.previousReading,
        consumption: res.preview.consumption,
        isAnomalous: res.preview.isAnomalous,
        anomalyReason: res.preview.anomalyReason,
      });
      setStep('result');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI extraction failed.');
      setStep('upload');
    }
  };

  const handleAccept = async (correctedVal?: number) => {
    if (!aiResult || !currentUser) return;
    const finalValue = correctedVal ?? aiResult.readingValue;
    const source = correctedVal ? 'AI_CORRECTED' : 'AI_EXTRACTED';
    const status = aiResult.confidenceScore >= 0.75 ? 'ACCEPTED' : 'FLAGGED';

    try {
      await addReading({
        meterId: selectedMeterId,
        meterSerial: selectedMeter?.meterSerial,
        meterLabel: selectedMeter?.meterLabel,
        userId: currentUser.id,
        readingValue: finalValue,
        previousReading: aiResult.previousReading,
        consumption: aiResult.consumption,
        readingDate,
        imageUrl: imagePreview ?? undefined,
        source,
        confidenceScore: aiResult.confidenceScore,
        status,
        isAnomalous: aiResult.isAnomalous,
        anomalyReason: aiResult.anomalyReason,
      });
      toast.success(status === 'ACCEPTED' ? 'Reading accepted successfully!' : 'Reading submitted for review (low confidence).');
      setStep('confirmed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit reading.');
    }
  };

  const stepIndex = { select: 0, upload: 1, analyzing: 2, result: 2, confirmed: 3 }[step];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/readings')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Meter Reading</h1>
          <p className="text-slate-500 text-sm">Let AI extract the reading from your meter image</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${idx <= stepIndex ? 'text-blue-600' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all
                ${idx < stepIndex ? 'bg-blue-600 border-blue-600 text-white'
                  : idx === stepIndex ? 'border-blue-600 text-blue-600'
                  : 'border-slate-200 text-slate-400'}`}
              >
                {idx < stepIndex ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${idx === stepIndex ? 'text-blue-600' : idx < stepIndex ? 'text-slate-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${idx < stepIndex ? 'bg-blue-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Select Meter */}
      {step === 'select' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Select Meter</h2>
          {userMeters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-4">No active meters found. Add a meter first.</p>
              <button onClick={() => navigate('/meters/add')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">Add Meter</button>
            </div>
          ) : (
            <div className="space-y-3">
              {userMeters.map(m => (
                <label key={m.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                  ${selectedMeterId === m.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <input type="radio" name="meter" value={m.id} checked={selectedMeterId === m.id} onChange={() => setSelectedMeterId(m.id)} className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{m.meterLabel || m.meterSerial}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Serial: {m.meterSerial} • {m.meterType} • Last: {m.lastReadingValue?.toLocaleString() ?? 'N/A'} kWh</p>
                  </div>
                  {selectedMeterId === m.id && <CheckCircle2 size={20} className="text-blue-500" />}
                </label>
              ))}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reading Date</label>
                <input type="date" value={readingDate} onChange={e => setReadingDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <button disabled={!selectedMeterId} onClick={() => setStep('upload')}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Upload Meter Image</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {selectedMeter?.meterLabel ?? selectedMeter?.meterSerial}
              </span>
            </div>

            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
              >
                <Camera size={40} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-700 font-medium mb-1">Drop your meter image here</p>
                <p className="text-slate-500 text-sm mb-4">or click to browse files</p>
                <div className="flex gap-3 justify-center">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Upload size={15} /> Choose File
                  </span>
                  <label className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer">
                    <Camera size={15} />
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    Use Camera
                  </label>
                </div>
                <p className="text-slate-400 text-xs mt-4">JPG, PNG, WebP • Max 10MB</p>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Meter" className="w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-slate-50" />
                <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="mt-3 text-center text-xs text-slate-500">
                  {imageFile?.name} • {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('select')} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Back
            </button>
            <button disabled={!imagePreview} onClick={runAiExtraction}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={16} /> Extract Reading
            </button>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin" />
            <Camera size={28} className="absolute inset-0 m-auto text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Meter Image</h3>
          <p className="text-slate-500 text-sm mb-1">Google Gemini Vision AI is extracting your reading...</p>
          <p className="text-slate-400 text-xs">This usually takes 2-3 seconds</p>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && aiResult && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Image */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-3">Uploaded Image</p>
              <img src={imagePreview!} alt="Meter" className="w-full rounded-xl border border-slate-100 object-contain max-h-64 bg-slate-50" />
            </div>

            {/* Result */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">Extracted Reading</p>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <div>
                <p className="text-5xl font-bold font-mono text-slate-900">{aiResult.readingValue.toLocaleString()}</p>
                <p className="text-slate-400 text-sm mt-1">kWh</p>
              </div>
              <ConfidenceBadge score={aiResult.confidenceScore} />

              {aiResult.previousReading !== undefined && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Previous Reading</span>
                    <span className="text-slate-700 font-medium font-mono">{aiResult.previousReading.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Consumption</span>
                    <span className="text-slate-700 font-medium">{aiResult.consumption} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Meter Type</span>
                    <span className="text-slate-700 capitalize">{aiResult.meterType}</span>
                  </div>
                </div>
              )}

              {aiResult.isAnomalous && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-700 text-xs font-medium">Anomaly Detected</p>
                    <p className="text-amber-600 text-xs mt-0.5">{aiResult.anomalyReason}</p>
                  </div>
                </div>
              )}

              {aiResult.confidenceScore < 0.75 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-xs">Low confidence reading will be sent to admin for review.</p>
                </div>
              )}

              {/* Correction field */}
              {isCorreeting && (
                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Corrected Reading Value</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={correctedValue}
                      onChange={e => setCorrectedValue(e.target.value)}
                      placeholder={String(aiResult.readingValue)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => correctedValue && handleAccept(parseFloat(correctedValue))}
                      disabled={!correctedValue}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => { setStep('upload'); setAiResult(null); }}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={15} /> Re-upload
            </button>
            <button onClick={() => setIsCorreeting(p => !p)}
              className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Pencil size={15} /> Correct
            </button>
            <button onClick={() => handleAccept()}
              className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 size={15} /> Accept
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirmed */}
      {step === 'confirmed' && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Reading Saved!</h3>
          <p className="text-slate-500 text-sm mb-8">Your meter reading has been recorded successfully.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep('select'); setImagePreview(null); setImageFile(null); setAiResult(null); setSelectedMeterId(''); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              Upload Another
            </button>
            <button onClick={() => navigate('/readings')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              View History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
