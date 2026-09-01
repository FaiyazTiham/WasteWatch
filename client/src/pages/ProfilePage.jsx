import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, Edit3, Lock,
  Layers, CheckCircle2, ThumbsUp, Key, Sparkles, PlusCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../api/apiServices';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, refreshUser, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'edit' | 'security'

  // Profile Edit State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Edit State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      authService.getMyReports()
        .then((res) => {
          if (res.data.success) {
            setMyReports(res.data.reports || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingReports(false));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 glass-card rounded-3xl m-6">
        <User className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-slate-400">Please sign in or select a demo account to view your profile and report history.</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => demoLogin('citizen')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Demo Citizen
          </button>
          <Link to="/login" className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('phone', phone);
      if (avatar) formData.append('avatar', avatar);

      const res = await authService.updateProfile(formData);
      if (res.data.success) {
        updateUser(res.data.user);
        success('Profile updated successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.');
      return;
    }
    try {
      setSavingPassword(true);
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.data.success) {
        success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const cleanedCount = myReports.filter((r) => r.status === 'cleaned' || r.status === 'closed').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* 1. USER PROFILE HEADER CARD */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
            alt={user.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
            }}
          />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {user.role === 'cleanup_staff' ? 'Cleanup Staff' : user.role}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {user.bio || 'Active community environmental protector and zero-waste advocate.'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user.email}</span>
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>{user.phone}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <Link
            to="/report"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>New Complaint</span>
          </Link>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-2xl sm:text-3xl font-black text-white">{myReports.length}</span>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Complaints Logged</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{cleanedCount}</span>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Sites Cleaned</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-2xl sm:text-3xl font-black text-purple-400">
              {myReports.reduce((acc, r) => acc + (r.upvotes_count || 0), 0)}
            </span>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Upvotes Received</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-2xl sm:text-3xl font-black text-teal-400">
              {myReports.length > 0 ? Math.round((cleanedCount / myReports.length) * 100) : 100}%
            </span>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Resolution Rate</p>
          </div>
        </div>
      </div>

      {/* 2. PROFILE TABS */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Complaints & History ({myReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'edit'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Account Security</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. MY REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loadingReports ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card h-40 rounded-2xl animate-pulse bg-slate-800/40" />
              ))}
            </div>
          ) : myReports.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No waste complaints logged yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Spot trash in your neighborhood? Snap a photo and submit a report to alert cleanup crews!
              </p>
              <Link
                to="/report"
                className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Submit First Report
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.map((r) => (
                <div
                  key={r.id}
                  className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-emerald-500/40 transition-all flex gap-4 items-center group"
                >
                  <img
                    src={r.primary_photo}
                    alt={r.title}
                    className="w-24 h-24 rounded-xl object-cover bg-slate-900 shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <StatusBadge status={r.status} size="sm" />
                      <SeverityBadge severity={r.severity} size="sm" />
                    </div>
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {r.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{r.address}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      <Link
                        to={`/reports/${r.id}`}
                        className="text-emerald-400 font-semibold flex items-center gap-1 hover:text-emerald-300"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. EDIT PROFILE */}
      {activeTab === 'edit' && (
        <form onSubmit={handleUpdateProfile} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4 max-w-2xl">
          <h3 className="text-lg font-bold text-white mb-4">Edit Profile Information</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Avatar Image URL</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Bio / Civic Passion</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your clean community goals..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* TAB CONTENT: 3. SECURITY */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4 max-w-xl">
          <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
