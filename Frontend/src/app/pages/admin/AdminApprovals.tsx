import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle, XCircle, Clock, Users, Gauge, RefreshCw,
  AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';
import type { User, Meter } from '../../types';
import { toast } from 'sonner';

interface PendingUser extends User {
  totalMeters: number;
}

interface PendingMeter extends Meter {
  user: { id: string; firstName: string; lastName: string; email: string };
}

type Tab = 'users' | 'meters';

function RejectModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">Provide an optional reason for rejection.</p>
        <textarea
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          rows={3}
          placeholder="Reason (optional)..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminApprovals() {
  const { approveUser, rejectUser, approveMeter, rejectMeter, pendingUsersCount, pendingMetersCount } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingMeters, setPendingMeters] = useState<PendingMeter[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: 'user' | 'meter'; id: string; name: string } | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch<{ data: PendingUser[] }>('/api/admin/users/pending?limit=100');
      setPendingUsers(res.data);
    } catch {
      toast.error('Failed to load pending users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchPendingMeters = useCallback(async () => {
    setLoadingMeters(true);
    try {
      const res = await apiFetch<{ data: PendingMeter[] }>('/api/admin/meters/pending?limit=100');
      setPendingMeters(res.data);
    } catch {
      toast.error('Failed to load pending meters');
    } finally {
      setLoadingMeters(false);
    }
  }, []);

  useEffect(() => {
    void fetchPendingUsers();
    void fetchPendingMeters();
  }, [fetchPendingUsers, fetchPendingMeters]);

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUser(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User approved successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    try {
      await rejectUser(userId, reason || undefined);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User rejected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject user');
    }
    setRejectTarget(null);
  };

  const handleApproveMeter = async (meterId: string) => {
    try {
      await approveMeter(meterId);
      setPendingMeters(prev => prev.filter(m => m.id !== meterId));
      toast.success('Meter approved successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve meter');
    }
  };

  const handleRejectMeter = async (meterId: string, reason: string) => {
    try {
      await rejectMeter(meterId, reason || undefined);
      setPendingMeters(prev => prev.filter(m => m.id !== meterId));
      toast.success('Meter rejected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject meter');
    }
    setRejectTarget(null);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    if (rejectTarget.type === 'user') {
      await handleRejectUser(rejectTarget.id, reason);
    } else {
      await handleRejectMeter(rejectTarget.id, reason);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approval Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage pending registrations</p>
        </div>
        <button
          onClick={() => { void fetchPendingUsers(); void fetchPendingMeters(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingUsersCount}</p>
            <p className="text-sm text-slate-500">Pending User Registrations</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Gauge size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingMetersCount}</p>
            <p className="text-sm text-slate-500">Pending Meter Registrations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users size={16} />
            User Registrations
            {pendingUsersCount > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold">
                {pendingUsersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('meters')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'meters'
                ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Gauge size={16} />
            Meter Registrations
            {pendingMetersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold">
                {pendingMetersCount}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Pending Users Tab */}
          {activeTab === 'users' && (
            <>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={20} className="animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-500">Loading pending users...</span>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">All caught up!</p>
                  <p className="text-slate-400 text-sm mt-1">No pending user registrations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <div key={user.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-4 gap-4 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-600 font-semibold text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            <Clock size={12} />
                            Pending
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="Toggle details"
                          >
                            {expandedUserId === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget({ type: 'user', id: user.id, name: `${user.firstName} ${user.lastName}` })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>

                      {expandedUserId === user.id && (
                        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide">Phone</p>
                            <p className="text-slate-700 font-medium">{user.phone ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide">City</p>
                            <p className="text-slate-700 font-medium">{user.city ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide">Registered</p>
                            <p className="text-slate-700 font-medium">{new Date(user.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pending Meters Tab */}
          {activeTab === 'meters' && (
            <>
              {loadingMeters ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={20} className="animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-500">Loading pending meters...</span>
                </div>
              ) : pendingMeters.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">All caught up!</p>
                  <p className="text-slate-400 text-sm mt-1">No pending meter registrations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMeters.map(meter => (
                    <div key={meter.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gauge size={18} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {meter.meterSerial}
                            {meter.meterLabel && <span className="text-slate-400 font-normal"> — {meter.meterLabel}</span>}
                          </p>
                          <p className="text-sm text-slate-500">
                            {meter.user.firstName} {meter.user.lastName}
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span className="lowercase">{meter.meterType}</span>
                            {meter.location && <><span className="mx-1.5 text-slate-300">·</span>{meter.location}</>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          <Clock size={12} />
                          Pending
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(meter.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleApproveMeter(meter.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget({ type: 'meter', id: meter.id, name: meter.meterSerial })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          title={`Reject ${rejectTarget.type === 'user' ? 'User' : 'Meter'}: ${rejectTarget.name}`}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          Approved users receive an email notification and can immediately log in.
          Approved meters become active and users can start submitting readings.
          Rejected applicants are notified with your provided reason.
        </p>
      </div>
    </div>
  );
}
