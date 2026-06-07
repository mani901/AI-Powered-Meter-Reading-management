import { useState } from 'react';
import { UserCheck, UserX, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { useAdminStaff } from '../../hooks/useAdmin';
import { useApp } from '../../context/AppContext';
import { useAdmin } from '../../hooks/useAdmin';

export default function AdminStaff() {
  const { staff, loading, refresh } = useAdminStaff();
  const { updateUserStatus } = useApp();
  const { createUser } = useAdmin();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', city: '' });

  const filtered = staff.filter(s =>
    !search ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusToggle = async (id: string, active: boolean, name: string) => {
    try {
      await updateUserStatus(id, !active);
      toast.success(`${name} ${!active ? 'activated' : 'deactivated'}`);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createUser({ ...form, role: 'FIELD_STAFF' });
      toast.success('Field staff account created');
      setShowCreate(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', city: '' });
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create staff');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Staff Management"
        subtitle={`${staff.length} staff members`}
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Add Staff
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-slate-500 text-xs">Total Staff</p>
          <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-slate-500 text-xs">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{staff.filter(s => s.isActive).length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-slate-500 text-xs">Total Assigned Meters</p>
          <p className="text-2xl font-bold text-blue-600">{staff.reduce((s, m) => s + m.assignedMeters, 0)}</p>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search staff..." />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Staff Member', 'Email', 'Status', 'Assigned Meters', 'Total Readings', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <p className="text-slate-900 text-sm font-medium">{s.firstName} {s.lastName}</p>
                        <p className="text-slate-400 text-xs">{s.city ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-sm">{s.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700 text-sm font-medium">{s.assignedMeters}</td>
                  <td className="px-5 py-3 text-slate-700 text-sm">{s.totalReadings}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => void handleStatusToggle(s.id, s.isActive, `${s.firstName} ${s.lastName}`)}
                      className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      title={s.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {s.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No staff members found</div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Add Field Staff</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <span className="text-slate-500 text-lg leading-none">×</span>
              </button>
            </div>
            <form onSubmit={e => void handleCreate(e)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                  <input required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <input required type="password" minLength={8} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City / Area</label>
                  <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
