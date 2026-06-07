import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Gauge, MapPin, User, Calendar, Camera, Search } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useStaff } from '../../hooks/useStaff';

export default function StaffMeters() {
  const navigate = useNavigate();
  const { assignedMeters, loading } = useStaff();
  const [search, setSearch] = useState('');

  const filtered = assignedMeters.filter(a =>
    !search ||
    a.meter.meterSerial.toLowerCase().includes(search.toLowerCase()) ||
    (a.meter.meterLabel ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (a.meter.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assigned Meters"
        subtitle={`${assignedMeters.length} meter${assignedMeters.length !== 1 ? 's' : ''} assigned to you`}
        actions={
          <button
            onClick={() => navigate('/staff/submit')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Camera size={16} /> Submit Reading
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search meters by serial, label or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Meters grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Gauge size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            {search ? 'No meters match your search' : 'No meters assigned yet'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? 'Try a different search term' : 'Contact your admin to get meters assigned'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div key={a.assignmentId} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {a.meter.meterLabel ?? a.meter.meterSerial}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-mono">{a.meter.meterSerial}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  a.meter.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  a.meter.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {a.meter.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-500">
                {a.meter.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{a.meter.location}</span>
                  </div>
                )}
                {a.meter.owner && (
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{a.meter.owner.firstName} {a.meter.owner.lastName}</span>
                  </div>
                )}
                {a.meter.lastReadingDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                    <span>Last reading: {a.meter.lastReadingDate}</span>
                  </div>
                )}
                {a.meter.lastReadingValue != null && (
                  <div className="flex items-center gap-2">
                    <Gauge size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{a.meter.lastReadingValue.toLocaleString()} kWh</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => navigate('/staff/submit', { state: { meterId: a.meter.id, meterSerial: a.meter.meterSerial, meterLabel: a.meter.meterLabel } })}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Camera size={13} /> Submit Reading
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
