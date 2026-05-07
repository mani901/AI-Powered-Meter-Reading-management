import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Gauge, Camera, Edit3, Save, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { apiFetch } from '../../lib/apiClient';

export default function Profile() {
  const { currentUser, meters, readings, updateUserProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  const [form, setForm] = useState({
    firstName: currentUser?.firstName ?? '',
    lastName: currentUser?.lastName ?? '',
    phone: currentUser?.phone ?? '',
    address: currentUser?.address ?? '',
    city: currentUser?.city ?? '',
  });

  const userMeters = meters.filter(m => m.userId === currentUser?.id);
  const userReadings = readings.filter(r => r.userId === currentUser?.id);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(form);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) { toast.error('New passwords do not match'); return; }
    if (passForm.new.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.new }),
      });
      setChangingPass(false);
      setPassForm({ current: '', new: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account information" />

      {/* Avatar + basic info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-white">
              <Camera size={12} className="text-white" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{currentUser?.firstName} {currentUser?.lastName}</h2>
                <p className="text-slate-500 text-sm">{currentUser?.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    currentUser?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currentUser?.role}
                  </span>
                  <span className="text-xs text-slate-400">
                    Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                  <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
          {[
            { label: 'Meters', value: userMeters.length, icon: Gauge },
            { label: 'Readings', value: userReadings.length, icon: Camera },
            { label: 'Last Login', value: currentUser?.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—', icon: Calendar },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center mb-1">
                <s.icon size={16} className="text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-5">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { field: 'firstName', label: 'First Name', icon: User },
            { field: 'lastName', label: 'Last Name', icon: User },
            { field: 'phone', label: 'Phone Number', icon: Phone },
            { field: 'city', label: 'City', icon: MapPin },
          ].map(({ field, label, icon: Icon }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Icon size={12} /> {label}
              </label>
              {editing ? (
                <input
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              ) : (
                <p className="text-slate-900 text-sm py-2.5 px-4 bg-slate-50 rounded-xl">{form[field as keyof typeof form] || <span className="text-slate-400">Not set</span>}</p>
              )}
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <MapPin size={12} /> Address
            </label>
            {editing ? (
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            ) : (
              <p className="text-slate-900 text-sm py-2.5 px-4 bg-slate-50 rounded-xl">{form.address || <span className="text-slate-400">Not set</span>}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <Mail size={12} /> Email Address (read-only)
            </label>
            <p className="text-slate-700 text-sm py-2.5 px-4 bg-slate-50 rounded-xl flex items-center gap-2">
              {currentUser?.email}
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
            </p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Security</h3>
          <button onClick={() => setChangingPass(p => !p)} className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            {changingPass ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {changingPass ? (
          <form onSubmit={handlePassChange} className="space-y-4">
            {[
              { key: 'current', label: 'Current Password' },
              { key: 'new', label: 'New Password' },
              { key: 'confirm', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={showPass[key as keyof typeof showPass] ? 'text' : 'password'}
                    value={passForm[key as keyof typeof passForm]}
                    onChange={e => setPassForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, [key]: !p[key as keyof typeof showPass] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass[key as keyof typeof showPass] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null} Update Password
            </button>
          </form>
        ) : (
          <p className="text-slate-500 text-sm">Password last changed: Never (demo)</p>
        )}
      </div>
    </div>
  );
}
