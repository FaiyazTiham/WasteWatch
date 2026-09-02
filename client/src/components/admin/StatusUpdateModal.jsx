import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Upload, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { reportService, adminService } from '../../api/apiServices';
import { getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const STATUS_STEPS = [
  { value: 'reported', label: 'Reported', desc: 'Initial citizen submission' },
  { value: 'verified', label: 'Verified', desc: 'Inspection confirmed valid' },
  { value: 'assigned', label: 'Assigned', desc: 'Allocated to cleanup team' },
  { value: 'in_progress', label: 'In Progress', desc: 'Team on site actively clearing' },
  { value: 'cleaned', label: 'Cleaned', desc: 'Waste removed & site restored' },
  { value: 'closed', label: 'Closed', desc: 'Case resolved & archived' }
];

export default function StatusUpdateModal({ isOpen, onClose, report, onSuccess }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'cleanup_staff';
  const isAdmin = user?.role === 'admin';

  const availableSteps = isStaff
    ? STATUS_STEPS.filter((s) => ['assigned', 'in_progress', 'cleaned'].includes(s.value))
    : STATUS_STEPS;
  const [status, setStatus] = useState('verified');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [cleanedPhotoFile, setCleanedPhotoFile] = useState(null);
  const [cleanedPhotoUrl, setCleanedPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (report) {
      setStatus(report.status || 'verified');
      setAssignedTo(report.assigned_to ? String(report.assigned_to) : '');
      setNotes('');
      setCleanedPhotoFile(null);
      setCleanedPhotoUrl(report.cleaned_photo || '');
      setPhotoPreview(report.cleaned_photo ? getImageUrl(report.cleaned_photo) : null);
    }
  }, [report]);

  useEffect(() => {
    if (isOpen) {
      adminService.getStaffList()
        .then((res) => {
          if (res.data.success) {
            setStaffList(res.data.staff || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCleanedPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('status', status);
      formData.append('assigned_to', assignedTo);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (cleanedPhotoFile) {
        formData.append('cleaned_photo', cleanedPhotoFile);
      } else if (cleanedPhotoUrl) {
        formData.append('cleaned_photo', cleanedPhotoUrl);
      }

      const res = await reportService.updateStatus(report.id, formData);
      if (res.data.success) {
        success(res.data.message || 'Status successfully updated!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update report status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="glass-dropdown w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Update Report Status</h3>
            <p className="text-xs text-slate-400 truncate max-w-xs">{report.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection Steps */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Lifecycle Stage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSteps.map((step) => (
                <button
                  type="button"
                  key={step.value}
                  onClick={() => setStatus(step.value)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    status === step.value
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs capitalize">{step.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1">{step.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Assign Cleanup Staff (Admin Only) */}
          {!isStaff && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Assign to Cleanup Staff</span>
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Unassigned (General Municipal Pool) --</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cleaned Photo Upload (If Cleaned) */}
          {(status === 'cleaned' || status === 'closed') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload "After Cleanup" Proof Photo</span>
              </label>

              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-500/40 mb-2">
                  <img src={photoPreview} alt="Cleanup preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setCleanedPhotoFile(null);
                      setCleanedPhotoUrl('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer bg-slate-900/60 transition-colors">
                    <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-300">Choose photo file</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG up to 10MB</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                  <input
                    type="url"
                    placeholder="Or paste image URL (Unsplash, Cloudinary, etc.)"
                    value={cleanedPhotoUrl}
                    onChange={(e) => {
                      setCleanedPhotoUrl(e.target.value);
                      if (e.target.value) setPhotoPreview(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Resolution Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Authority Resolution Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Heavy vacuum truck deployed. 15 bags removed and sorted into recycling."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Apply Status Update'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
