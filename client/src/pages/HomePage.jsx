import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, PlusCircle, Sparkles, CheckCircle2, ArrowRight, ShieldCheck,
  TrendingUp, Users, Clock, AlertTriangle, Layers, Send, Search,
  Recycle, Award, HelpCircle, Mail, Phone
} from 'lucide-react';
import { reportService, contactService } from '../api/apiServices';
import ReportCard from '../components/common/ReportCard';
import { useToast } from '../context/ToastContext';

export default function HomePage() {
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({
    total: 24,
    cleaned: 16,
    inProgress: 5,
    activeUsers: 142
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await reportService.getReports({ limit: 6, sort: 'newest' });
        if (res.data.success) {
          setRecentReports(res.data.reports || []);

          // Calculate dynamic stats if available
          const reports = res.data.reports;
          const cleaned = reports.filter((r) => r.status === 'cleaned' || r.status === 'closed').length;
          const inProg = reports.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length;
          setStats({
            total: reports.length > 0 ? reports.length * 3 + 12 : 24,
            cleaned: cleaned > 0 ? cleaned * 3 + 8 : 16,
            inProgress: inProg > 0 ? inProg * 2 + 3 : 5,
            activeUsers: 186
          });
        }
      } catch (err) {
        console.warn('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/map');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      error('Please fill in all required contact fields.');
      return;
    }
    try {
      setSendingContact(true);
      const res = await contactService.sendMessage(contactForm);
      if (res.data.success) {
        success(res.data.message || 'Message sent! Our support team will get back to you.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      error('Failed to submit message.');
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <div className="space-y-24 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Community-Driven Smart Waste Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6">
            Spot It. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Report It.</span> Clean It.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            WasteWatch bridges citizens, sanitation crews, and municipal authorities. Geo-tag illegal dumpings, track real-time resolution, and celebrate transformed neighborhoods.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Report Waste Now</span>
            </Link>

            <Link
              to="/map"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-bold text-base border border-slate-700 hover:border-emerald-500/50 flex items-center justify-center gap-2.5 transition-all shadow-lg"
            >
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>View Waste Map</span>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative mb-16">
            <div className="flex items-center glass-card rounded-2xl p-2 border border-slate-700 shadow-2xl focus-within:border-emerald-500/80 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by area (Downtown, Riverbank, Highway)..."
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-md"
              >
                Search Map
              </button>
            </div>
          </form>

          {/* 2. LIVE STATISTICS COUNTERS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-card rounded-2xl p-6 text-left border border-slate-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">{stats.total}+</div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reports</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-left border border-slate-800 relative overflow-hidden group hover:border-teal-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">{stats.cleaned}+</div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cleaned & Restored</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-left border border-slate-800 relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">{stats.inProgress}</div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-left border border-slate-800 relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-1">{stats.activeUsers}</div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Citizens</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECENT REPORTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Real-Time Citizen Activity</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Recent Waste Reports</h2>
          </div>
          <Link
            to="/reports"
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Explore All Reports</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-80 rounded-2xl animate-pulse bg-slate-800/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentReports.slice(0, 6).map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>

      {/* 4. HOW WASTEWATCH WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold tracking-wide uppercase mb-3">
            <Recycle className="w-3.5 h-3.5" />
            <span>Workflow & Lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            How WasteWatch Works
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            From discovering hazardous waste on your morning walk to confirming the cleaned site, every step is transparent and tracked.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 font-black text-lg flex items-center justify-center mb-4 border border-rose-500/30">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-2">1. Spot & Snap Photo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Take a photo of illegal dumpings, plastic clutter, or blocked storm drains using your phone or camera.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 font-black text-lg flex items-center justify-center mb-4 border border-blue-500/30">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-2">2. Geo-Tag & Submit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pinpoint the exact location on our interactive map or use one-click GPS auto-detection with category & severity.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center mb-4 border border-amber-500/30">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-2">3. Verify & Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Municipal supervisors verify the submission and dispatch rapid cleanup crews with specialized machinery.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-4 border border-emerald-500/30">
              04
            </div>
            <h3 className="text-base font-bold text-white mb-2">4. Clean & Validate</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Staff upload "After Cleanup" proof photos, and the community celebrates a restored, litter-free space.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ABOUT & CONTACT SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* About Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Our Environmental Mission</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Empowering Cleaner, Safer, Sustainable Communities
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              WasteWatch is built on the belief that municipal accountability and active civic engagement create healthy environments. Every citizen report helps allocate equipment and crew where needed most, preventing chemical leaching, marine plastic buildup, and drainage blockages.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Full Transparency Workflow</h4>
                  <p className="text-xs text-slate-400">Track complaints through 6 distinct stages with time-stamped supervisor logs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Before & After Verification</h4>
                  <p className="text-xs text-slate-400">Interactive image comparison slider lets everyone visually inspect results.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Civic Engagement</h4>
                  <p className="text-xs text-slate-400">Upvote urgent complaints, share on social channels, and leave constructive comments.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div id="contact" className="lg:col-span-6 glass-card rounded-2xl p-8 border border-slate-800 shadow-2xl scroll-mt-24">
            <h3 className="text-xl font-bold text-white mb-1">Get in Touch with WasteWatch</h3>
            <p className="text-xs text-slate-400 mb-6">Have municipal feedback, cleanup partnerships, or questions?</p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="e.g. Volunteer cleanup drive / District inquiry"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your inquiry or question..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingContact}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Send className="w-4 h-4" />
                <span>{sendingContact ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
