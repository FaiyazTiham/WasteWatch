import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { reportService } from '../../api/apiServices';
import { useToast } from '../../context/ToastContext';

const FLAG_REASONS = [
  'Fake / Misleading photo',
  'Duplicate submission',
  'Inappropriate or offensive content',
  'Incorrect location',
  'Waste already cleaned by citizen',
  'Other violation'
];

export default function FlagModal({ isOpen, onClose, reportId, reportTitle }) {
  const [selectedReason, setSelectedReason] = useState(FLAG_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await reportService.flagReport(reportId, {
        reason: selectedReason,
        details: details.trim()
      });
      if (res.data.success) {
        success(res.data.message || 'Report submitted for municipal moderation.');
        onClose();
      }
    } catch (err) {
      error('Failed to submit flag. Please make sure you are logged in.');
    } finally {
      setSubmitting(false);
    }
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
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Flag Report</h3>
            <p className="text-xs text-slate-400">Report fake or inappropriate content to admins</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Reason for Flagging
            </label>
            <div className="space-y-2">
              {FLAG_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    selectedReason === r
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="flagReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide extra context to help our moderation team..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-900/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
