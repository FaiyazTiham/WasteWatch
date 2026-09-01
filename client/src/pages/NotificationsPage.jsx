import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Check, Sparkles, ShieldCheck, ThumbsUp, MessageSquare,
  AlertCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import { notificationService } from '../api/apiServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function NotificationsPage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const { success } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('All notifications marked as read.');
    } catch (err) {}
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 glass-card rounded-3xl m-6">
        <Bell className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In for Notifications</h2>
        <p className="text-xs text-slate-400">Receive real-time updates when reports are verified, cleaned, or commented on.</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => demoLogin('citizen')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Demo Citizen
          </button>
          <Link to="/login" className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const getIcon = (type) => {
    switch (type) {
      case 'status_change':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case 'verification':
        return <ShieldCheck className="w-5 h-5 text-blue-400" />;
      case 'upvote':
        return <ThumbsUp className="w-5 h-5 text-amber-400" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Activity Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Notification Center</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Unread ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {/* List */}
      <div className="glass-card rounded-3xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No notifications found</h3>
            <p className="text-xs text-slate-400">You're all caught up with your report updates.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start gap-4 hover:bg-slate-800/40 transition-colors ${
                !n.is_read ? 'bg-slate-800/25' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-bold truncate ${!n.is_read ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-slate-500 shrink-0">
                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                {n.link_url && (
                  <Link
                    to={n.link_url}
                    onClick={() => handleMarkAsRead(n.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1 hover:text-emerald-300"
                  >
                    <span>Inspect Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  title="Mark as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
