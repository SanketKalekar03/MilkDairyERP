import React from 'react';
import type { BillStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

export interface StatusBadgeProps {
  status: BillStatus | 'active' | 'inactive';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  if (status === 'finalized') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300',
          className
        )}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Finalized
      </span>
    );
  }

  if (status === 'draft') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300',
          className
        )}
      >
        <Clock className="w-3 h-3 text-amber-600" />
        Draft
      </span>
    );
  }

  if (status === 'active') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200',
          className
        )}
      >
        Active
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300',
        className
      )}
    >
      Inactive
    </span>
  );
};
