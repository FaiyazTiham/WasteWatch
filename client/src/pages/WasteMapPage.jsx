import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter, Search, MapPin, RefreshCw, Layers, PlusCircle,
  SlidersHorizontal, X, ArrowRight, Sparkles, ChevronRight
} from 'lucide-react';
import { reportService } from '../api/apiServices';
import WasteMap from '../components/map/WasteMap';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';

export default function WasteMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'map_only'

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Fetch Categories
  useEffect(() => {
    reportService.getCategories()
      .then((res) => {
        if (res.data.success) setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Fetch Reports on Filter Change
  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await reportService.getReports(params);
      if (res.data.success) {
        setReports(res.data.reports || []);
        if (res.data.reports?.length > 0 && !selectedReport) {
          setSelectedReport(res.data.reports[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load map reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [categoryFilter, statusFilter, severityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSeverityFilter('all');
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Interactive Municipal Geo-Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Interactive Waste Map</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual map of all waste complaints, status tracking, and cleaned locations across districts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'map_only' : 'split')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{viewMode === 'split' ? 'Full Map View' : 'Split View'}</span>
          </button>

          <Link
            to="/report"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Report Waste</span>
          </Link>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search district, keyword, address..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="reported">🔴 Reported</option>
              <option value="verified">🔵 Verified</option>
              <option value="assigned">🟣 Assigned</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="cleaned">🟢 Cleaned</option>
              <option value="closed">⚫ Closed</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Status Legend Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Legend:</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Reported
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Verified
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cleaned
          </span>
          <span className="ml-auto text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{reports.length}</strong> markers
          </span>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Left / Full Map */}
        <div className={`${viewMode === 'split' ? 'lg:col-span-8' : 'w-full'}`}>
          <WasteMap
            reports={reports}
            selectedReportId={selectedReport?.id}
            onSelectReport={(rep) => setSelectedReport(rep)}
            height={viewMode === 'split' ? '650px' : '720px'}
          />
        </div>

        {/* Right Sidebar (Split Mode) */}
        {viewMode === 'split' && (
          <div className="lg:col-span-4 space-y-4">
            {/* Selected / Preview Card */}
            {selectedReport ? (
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 space-y-4 shadow-xl animate-fade-in">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <img
                    src={selectedReport.status === 'cleaned' && selectedReport.cleaned_photo ? selectedReport.cleaned_photo : selectedReport.primary_photo}
                    alt={selectedReport.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <StatusBadge status={selectedReport.status} size="sm" />
                    <SeverityBadge severity={selectedReport.severity} size="sm" />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-emerald-400">
                    {selectedReport.category_name}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 line-clamp-2">
                    {selectedReport.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{selectedReport.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                    <span>Reported by {selectedReport.reporter_name || 'Citizen'}</span>
                    <span>{new Date(selectedReport.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link
                  to={`/reports/${selectedReport.id}`}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <span>View Details & Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : null}

            {/* List of Other Nearby Reports */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2.5 max-h-80 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                All Filtered Reports ({reports.length})
              </h4>
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedReport?.id === r.id
                      ? 'bg-emerald-500/15 border-emerald-500/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={r.primary_photo}
                    alt={r.title}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{r.address}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StatusBadge status={r.status} size="sm" showIcon={false} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
