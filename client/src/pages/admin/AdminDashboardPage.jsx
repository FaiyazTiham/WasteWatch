import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, CheckCircle2, Clock, Users,
  AlertTriangle, Shield, MapPin, Layers, RefreshCw, Sparkles, ArrowRight
} from 'lucide-react';
import { adminService } from '../../api/apiServices';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAnalytics();
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.warn('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading municipal analytics and real-time metrics...</p>
      </div>
    );
  }

  const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* 1. ADMIN HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Municipal Environmental Operations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Operations & Analytics Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time KPIs, district waste load distributions, cleanup resolution velocity, and hotspot monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            Manage Reports
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/moderation"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            Flagged Queue
          </Link>
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Reports</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{analytics?.totalReports || 0}</div>
          <span className="text-[10px] text-slate-400">All registered complaints</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-blue-950/10">
          <div className="flex items-center justify-between text-blue-300 mb-2">
            <span className="text-xs font-bold uppercase">Verified</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-300">{analytics?.verified || 0}</div>
          <span className="text-[10px] text-slate-400">Inspected & valid</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase">In Progress</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">{analytics?.inProgress || 0}</div>
          <span className="text-[10px] text-slate-400">Active cleanup crews</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase">Cleaned</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            {(analytics?.cleaned || 0) + (analytics?.closed || 0)}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">{analytics?.resolutionRate || 0}% resolution rate</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20 bg-purple-950/10 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-300 mb-2">
            <span className="text-xs font-bold uppercase">Avg Resolution</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">
            {analytics?.averageCleanupDays || 1.8} <span className="text-sm font-normal">days</span>
          </div>
          <span className="text-[10px] text-slate-400">From filing to completion</span>
        </div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Trend Over Time (Area Chart) */}
        <div className="lg:col-span-8 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Complaints Logged vs Resolved Trend
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Monthly Pace</span>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.reportsTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCleaned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total_reported" name="Reported" stroke="#3B82F6" fillOpacity={1} fill="url(#colorReported)" />
                <Area type="monotone" dataKey="total_cleaned" name="Cleaned" stroke="#10B981" fillOpacity={1} fill="url(#colorCleaned)" />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste by Category (Donut Pie Chart) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Reports by Waste Category
          </h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.reportsByCategory || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(analytics?.reportsByCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports by Area / District (Bar Chart) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Reports Distribution by Municipal District
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.reportsByArea || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="area" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Total Reports" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cleaned_count" name="Cleaned Sites" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots Leaderboard */}
        <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Problematic Hotspots
            </h3>
            <span className="text-xs text-rose-400 font-semibold">Priority Areas</span>
          </div>

          <div className="space-y-2.5">
            {analytics?.problemHotspots && analytics.problemHotspots.length > 0 ? (
              analytics.problemHotspots.map((hotspot, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{hotspot.area}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                      {hotspot.count} complaints
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No hotspot data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
