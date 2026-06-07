import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Gauge } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MeterCard } from './MeterCard';
import { useUserMeters } from '../../hooks/useUserData';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';

export default function MetersList() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const allUserMeters = useUserMeters();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isAdmin = currentUser?.role === 'ADMIN';

  const userMeters = allUserMeters
    .filter(m => statusFilter === 'ALL' || m.status === statusFilter)
    .filter(m =>
      m.meterSerial.toLowerCase().includes(search.toLowerCase()) ||
      (m.meterLabel ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.location ?? '').toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Meters"
        subtitle={`${allUserMeters.length} meter${allUserMeters.length !== 1 ? 's' : ''} assigned to your account`}
        actions={isAdmin ? (
          <button onClick={() => navigate('/admin/meters')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Manage All Meters
          </button>
        ) : undefined}
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['PENDING', 'ACTIVE', 'INACTIVE', 'FAULTY'] as const).map(status => {
          const count = allUserMeters.filter(m => m.status === status).length;
          const colors = {
            PENDING: 'border-l-amber-500',
            ACTIVE: 'border-l-green-500',
            INACTIVE: 'border-l-slate-400',
            FAULTY: 'border-l-red-500',
          };
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
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'ACTIVE', 'INACTIVE', 'FAULTY', 'REJECTED'].map(s => (
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
          description={search ? 'Try adjusting your search.' : 'No meters assigned to your account yet. Contact your admin.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {userMeters.map(meter => (
            <MeterCard
              key={meter.id}
              meter={meter}
              onView={() => navigate(`/meters/${meter.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
