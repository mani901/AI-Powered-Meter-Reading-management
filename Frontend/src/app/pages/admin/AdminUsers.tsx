import { useState } from 'react';
import { UserCheck, UserX, ShieldCheck, User2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { SearchInput } from '../../components/common/SearchInput';
import { PageHeader } from '../../components/common/PageHeader';

export default function AdminUsers() {
  const { users, updateUserStatus, updateUserRole } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = users
    .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
    .filter(u => statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive))
    .filter(u =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

  const handleStatusToggle = (userId: string, currentStatus: boolean, name: string) => {
    updateUserStatus(userId, !currentStatus);
    toast.success(`${name} has been ${!currentStatus ? 'activated' : 'deactivated'}`);
  };

  const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'CONSUMER', name: string) => {
    updateUserRole(userId, newRole);
    toast.success(`${name}'s role changed to ${newRole}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="User Management" subtitle={`${users.length} total users in the system`} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'bg-blue-50 border-blue-200 text-blue-600' },
          { label: 'Active', value: users.filter(u => u.isActive).length, color: 'bg-green-50 border-green-200 text-green-600' },
          { label: 'Inactive', value: users.filter(u => !u.isActive).length, color: 'bg-red-50 border-red-200 text-red-600' },
          { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: 'bg-purple-50 border-purple-200 text-purple-600' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.color.split(' ')[1]} rounded-xl p-4`}>
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color.split(' ')[2]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
          className="flex-1"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CONSUMER">Consumer</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['User', 'Email', 'Role', 'Status', 'Meters', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="text-slate-900 text-sm font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-slate-400 text-xs">{u.city || 'Unknown city'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-sm">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700 text-sm">{u.totalMeters ?? 0}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.isActive, `${u.firstName} ${u.lastName}`)}
                        className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'CONSUMER' : 'ADMIN', `${u.firstName} ${u.lastName}`)}
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                        title={`Change to ${u.role === 'ADMIN' ? 'Consumer' : 'Admin'}`}
                      >
                        {u.role === 'ADMIN' ? <User2 size={16} /> : <ShieldCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No users found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
