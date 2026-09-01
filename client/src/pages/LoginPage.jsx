import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, User, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    const res = await demoLogin(role);
    setLoading(false);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/20 mb-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-950 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V7h2v4z"/>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Welcome Back</h1>
          <p className="text-xs text-slate-400">Sign in to your WasteWatch account</p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant 1-Click Demo Logins</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('citizen')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/50 text-left transition-all group"
            >
              <User className="w-4 h-4 text-emerald-400 mb-1" />
              <div className="font-bold text-xs text-white group-hover:text-emerald-300">Citizen</div>
              <div className="text-[10px] text-slate-400">User role</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('admin')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500/50 text-left transition-all group"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400 mb-1" />
              <div className="font-bold text-xs text-white group-hover:text-purple-300">Supervisor</div>
              <div className="text-[10px] text-slate-400">Admin role</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('staff')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-blue-950/60 border border-slate-700 hover:border-blue-500/50 text-left transition-all group"
            >
              <Wrench className="w-4 h-4 text-blue-400 mb-1" />
              <div className="font-bold text-xs text-white group-hover:text-blue-300">Sanitation</div>
              <div className="text-[10px] text-slate-400">Staff role</div>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@wastewatch.org"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
