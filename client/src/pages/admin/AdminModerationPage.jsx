import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, Trash2, CheckCircle2,
  Eye, RefreshCw, Layers, Shield
} from 'lucide-react';
import { adminService } from '../../api/apiServices';
import { getImageUrl } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function AdminModerationPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await adminService.getFlags();
      if (res.data.success) {
        setFlags(res.data.flags || []);
      }
    } catch (err) {
      error('Failed to load moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleResolve = async (flagId, action) => {
    try {
      const res = await adminService.resolveFlag(flagId, action);
      if (res.data.success) {
        success(res.data.message || 'Moderation action applied.');
        setFlags((prev) => prev.filter((f) => f.id !== flagId));
      }
    } catch (err) {
      error('Action failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Content Moderation Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Flagged Submissions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review complaints reported as fake, duplicate, or inappropriate by community members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            ← Analytics Dashboard
          </Link>
          <button
            onClick={fetchFlags}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flag List */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-6 space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading moderation items...</div>
        ) : flags.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Moderation Queue is Clean!</h3>
            <p className="text-xs text-slate-400">No inappropriate or flagged complaints currently pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {flag.report_photo && (
                    <img
                      src={getImageUrl(flag.report_photo)}
                      alt={flag.report_title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                        {flag.reason}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Flagged by {flag.reporter_name}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{flag.report_title}</h4>
                    {flag.details && (
                      <p className="text-xs text-slate-400 italic">"{flag.details}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Link
                    to={`/reports/${flag.report_id}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </Link>

                  <button
                    onClick={() => handleResolve(flag.id, 'dismiss')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dismiss Flag</span>
                  </button>

                  <button
                    onClick={() => handleResolve(flag.id, 'delete_report')}
                    className="px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Submission</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
