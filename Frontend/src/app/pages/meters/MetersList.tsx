import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Gauge,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { MeterCard } from './MeterCard';
import { useUserMeters } from '../../hooks/useUserData';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';

export default function MetersList() {
  const navigate = useNavigate();
  const { deleteMeter } = useApp();
  const allUserMeters = useUserMeters();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const userMeters = allUserMeters
    .filter(m => statusFilter === 'ALL' || m.status === statusFilter)
    .filter(m =>
      m.meterSerial.toLowerCase().includes(search.toLowerCase()) ||
      (m.meterLabel ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.location ?? '').toLowerCase().includes(search.toLowerCase())
    );

  const handleDelete = (id: string, label?: string) => {
    if (confirm(`Delete meter "${label ?? id}"? This action cannot be undone.`)) {
      deleteMeter(id);
      toast.success('Meter deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Meters"
        subtitle={`${allUserMeters.length} meters registered`}
        actions={(
          <button
            onClick={() => navigate('/meters/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors w-fit"
          >
            <Plus size={16} /> Add New Meter
          </button>
        )}
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {(['ALL', 'ACTIVE', 'INACTIVE', 'FAULTY'] as const).slice(1).map(status => {
          const count = allUserMeters.filter(m => m.status === status).length;
          const colors = { ACTIVE: 'border-l-green-500', INACTIVE: 'border-l-slate-400', FAULTY: 'border-l-red-500' };
          return (
            <div key={status} className={`bg-white border border-slate-200 border-l-4 ${colors[status]} rounded-xl p-4`}>
              <p className="text-slate-500 text-xs">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
              <p className="text-slate-900 text-2xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by serial, label, or location..."
          className="flex-1"
        />
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'INACTIVE', 'FAULTY'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {userMeters.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No meters found"
          description={search ? 'Try adjusting your search.' : "You haven't added any meters yet."}
          action={!search ? { label: 'Add Your First Meter', onClick: () => navigate('/meters/add') } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {userMeters.map(meter => (
            <MeterCard
              key={meter.id}
              meter={meter}
              onUpload={() => navigate('/readings/upload')}
              onView={() => navigate(`/meters/${meter.id}`)}
              onDelete={() => handleDelete(meter.id, meter.meterLabel)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
