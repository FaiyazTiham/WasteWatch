import React, { useState } from 'react';
import { X, Copy, Check, Share2, Send, MessageCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ShareModal({ isOpen, onClose, reportTitle, reportId }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  if (!isOpen) return null;

  const url = window.location.origin + `/reports/${reportId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Report link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `WasteWatch: ${reportTitle}`,
          text: `Check out this waste report on WasteWatch: ${reportTitle}`,
          url
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this waste report on WasteWatch: ${reportTitle}\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Spotted and reported on @WasteWatch: "${reportTitle}" Help us clean our community! #WasteWatch #EcoClean\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-dropdown w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Share Report</h3>
            <p className="text-xs text-slate-400">Help spread awareness to expedite cleanup</p>
          </div>
        </div>

        <p className="text-sm font-medium text-slate-200 line-clamp-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-5">
          "{reportTitle}"
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 transition-colors font-medium text-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={shareTwitter}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-300 hover:bg-sky-900/50 transition-colors font-medium text-sm"
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Twitter / X</span>
          </button>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direct URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-md"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {navigator.share && (
          <button
            onClick={handleNativeShare}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>More Share Options...</span>
          </button>
        )}
      </div>
    </div>
  );
}
