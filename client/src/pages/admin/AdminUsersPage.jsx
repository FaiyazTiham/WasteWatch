import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Shield, User, Wrench, ShieldAlert, CheckCircle2,
  Ban, RefreshCw, Mail, Phone, Calendar, Trash2
} from 'lucide-react';
import { adminService } from '../../api/apiServices';
import { useToast } from '../../context/ToastContext';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers();
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await adminService.updateUserRole(userId, newRole);
      if (res.data.success) {
        success(res.data.message || `User role updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      error('Failed to update user role.');
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const res = await adminService.toggleUserBan(userId);
      if (res.data.success) {
        success(res.data.message || 'User status updated');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: res.data.status } : u))
        );
      }
    } catch (err) {
      error('Failed to toggle ban status.');
    }
  };

  const handleApprove = async (userId) => {
    try {
      const res = await adminService.approveUser(userId);
      if (res.data.success) {
        success(res.data.message || 'User approved successfully!');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
        );
      }
    } catch (err) {
      error(err.response?.data?.error || err.response?.data?.message || 'Failed to approve user.');
    }
  };

  const handleReject = async (userId) => {
    try {
      const res = await adminService.rejectUser(userId);
      if (res.data.success) {
        success(res.data.message || 'User request rejected.');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: 'user', status: 'active' } : u))
        );
      }
    } catch (err) {
      error(err.response?.data?.error || err.response?.data?.message || 'Failed to reject user request.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user "${userName}" (ID: ${userId})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await adminService.deleteUser(userId);
      if (res.data.success) {
        success(res.data.message || 'User account permanently deleted.');
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user account.');
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending_approval');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">User & Staff Management</h1>
          <p className="text-xs text-slate-400 mt-1">Assign roles, approve pending staff/admin accounts, and manage system access.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            ← Analytics Dashboard
          </Link>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PENDING APPROVALS SECTION */}
      {pendingUsers.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-purple-500/40 bg-purple-950/20 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-300 uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Pending Staff & Admin Access Approvals ({pendingUsers.length})</span>
            </div>
            <span className="text-xs text-amber-300 font-semibold bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full">
              Action Required
            </span>
          </div>
          <p className="text-xs text-slate-300">
            These accounts have registered for Staff or Admin privileges and require your explicit authorization before they can log in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((pu) => (
              <div
                key={pu.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={pu.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${pu.name}`}
                    alt={pu.name}
                    className="w-12 h-12 rounded-xl object-cover border border-purple-500/40 bg-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{pu.name}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${pu.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                        Requested: {pu.role === 'admin' ? 'Supervisor (Admin)' : 'Cleanup Staff'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" /> {pu.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleApprove(pu.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Access</span>
                  </button>
                  <button
                    onClick={() => handleReject(pu.id)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-semibold text-xs transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleanup Staff Duty Roster & Workload Summary */}
      <div className="glass-card rounded-3xl p-6 border border-amber-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Cleanup Staff Duty Roster & Workload Status</span>
          </div>
          <span className="text-xs text-slate-400">
            Total Staff: <strong className="text-white">{users.filter(u => u.role === 'cleanup_staff').length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.filter(u => u.role === 'cleanup_staff').map((staff) => (
            <div key={staff.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={staff.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${staff.name}`}
                    alt={staff.name}
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 bg-slate-800"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{staff.name}</h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" /> {staff.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-850 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                  <div className="font-mono font-bold text-slate-200 text-sm">{staff.assigned_reports_count || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-semibold">Active</div>
                  <div className="font-mono font-bold text-amber-400 text-sm">{staff.active_assigned_count || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Cleaned</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{staff.cleaned_assigned_count || 0}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 text-[11px]">Workload Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${(staff.active_assigned_count || 0) > 0
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                  {(staff.active_assigned_count || 0) > 0 ? `Active (${staff.active_assigned_count} On Field)` : 'Available'}
                </span>
              </div>
            </div>
          ))}
          {users.filter(u => u.role === 'cleanup_staff').length === 0 && (
            <div className="col-span-full p-4 text-center text-xs text-slate-400 italic">
              No staff members registered. You can change any account's role to Cleanup Staff below.
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Reports Filed</th>
                <th className="p-4">Workload / Assigned</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4 text-right">Account Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading user accounts...</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <span className="text-[11px] text-slate-500">
                            Joined {new Date(u.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-emerald-400 text-sm">{u.reports_count || 0}</span> complaints
                    </td>

                    <td className="p-4">
                      {u.role === 'cleanup_staff' ? (
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold text-amber-400">{u.assigned_reports_count || 0} Jobs</span>
                          <div className="text-[11px] text-slate-400">
                            ({u.active_assigned_count || 0} active, {u.cleaned_assigned_count || 0} done)
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 capitalize"
                      >
                        <option value="user">Citizen (User)</option>
                        <option value="cleanup_staff">Cleanup Staff</option>
                        <option value="admin">Supervisor (Admin)</option>
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === 'pending_approval' ? (
                          <>
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(u.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-semibold text-[11px] border border-slate-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${u.status === 'banned'
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 hover:bg-rose-500/30'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
                              }`}
                          >
                            {u.status === 'banned' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Permanently Delete Account"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
