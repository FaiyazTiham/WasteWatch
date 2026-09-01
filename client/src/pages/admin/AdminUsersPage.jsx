import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Shield, User, Wrench, ShieldAlert, CheckCircle2,
  Ban, RefreshCw, Mail, Phone, Calendar
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
          <p className="text-xs text-slate-400 mt-1">Assign roles (Citizen, Admin, Cleanup Staff) and manage account access.</p>
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

      {/* Users Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Reports Filed</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4 text-right">Account Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Loading user accounts...</td>
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
                      <button
                        onClick={() => handleToggleBan(u.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          u.status === 'banned'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-rose-500/40 hover:text-rose-400'
                        }`}
                      >
                        {u.status === 'banned' ? 'Deactivated (Banned)' : 'Active (Suspend)'}
                      </button>
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
