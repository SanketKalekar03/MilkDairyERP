import React from 'react';
import type { MilkType } from '../../types/database';
import { cn } from '../../lib/utils';

export interface MilkTypeBadgeProps {
  type: MilkType;
  className?: string;
}

export const MilkTypeBadge: React.FC<MilkTypeBadgeProps> = ({ type, className }) => {
  const isCow = type === 'cow';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        isCow
          ? 'bg-amber-50 text-amber-900 border border-amber-200'
          : 'bg-[#567C8D] text-white',
        className
      )}
    >
      {isCow ? 'Cow Milk' : 'Buffalo Milk'}
    </span>
  );
};
