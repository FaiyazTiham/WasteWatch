import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, Edit3, Lock,
  Layers, CheckCircle2, ThumbsUp, Key, Sparkles, PlusCircle, ArrowRight, Wrench, Camera, Upload, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService, reportService } from '../api/apiServices';
import { getImageUrl } from '../api/client';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusUpdateModal from '../components/admin/StatusUpdateModal';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, refreshUser, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [assignedWork, setAssignedWork] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [selectedReportForUpdate, setSelectedReportForUpdate] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Profile Edit State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Edit State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const isStaff = user?.role === 'cleanup_staff';
  const [activeTab, setActiveTab] = useState(isStaff ? 'assigned' : 'reports');

  useEffect(() => {
    if (isStaff) {
      setActiveTab('assigned');
    }
  }, [isStaff]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const fetchAssignedWork = async () => {
    if (user && isStaff) {
      try {
        setLoadingAssigned(true);
        const res = await reportService.getReports({ assigned_to: user.id });
        if (res.data.success) {
          setAssignedWork(res.data.reports || []);
        }
      } catch (err) {
        console.warn('Failed to fetch assigned work', err);
      } finally {
        setLoadingAssigned(false);
      }
    }
  };

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

      fetchAssignedWork();
    }
  }, [isAuthenticated, user]);

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

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('phone', phone);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (avatar) {
        formData.append('avatar', avatar);
      }

      const res = await authService.updateProfile(formData);
      if (res.data.success) {
        updateUser(res.data.user);
        success('Profile and avatar updated successfully!');
        setAvatarFile(null);
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
          <div className="relative group shrink-0">
            <img
              src={avatarPreview || getImageUrl(user.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
              }}
            />
            <button
              onClick={() => setActiveTab('edit')}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-emerald-400 hover:text-slate-950 border border-slate-700 hover:border-emerald-400 transition-all shadow-lg group-hover:scale-105"
              title="Edit Profile Picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

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
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2">
        {isStaff && (
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 min-w-[160px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-amber-950/30 text-amber-300 hover:text-white hover:bg-amber-900/40 border border-amber-500/30'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>My Assigned Cleanup Tasks ({assignedWork.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
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
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
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
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Account Security</span>
        </button>
      </div>

      {/* TAB CONTENT: ASSIGNED WORK (STAFF ONLY) */}
      {activeTab === 'assigned' && isStaff && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Wrench className="w-4 h-4" />
              <span>Assigned Sanitation & Cleanup Roster</span>
            </div>
            <span className="text-xs text-slate-400">
              Total Tasks Assigned: <strong className="text-white">{assignedWork.length}</strong>
            </span>
          </div>

          {loadingAssigned ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card h-40 rounded-2xl animate-pulse bg-slate-800/40" />
              ))}
            </div>
          ) : assignedWork.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">All Assigned Tasks Completed!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You currently have no active or pending cleanup complaints assigned to you by administrators.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedWork.map((r) => (
                <div
                  key={r.id}
                  className="glass-card rounded-2xl p-5 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-4 shadow-xl bg-amber-950/10"
                >
                  <div className="flex gap-4 items-start">
                    <img
                      src={getImageUrl(r.primary_photo)}
                      alt={r.title}
                      className="w-24 h-24 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-700"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusBadge status={r.status} size="sm" />
                        <SeverityBadge severity={r.severity} size="sm" />
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{r.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{r.address}</p>
                      <span className="text-[11px] text-amber-300 font-semibold block">
                        Area: {r.area_district || 'Municipal Sector'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <Link
                      to={`/reports/${r.id}`}
                      className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedReportForUpdate(r);
                        setIsStatusModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950 transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Update Status & Proof</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

          {/* Profile Picture Upload Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Profile Picture / Avatar</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="relative shrink-0">
                <img
                  src={avatarPreview || getImageUrl(user.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
                  }}
                />
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow"
                    title="Remove preview"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-900 cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {avatarFile ? avatarFile.name : 'Upload New Profile Picture'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    if (e.target.value) setAvatarPreview(e.target.value);
                  }}
                  placeholder="Or paste external avatar image URL..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
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

      {/* Status Update Modal for Cleanup Staff */}
      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedReportForUpdate(null);
        }}
        report={selectedReportForUpdate}
        onSuccess={() => {
          fetchAssignedWork();
          refreshUser();
        }}
      />
    </div>
  );
}
