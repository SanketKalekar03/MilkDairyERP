import React from 'react';
import { cn } from '../../lib/utils';

export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className,
}) => {
  return (
    <div className={cn('bg-white p-6 rounded border border-[#afc4d4] space-y-4', className)}>
      <div className="h-5 w-1/4 bg-gray-300 rounded skeleton-shimmer mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-1/3 bg-gray-200 rounded skeleton-shimmer" />
            <div className="h-9 w-full bg-gray-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
      <div className="pt-4 flex justify-end gap-3 border-t border-[#afc4d4]">
        <div className="h-9 w-20 bg-gray-200 rounded skeleton-shimmer" />
        <div className="h-9 w-28 bg-gray-300 rounded skeleton-shimmer" />
      </div>
    </div>
  );
};
