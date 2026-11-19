import React from 'react';
import type { FiqhRank } from '@/types/book';

interface FiqhBadgeProps {
  rank: FiqhRank | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDot?: boolean;
}

export function FiqhBadge({ rank, size = 'md', className = '', showDot = true }: FiqhBadgeProps) {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotColor = 'bg-slate-400';

  switch (rank) {
    case 'ركن':
      colorClasses = 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-900';
      dotColor = 'bg-rose-500';
      break;
    case 'واجب':
      colorClasses = 'bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900';
      dotColor = 'bg-amber-500';
      break;
    case 'سنة مؤكدة':
      colorClasses = 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900';
      dotColor = 'bg-emerald-500';
      break;
    case 'مستحب':
      colorClasses = 'bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-900';
      dotColor = 'bg-teal-500';
      break;
    case 'مباح':
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      dotColor = 'bg-slate-500';
      break;
    case 'عادة جبلية':
      colorClasses = 'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-900';
      dotColor = 'bg-orange-500';
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-sans font-medium transition-colors ${colorClasses} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{rank}</span>
    </span>
  );
}
