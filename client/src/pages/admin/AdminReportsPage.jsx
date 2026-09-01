import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Search, Filter, Wrench, Trash2, Eye,
  ShieldCheck, AlertTriangle, CheckCircle2, UserCheck, RefreshCw, Sparkles
} from 'lucide-react';
import { reportService, adminService } from '../../api/apiServices';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import StatusUpdateModal from '../../components/admin/StatusUpdateModal';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReportForUpdate, setSelectedReportForUpdate] = useState(null);
  const { success, error } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await reportService.getReports(params);
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      error('Failed to load reports table.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      const res = await reportService.deleteReport(id);
      if (res.data.success) {
        success('Report deleted successfully.');
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      error('Failed to delete report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Operational Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">All Waste Complaints</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            ← Analytics Dashboard
          </Link>
          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
            placeholder="Search complaints or address..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses ({reports.length})</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="cleaned">Cleaned</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Report Details</th>
                <th className="p-4">Category & Severity</th>
                <th className="p-4">Location / District</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Loading complaints table...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No complaints matching filter.</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.primary_photo}
                          alt={r.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-700"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <Link to={`/reports/${r.id}`} className="font-bold text-white hover:text-emerald-400 transition-colors truncate block max-w-xs">
                            {r.title}
                          </Link>
                          <span className="text-[11px] text-slate-500">
                            By {r.reporter_name || 'Citizen'} • {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="font-medium text-slate-200">{r.category_name}</div>
                      <SeverityBadge severity={r.severity} size="sm" />
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-slate-200 truncate max-w-xs">{r.address}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{r.area_district}</div>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReportForUpdate(r)}
                        className="p-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-colors"
                        title="Change Status & Assign"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>

                      <Link
                        to={`/reports/${r.id}`}
                        className="inline-block p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-400 transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedReportForUpdate && (
        <StatusUpdateModal
          isOpen={!!selectedReportForUpdate}
          onClose={() => setSelectedReportForUpdate(null)}
          report={selectedReportForUpdate}
          onSuccess={fetchReports}
        />
      )}
    </div>
  );
}
