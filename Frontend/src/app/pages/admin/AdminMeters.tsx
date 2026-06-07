import { useState } from 'react';
import { Plus, Gauge, MapPin, User, Users, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { useAdminMeters, useAdmin, useAdminStaff } from '../../hooks/useAdmin';
import { useApp } from '../../context/AppContext';
import type { Meter } from '../../types';

export default function AdminMeters() {
  const { meters, loading, refresh } = useAdminMeters();
  const { createMeter, assignMeterOwner, assignMeterStaff, unassignMeterStaff, updateMeter } = useAdmin();
  const { staff } = useAdminStaff();
  const { users } = useApp();
  const consumers = users.filter(u => u.role === 'CONSUMER');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [assigningOwner, setAssigningOwner] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [form, setForm] = useState({ meterSerial: '', meterLabel: '', meterType: 'digital' as 'analog' | 'digital', location: '', maxDigits: 5, initialReading: '', consumerId: '' });
  const [ownerSelect, setOwnerSelect] = useState('');
  const [staffSelect, setStaffSelect] = useState('');

  const filtered = meters.filter(m =>
    (statusFilter === 'ALL' || m.status === statusFilter) &&
    (!search || m.meterSerial.toLowerCase().includes(search.toLowerCase()) || (m.meterLabel ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createMeter({
        meterSerial: form.meterSerial,
        meterLabel: form.meterLabel || undefined,
        meterType: form.meterType,
        location: form.location || undefined,
        maxDigits: form.maxDigits,
        initialReading: form.initialReading ? Number(form.initialReading) : undefined,
        consumerId: form.consumerId || undefined,
      });
      toast.success('Meter created successfully');
      setShowCreate(false);
      setForm({ meterSerial: '', meterLabel: '', meterType: 'digital', location: '', maxDigits: 5, initialReading: '', consumerId: '' });
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create meter');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignOwner = async () => {
    if (!selectedMeter || !ownerSelect) return;
    setAssigningOwner(true);
    try {
      await assignMeterOwner(selectedMeter.id, ownerSelect);
      toast.success('Meter owner assigned');
      setOwnerSelect('');
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign owner');
    } finally {
      setAssigningOwner(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedMeter || !staffSelect) return;
    setAssigningStaff(true);
    try {
      await assignMeterStaff(selectedMeter.id, staffSelect);
      toast.success('Staff assigned to meter');
      setStaffSelect('');
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign staff');
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleStatusToggle = async (m: Meter) => {
    try {
      const newStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateMeter(m.id, { status: newStatus });
      toast.success(`Meter ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const ownerName = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}` : '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meter Management"
        subtitle={`${meters.length} total meters`}
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Create Meter
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['ACTIVE', 'INACTIVE', 'PENDING', 'FAULTY'].map(s => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-slate-500 text-xs">{s}</p>
            <p className="text-2xl font-bold text-slate-900">{meters.filter(m => m.status === s).length}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by serial or label..." className="flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
          <option value="FAULTY">Faulty</option>
        </select>
      </div>

      {/* Meters Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Gauge size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No meters found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{m.meterLabel ?? m.meterSerial}</p>
                  <p className="text-xs text-slate-400 font-mono">{m.meterSerial}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  m.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                  m.status === 'FAULTY' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{m.status}</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                {m.location && (
                  <div className="flex items-center gap-1.5"><MapPin size={11} /> {m.location}</div>
                )}
                <div className="flex items-center gap-1.5"><User size={11} /> Owner: {ownerName(m.userId)}</div>
                {m.lastReadingValue != null && (
                  <div className="flex items-center gap-1.5"><Gauge size={11} /> Last: {m.lastReadingValue.toLocaleString()} kWh ({m.lastReadingDate ?? '—'})</div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelectedMeter(m)} className="flex-1 text-xs py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                  <Users size={11} /> Assign
                </button>
                <button onClick={() => void handleStatusToggle(m)} className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                  m.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}>
                  {m.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Meter Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Create Meter</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={e => void handleCreate(e)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Meter Serial *</label>
                  <input required value={form.meterSerial} onChange={e => setForm(p => ({ ...p, meterSerial: e.target.value }))} placeholder="e.g. MTR-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Label / Name</label>
                  <input value={form.meterLabel} onChange={e => setForm(p => ({ ...p, meterLabel: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type *</label>
                  <select value={form.meterType} onChange={e => setForm(p => ({ ...p, meterType: e.target.value as 'analog' | 'digital' }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="digital">Digital</option>
                    <option value="analog">Analog</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Digits</label>
                  <input type="number" min={4} max={7} value={form.maxDigits} onChange={e => setForm(p => ({ ...p, maxDigits: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Reading</label>
                <input type="number" step="0.01" min="0" value={form.initialReading} onChange={e => setForm(p => ({ ...p, initialReading: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assign to Consumer</label>
                <select value={form.consumerId} onChange={e => setForm(p => ({ ...p, consumerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">— Select consumer (optional) —</option>
                  {consumers.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? 'Creating...' : 'Create Meter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {selectedMeter && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">Assign Meter</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedMeter.meterLabel ?? selectedMeter.meterSerial}</p>
              </div>
              <button onClick={() => setSelectedMeter(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Assign Owner */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Consumer (Owner)</label>
                <div className="flex gap-2">
                  <select value={ownerSelect} onChange={e => setOwnerSelect(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— Select consumer —</option>
                    {consumers.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                  <button onClick={() => void handleAssignOwner()} disabled={!ownerSelect || assigningOwner}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center gap-1.5">
                    {assigningOwner ? <Loader2 size={13} className="animate-spin" /> : null} Assign
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Current owner: {ownerName(selectedMeter.userId)}</p>
              </div>

              <hr className="border-slate-100" />

              {/* Assign Staff */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Field Staff (for reading)</label>
                <div className="flex gap-2">
                  <select value={staffSelect} onChange={e => setStaffSelect(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— Select staff —</option>
                    {staff.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                  <button onClick={() => void handleAssignStaff()} disabled={!staffSelect || assigningStaff}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center gap-1.5">
                    {assigningStaff ? <Loader2 size={13} className="animate-spin" /> : null} Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
