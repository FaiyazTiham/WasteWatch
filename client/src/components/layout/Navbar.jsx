import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin, PlusCircle, LayoutDashboard, Shield, Users, LogOut,
  User, Menu, X, Layers, Bell, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../common/NotificationDropdown';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isStaff, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-950 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V7h2v4z"/>
            </svg>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              Waste<span className="text-emerald-400">Watch</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1 tracking-widest font-mono">CLEAN CITIES</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/map"
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/map')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Waste Map</span>
          </Link>

          <Link
            to="/reports"
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/reports')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Community Feed</span>
          </Link>

          {isStaff && (
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 border border-slate-700 text-amber-300 hover:border-amber-500/50 flex items-center gap-1 transition-all"
              title="Quickly test as Citizen, Admin, or Cleanup Staff"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Roles</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {demoMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl glass-dropdown border border-slate-700 shadow-2xl p-1.5 z-50 animate-fade-in">
                <button
                  onClick={() => {
                    demoLogin('citizen');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex items-center justify-between"
                >
                  <span>Citizen (Sarah)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">User</span>
                </button>
                <button
                  onClick={() => {
                    demoLogin('admin');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-purple-500/20 hover:text-purple-300 transition-colors flex items-center justify-between"
                >
                  <span>Supervisor (Marcus)</span>
                  <span className="text-[10px] text-purple-400 font-mono">Admin</span>
                </button>
                <button
                  onClick={() => {
                    demoLogin('staff');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-blue-500/20 hover:text-blue-300 transition-colors flex items-center justify-between"
                >
                  <span>Rapid Crew (Alex)</span>
                  <span className="text-[10px] text-blue-400 font-mono">Staff</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions: Report Button + Notifications + Profile */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/report"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Report Waste</span>
          </Link>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Auth State */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
                  }}
                />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-200 leading-none truncate max-w-[100px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-emerald-400 capitalize font-medium">
                    {user.role === 'cleanup_staff' ? 'Staff' : user.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>My Profile & Reports</span>
                  </Link>

                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <NotificationDropdown />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-dropdown border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Interactive Waste Map</span>
          </Link>

          <Link
            to="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Community Feed</span>
          </Link>

          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            <span>Submit Waste Report</span>
          </Link>

          {isStaff && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-purple-300 hover:bg-purple-900/30"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Admin Management</span>
            </Link>
          )}

          <div className="pt-2 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Profile ({user.name})</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-sm text-rose-400 hover:bg-rose-900/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 text-center rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 text-center rounded-xl bg-emerald-600 text-white font-semibold text-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
