import React from 'react';
import { cn } from '../../lib/utils';

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white p-5 rounded border border-[#afc4d4] space-y-3', className)}>
      <div className="h-4 w-1/3 bg-gray-200 rounded skeleton-shimmer" />
      <div className="h-7 w-2/3 bg-gray-200 rounded skeleton-shimmer" />
      <div className="h-3 w-1/2 bg-gray-200 rounded skeleton-shimmer" />
    </div>
  );
};
