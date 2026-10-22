import React from 'react';
import { cn } from '../../lib/utils';

export const BillSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white p-6 rounded border border-[#afc4d4] space-y-6', className)}>
      <div className="flex justify-between items-start border-b border-[#afc4d4] pb-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-300 rounded skeleton-shimmer" />
          <div className="h-3 w-32 bg-gray-200 rounded skeleton-shimmer" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded skeleton-shimmer" />
      </div>

      <div className="space-y-3">
        <div className="h-8 bg-[#F5EFEB] rounded skeleton-shimmer" />
        <div className="h-6 bg-gray-100 rounded skeleton-shimmer" />
        <div className="h-6 bg-gray-100 rounded skeleton-shimmer" />
        <div className="h-6 bg-gray-100 rounded skeleton-shimmer" />
      </div>

      <div className="border-t border-[#afc4d4] pt-4 flex justify-between items-center">
        <div className="h-5 w-24 bg-gray-200 rounded skeleton-shimmer" />
        <div className="h-7 w-32 bg-gray-300 rounded skeleton-shimmer" />
      </div>
    </div>
  );
};
