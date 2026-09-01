import React from 'react';
import { Flame, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const severityConfig = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/20 border-red-500/40 text-red-300',
    icon: Flame
  },
  high: {
    label: 'High Priority',
    bg: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    icon: AlertOctagon
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    icon: AlertTriangle
  },
  low: {
    label: 'Low',
    bg: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
    icon: Info
  }
};

export default function SeverityBadge({ severity = 'medium', size = 'md' }) {
  const config = severityConfig[severity] || severityConfig.medium;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
