import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin, Heart, ArrowUpRight, Globe, Share2, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V7h2v4z"/>
                </svg>
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Waste<span className="text-emerald-400">Watch</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens, sanitation workers, and municipal authorities with real-time geo-located waste tracking, rapid response verification, and community accountability.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors" aria-label="Website">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors" aria-label="Community">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/map" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Interactive Waste Map</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Submit Waste Complaint</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Community Reports Feed</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Municipal Portal</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Waste Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/reports?category=plastic" className="hover:text-emerald-400 transition-colors">Plastic & Packaging</Link></li>
              <li><Link to="/reports?category=household-waste" className="hover:text-emerald-400 transition-colors">Household & Organic</Link></li>
              <li><Link to="/reports?category=construction-waste" className="hover:text-emerald-400 transition-colors">Construction Rubble</Link></li>
              <li><Link to="/reports?category=industrial-waste" className="hover:text-emerald-400 transition-colors">Industrial & Chemical</Link></li>
              <li><Link to="/reports?category=drain-sewer" className="hover:text-emerald-400 transition-colors">Storm Drain & Sewer</Link></li>
            </ul>
          </div>

          {/* Municipal Emergency Hotline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Emergency & Contact</h4>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <Phone className="w-3.5 h-3.5" />
                <span>Sanitation Hotline: 311 / 1-800-CLEAN</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>support@wastewatch.org</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>City Environmental Agency, Sector 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WasteWatch Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-slate-300 transition-colors">About</a>
            <a href="#how-it-works" className="hover:text-slate-300 transition-colors">How It Works</a>
            <a href="#contact" className="hover:text-slate-300 transition-colors">Contact</a>
            <span className="flex items-center gap-1 text-slate-400">
              Built for cleaner neighborhoods
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
