import React from 'react';
import { AlertCircle, CheckCircle2, Clock, UserCheck, Wrench, ShieldCheck } from 'lucide-react';

const statusConfig = {
  reported: {
    label: 'Reported',
    bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    dot: 'bg-rose-500',
    icon: AlertCircle
  },
  verified: {
    label: 'Verified',
    bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    dot: 'bg-blue-500',
    icon: ShieldCheck
  },
  assigned: {
    label: 'Assigned',
    bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    dot: 'bg-purple-500',
    icon: UserCheck
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    dot: 'bg-amber-500 animate-pulse',
    icon: Wrench
  },
  cleaned: {
    label: 'Cleaned',
    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    dot: 'bg-emerald-500',
    icon: CheckCircle2
  },
  closed: {
    label: 'Closed',
    bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
    dot: 'bg-slate-500',
    icon: Clock
  }
};

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const config = statusConfig[status] || statusConfig.reported;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </span>
  );
}
