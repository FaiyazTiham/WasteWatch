import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Camera, Upload, MapPin, AlertTriangle, CheckCircle2,
  Calendar, Layers, Clock, ShieldCheck, Sparkles, X, Plus
} from 'lucide-react';
import { reportService } from '../api/apiServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LocationPickerMap from '../components/map/LocationPickerMap';
import SeverityBadge from '../components/common/SeverityBadge';

export default function ReportWastePage() {
  const { isAuthenticated, user, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [address, setAddress] = useState('Pinecrest Waterfront, River District');
  const [areaDistrict, setAreaDistrict] = useState('River District');
  const [dateTime, setDateTime] = useState(() => new Date().toISOString().slice(0, 16));

  // Photo uploads
  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [extraFiles, setExtraFiles] = useState([]);
  const [extraPreviews, setExtraPreviews] = useState([]);

  useEffect(() => {
    reportService.getCategories()
      .then((res) => {
        if (res.data.success) {
          setCategories(res.data.categories || []);
          if (res.data.categories?.length > 0) {
            setCategoryId(String(res.data.categories[0].id));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const handlePrimaryFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrimaryFile(file);
      setPrimaryPreview(URL.createObjectURL(file));
      setPhotoUrl('');
    }
  };

  const handleExtraFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setExtraFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setExtraPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeExtraFile = (index) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
    setExtraPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      error('Please sign in or use a demo account to submit a report.');
      return;
    }

    if (!title.trim() || !description.trim() || !categoryId || !address) {
      error('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', categoryId);
      formData.append('severity', severity);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('address', address.trim());
      formData.append('area_district', areaDistrict.trim() || 'Downtown Metro');

      if (primaryFile) {
        formData.append('photos', primaryFile);
      } else if (photoUrl) {
        formData.append('photo_url', photoUrl.trim());
      } else {
        // Default sample if neither provided
        formData.append('photo_url', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80');
      }

      extraFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const res = await reportService.createReport(formData);
      if (res.data.success) {
        success('Waste complaint filed successfully! Supervisors notified.');
        navigate(`/reports/${res.data.reportId}`);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit waste report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wide mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>Municipal Citizen Complaint System</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Submit a Waste Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Upload photo evidence, set the pinpoint GPS coordinates, and choose the waste category to alert the rapid response cleanup team.
        </p>
      </div>

      {/* Unauthenticated Alert Banner */}
      {!isAuthenticated && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/40 bg-amber-950/20 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">Authentication Required to Submit</h4>
              <p className="text-xs text-slate-300">Log in or activate a one-click demo citizen account to submit reports.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => demoLogin('citizen')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md"
            >
              1-Click Demo Login
            </button>
            <Link
              to="/login"
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-8 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        {/* SECTION 1: PHOTO EVIDENCE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-800">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>1. Photo Evidence (Required)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Photo Drag/Drop */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Primary Waste Photo *
              </label>

              {primaryPreview ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video border border-emerald-500/50 group bg-slate-900">
                  <img src={primaryPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPrimaryPreview(null);
                      setPrimaryFile(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer bg-slate-900/60 transition-colors aspect-video text-center">
                    <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                    <span className="text-xs font-bold text-slate-200">Click to upload photo</span>
                    <span className="text-[11px] text-slate-500 mt-1">PNG, JPG, WEBP up to 10MB</span>
                    <input type="file" accept="image/*" onChange={handlePrimaryFileSelect} className="hidden" />
                  </label>
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (Unsplash, Imgur, etc.)"
                    value={photoUrl}
                    onChange={(e) => {
                      setPhotoUrl(e.target.value);
                      if (e.target.value) setPrimaryPreview(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Additional Photos */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Optional Additional Photos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {extraPreviews.map((prev, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-slate-700 bg-slate-900">
                    <img src={prev} alt="Extra preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExtraFile(idx)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {extraPreviews.length < 4 && (
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl aspect-square cursor-pointer bg-slate-900/40 text-center p-2 transition-colors">
                    <Plus className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-slate-400 mt-1">Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleExtraFilesSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: REPORT DETAILS & CATEGORY */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-800">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>2. Waste Details & Classification</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken Glass and Discarded Electronics near Riverside Park"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe volume of waste, potential hazards, accessibility for trucks, odor, or water blockage..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Waste Category Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Waste Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategoryId(String(c.id))}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      categoryId === String(c.id)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs">{c.name}</span>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{c.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity / Priority Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Severity / Priority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { val: 'low', label: 'Low', desc: 'Minor litter, small bags' },
                  { val: 'medium', label: 'Medium', desc: 'Household clutter, overflowing bins' },
                  { val: 'high', label: 'High', desc: 'Clogged drains, construction rubble' },
                  { val: 'critical', label: 'Critical', desc: 'Chemical drums, water contamination' }
                ].map((s) => (
                  <button
                    type="button"
                    key={s.val}
                    onClick={() => setSeverity(s.val)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      severity === s.val
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase">{s.label}</span>
                      <SeverityBadge severity={s.val} size="sm" />
                    </div>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Incident Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full sm:w-72 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: LOCATION & MAP */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-800">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>3. Incident Geo-Location</span>
          </div>

          <LocationPickerMap
            latitude={latitude}
            longitude={longitude}
            onLocationChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            address={address}
            onAddressChange={(addr) => setAddress(addr)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Street Address / Landmark *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Oakridge Ave, North Valley"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Area / Municipal District *
              </label>
              <input
                type="text"
                required
                value={areaDistrict}
                onChange={(e) => setAreaDistrict(e.target.value)}
                placeholder="e.g. Downtown, River District, North Suburb"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>{submitting ? 'Submitting Report...' : 'Submit Waste Complaint'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
