import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, ThumbsUp, MessageSquare, Share2, Flag, Calendar,
  Clock, User, CheckCircle2, AlertOctagon, Wrench, ShieldCheck,
  ChevronRight, Trash2, ArrowLeft, Send, Sparkles, UserCheck, Eye
} from 'lucide-react';
import { reportService } from '../api/apiServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import ImageSlider from '../components/common/ImageSlider';
import ShareModal from '../components/common/ShareModal';
import FlagModal from '../components/common/FlagModal';
import StatusUpdateModal from '../components/admin/StatusUpdateModal';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const detailPin = L.divIcon({
  className: 'detail-pin',
  html: `
    <div style="position: relative; width: 32px; height: 38px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
      <svg viewBox="0 0 24 28" width="32" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#10B981"/>
        <circle cx="12" cy="11" r="5" fill="#0F172A" />
        <circle cx="12" cy="11" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  `,
  iconSize: [32, 38],
  iconAnchor: [16, 38]
});

const LIFECYCLE_STAGES = ['reported', 'verified', 'assigned', 'in_progress', 'cleaned', 'closed'];

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStaff, isAdmin, demoLogin } = useAuth();
  const { success, error, info } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Community Interactions
  const [upvoted, setUpvoted] = useState(false);
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReportById(id);
      if (res.data.success) {
        setReport(res.data.report);
        setUpvoted(res.data.report.has_upvoted || false);
        setUpvotesCount(res.data.report.upvotes_count || 0);
      }
    } catch (err) {
      error('Report not found or network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      info('Please log in or click a demo account to upvote.');
      return;
    }
    try {
      const res = await reportService.toggleUpvote(report.id);
      if (res.data.success) {
        setUpvoted(res.data.has_upvoted);
        setUpvotesCount(res.data.upvotes_count);
      }
    } catch (err) {
      error('Could not toggle upvote.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      info('Please log in to participate in the comments discussion.');
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await reportService.addComment(report.id, commentText.trim());
      if (res.data.success) {
        setReport((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), res.data.comment]
        }));
        setCommentText('');
        success('Comment posted!');
      }
    } catch (err) {
      error('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      const res = await reportService.deleteReport(report.id);
      if (res.data.success) {
        success('Report deleted successfully.');
        navigate('/reports');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading comprehensive report details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 glass-card rounded-3xl m-6">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">This waste complaint might have been removed or archived.</p>
        <Link to="/reports" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs">
          Return to Feed
        </Link>
      </div>
    );
  }

  const currentStageIndex = LIFECYCLE_STAGES.indexOf(report.status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-8">
      {/* Back Link & Action Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Staff / Admin Status Update Button */}
          {isStaff && (
            <button
              onClick={() => setStatusModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-purple-950"
            >
              <Wrench className="w-4 h-4" />
              <span>Update Lifecycle Status</span>
            </button>
          )}

          {/* Delete Option for Reporter or Admin */}
          {(isAdmin || (user && Number(user.id) === Number(report.user_id))) && (
            <button
              onClick={handleDeleteReport}
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition-colors"
              title="Delete Report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. 6-STAGE LIFECYCLE TRACKER STEPPER */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Cleanup Lifecycle Stage
            </span>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>Current Status:</span>
              <StatusBadge status={report.status} size="lg" />
            </h2>
          </div>

          <div className="text-xs text-slate-400">
            {report.status === 'cleaned' || report.status === 'closed' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Fully Restored & Verified
              </span>
            ) : (
              <span>Estimated Resolution: 24 - 48 hours</span>
            )}
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-6 gap-2 pt-4">
          {LIFECYCLE_STAGES.map((st, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={st} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/30 scale-105'
                      : isCompleted
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider capitalize ${
                    isCurrent
                      ? 'text-emerald-300'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {st.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN DETAILS & PHOTOS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photos & Details */}
        <div className="lg:col-span-8 space-y-8">
          {/* Before & After Image Slider Component */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {report.cleaned_photo ? 'Before & After Cleanup Transformation' : 'Reported Waste Photo'}
            </h3>

            <ImageSlider
              beforeImage={report.primary_photo}
              afterImage={report.cleaned_photo}
              title={report.title}
            />

            {/* Extra Photos Gallery */}
            {report.photos && report.photos.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Additional Inspection Photos ({report.photos.length})
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {report.photos.map((p, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden aspect-video border border-slate-700 bg-slate-900">
                      <img src={p.photo_url} alt="Extra" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description & Metadata */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="text-xs px-3 py-1 rounded-full font-bold bg-slate-900 border text-slate-200"
                  style={{ borderColor: report.category_color ? `${report.category_color}60` : '#10B98160' }}
                >
                  {report.category_name}
                </span>
                <SeverityBadge severity={report.severity} size="md" />
                <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{report.views_count || 1} views</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">
                {report.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                {report.description}
              </p>
            </div>

            {/* Engagement Action Buttons: Upvote, Share, Flag */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpvote}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                    upvoted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${upvoted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                  <span>{upvoted ? 'Upvoted' : 'Upvote Complaint'}</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded-md font-mono text-xs text-emerald-400 ml-1">
                    {upvotesCount}
                  </span>
                </button>

                <button
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              <button
                onClick={() => setFlagOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 font-medium transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Inappropriate</span>
              </button>
            </div>
          </div>

          {/* 3. PROGRESS LOGS & TIMELINE */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Resolution Timeline & Official Logs
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {report.status_logs && report.status_logs.length > 0 ? (
                report.status_logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 relative">
                    {idx < report.status_logs.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800 -mb-4" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 z-10 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white capitalize">
                          Status: <span className="text-emerald-400">{log.to_status.replace('_', ' ')}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{log.notes || 'Status transitioned.'}</p>
                      <span className="text-[11px] text-slate-500 block pt-1">
                        Logged by {log.changed_by_name} ({log.changed_by_role})
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No historical status logs recorded yet.</p>
              )}
            </div>
          </div>

          {/* 4. COMMUNITY COMMENTS SECTION */}
          <div id="comments" className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 scroll-mt-24">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Community Discussion ({report.comments?.length || 0})
                </h3>
              </div>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isAuthenticated ? "Write a helpful update or thank the cleanup crew..." : "Please sign in to leave a comment..."}
                disabled={!isAuthenticated}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim() || !isAuthenticated}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {report.comments && report.comments.length > 0 ? (
                report.comments.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                    <img
                      src={c.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user_name}`}
                      alt={c.user_name}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0 mt-0.5 border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{c.user_name}</span>
                          {c.user_role === 'cleanup_staff' && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-medium border border-blue-500/30">
                              Staff
                            </span>
                          )}
                          {c.user_role === 'admin' && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-medium border border-purple-500/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to share an update!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Location Pinpoint & Reporter info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Location Card with Mini Leaflet Map */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Location Pinpoint</h3>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-48 bg-slate-900">
              <MapContainer
                center={[Number(report.latitude) || 40.7128, Number(report.longitude) || -74.0060]}
                zoom={14}
                scrollWheelZoom={false}
                zoomControl={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <Marker
                  position={[Number(report.latitude) || 40.7128, Number(report.longitude) || -74.0060]}
                  icon={detailPin}
                />
              </MapContainer>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-200">{report.address}</p>
              <p className="text-slate-400">District: <strong className="text-emerald-400">{report.area_district || 'Downtown'}</strong></p>
              <p className="text-[11px] text-slate-500 font-mono">
                Coordinates: {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
              </p>
            </div>
          </div>

          {/* Reporter & Assigned Staff Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Stakeholders & Officers</h3>

            {/* Reporter */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <img
                src={report.reporter_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${report.reporter_name}`}
                alt={report.reporter_name}
                className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reported By</span>
                <p className="text-xs font-bold text-white truncate">{report.reporter_name || 'Citizen'}</p>
                <span className="text-[10px] text-slate-500">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-purple-400 uppercase font-semibold">Assigned Crew</span>
                <p className="text-xs font-bold text-white truncate">
                  {report.assigned_staff_name || 'Municipal Rapid Response Pool'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        reportId={report.id}
        reportTitle={report.title}
      />

      <FlagModal
        isOpen={flagOpen}
        onClose={() => setFlagOpen(false)}
        reportId={report.id}
        reportTitle={report.title}
      />

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        report={report}
        onSuccess={fetchReport}
      />
    </div>
  );
}
