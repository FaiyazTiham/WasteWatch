import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers, Flame, Sparkles, AlertOctagon, Search,
  Filter, PlusCircle, RefreshCw, ThumbsUp
} from 'lucide-react';
import { reportService } from '../api/apiServices';
import ReportCard from '../components/common/ReportCard';

export default function ReportsFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'popular', 'cleaned', 'critical'
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    reportService.getCategories()
      .then((res) => {
        if (res.data.success) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      if (activeTab === 'popular') {
        params.sort = 'popular';
      } else if (activeTab === 'cleaned') {
        params.status = 'cleaned';
      } else if (activeTab === 'critical') {
        params.severity = 'critical';
      } else {
        params.sort = 'newest';
      }

      const res = await reportService.getReports(params);
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.warn('Failed to load feed reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleUpvoteSuccess = (reportId, hasUpvoted, newCount) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, has_upvoted: hasUpvoted, upvotes_count: newCount } : r
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Civic Engagement Stream</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Community Waste Feed</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Browse submissions, upvote urgent complaints to accelerate municipal response, and check out verified cleanup successes.
          </p>
        </div>

        <Link
          to="/report"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>Report New Waste</span>
        </Link>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Complaints</span>
          </button>

          <button
            onClick={() => setActiveTab('popular')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'popular'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Most Upvoted & Trending</span>
          </button>

          <button
            onClick={() => setActiveTab('cleaned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cleaned'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cleaned Success Stories</span>
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'critical'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Critical Hazardous</span>
          </button>
        </div>

        {/* Filter Controls */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, description, or neighborhood..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Waste Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setActiveTab('all');
              }}
              title="Reset Filters"
              className="w-full h-full min-h-[36px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card h-80 rounded-2xl animate-pulse bg-slate-800/40" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No reports match your current filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching tabs or resetting the category filter to view more community submissions.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setActiveTab('all');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onUpvoteSuccess={handleUpvoteSuccess} />
          ))}
        </div>
      )}
    </div>
  );
}
