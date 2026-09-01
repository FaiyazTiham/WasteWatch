import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, MessageSquare, Eye, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';
import { reportService } from '../../api/apiServices';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ReportCard({ report, onUpvoteSuccess }) {
  const { isAuthenticated } = useAuth();
  const { info, error } = useToast();
  const [upvoted, setUpvoted] = useState(report.has_upvoted || false);
  const [upvotesCount, setUpvotesCount] = useState(report.upvotes_count || 0);
  const [loadingUpvote, setLoadingUpvote] = useState(false);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      info('Please log in or select a demo account to upvote reports.');
      return;
    }

    try {
      setLoadingUpvote(true);
      const res = await reportService.toggleUpvote(report.id);
      if (res.data.success) {
        setUpvoted(res.data.has_upvoted);
        setUpvotesCount(res.data.upvotes_count);
        if (onUpvoteSuccess) onUpvoteSuccess(report.id, res.data.has_upvoted, res.data.upvotes_count);
      }
    } catch (err) {
      error('Could not complete upvote.');
    } finally {
      setLoadingUpvote(false);
    }
  };

  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all duration-300 flex flex-col group hover:-translate-y-1 shadow-lg hover:shadow-2xl">
      {/* Image Container with Badges */}
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <img
          src={report.status === 'cleaned' && report.cleaned_photo ? report.cleaned_photo : report.primary_photo}
          alt={report.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <StatusBadge status={report.status} size="sm" />
          <SeverityBadge severity={report.severity} size="sm" />
        </div>

        {report.status === 'cleaned' && (
          <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            CLEANED
          </div>
        )}

        {/* Category Pill on Image Bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200"
            style={{ borderColor: report.category_color ? `${report.category_color}50` : '#10B98150' }}
          >
            {report.category_name || 'General'}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium truncate">{report.area_district || 'Downtown'}</span>
          </div>

          <Link to={`/reports/${report.id}`}>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
              {report.title}
            </h3>
          </Link>

          <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
            {report.description}
          </p>

          <div className="flex items-center gap-1 text-xs text-slate-400 mb-4 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{report.address}</span>
          </div>
        </div>

        {/* Card Footer: Upvote, Comments, and View Detail Button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpvote}
              disabled={loadingUpvote}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                upvoted
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              <span>{upvotesCount}</span>
            </button>

            <Link
              to={`/reports/${report.id}#comments`}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{report.comments_count || 0}</span>
            </Link>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Eye className="w-3.5 h-3.5" />
              <span>{report.views_count || 0}</span>
            </div>
          </div>

          <Link
            to={`/reports/${report.id}`}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
