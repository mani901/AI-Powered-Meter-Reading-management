import { useState } from 'react';
import { Camera, Gauge, MoreVertical, Trash2, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import type { Meter } from '../../types';
import { METER_STATUS_BADGE } from '../../constants/statusConfig';

const statusConfig = {
  PENDING: { label: 'Pending Approval', icon: Clock, color: METER_STATUS_BADGE.PENDING },
  ACTIVE: { label: 'Active', icon: CheckCircle2, color: METER_STATUS_BADGE.ACTIVE },
  INACTIVE: { label: 'Inactive', icon: XCircle, color: METER_STATUS_BADGE.INACTIVE },
  FAULTY: { label: 'Faulty', icon: AlertTriangle, color: METER_STATUS_BADGE.FAULTY },
  REJECTED: { label: 'Rejected', icon: XCircle, color: METER_STATUS_BADGE.REJECTED },
};

export function MeterCard({
  meter,
  onUpload,
  onDelete,
  onView,
}: {
  meter: Meter;
  onUpload?: () => void;
  onDelete?: () => void;
  onView: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = statusConfig[meter.status];
  const StatusIcon = status.icon;
  const hasMenuItems = onUpload || onDelete;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
            <Gauge size={20} className="text-blue-300" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{meter.meterLabel || 'Unnamed Meter'}</p>
            <p className="text-slate-400 text-xs font-mono">{meter.meterSerial}</p>
          </div>
        </div>
        {hasMenuItems && (
          <div className="relative">
            <button onClick={() => setMenuOpen(p => !p)} className="text-slate-400 hover:text-white p-1 rounded">
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl z-10 min-w-40 overflow-hidden">
                <button onClick={() => { onView(); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Gauge size={14} /> View Details
                </button>
                {onUpload && (
                  <button onClick={() => { onUpload(); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2">
                    <Camera size={14} /> Upload Reading
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="border-t border-slate-100" />
                    <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Trash2 size={14} /> Delete Meter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
            <StatusIcon size={12} />
            {status.label}
          </span>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full capitalize">{meter.meterType}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">Last Reading</span>
            <span className="text-slate-900 font-mono font-medium text-sm">
              {meter.lastReadingValue?.toLocaleString() ?? '—'}
              <span className="text-slate-400 font-normal text-xs ml-1">kWh</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">Last Updated</span>
            <span className="text-slate-700 text-xs">
              {meter.lastReadingDate ? new Date(meter.lastReadingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">Location</span>
            <span className="text-slate-700 text-xs truncate max-w-32">{meter.location || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">Digits</span>
            <span className="text-slate-700 text-xs">{meter.maxDigits}-digit</span>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {onUpload && (
            meter.status === 'PENDING' || meter.status === 'REJECTED' ? (
              <div className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border ${
                meter.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {meter.status === 'PENDING' ? <><Clock size={13} /> Awaiting Approval</> : <><XCircle size={13} /> Registration Rejected</>}
              </div>
            ) : (
              <button
                onClick={onUpload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera size={13} /> Upload Reading
              </button>
            )
          )}
          <button
            onClick={onView}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

