import React from 'react';
import { cn } from '../../lib/utils';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className,
}) => {
  return (
    <div className={cn('bg-white rounded border border-[#afc4d4] overflow-hidden', className)}>
      <div className="bg-[#F5EFEB] px-4 py-3 border-b border-[#afc4d4] flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-300 rounded skeleton-shimmer flex-1"
          />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-gray-200 rounded skeleton-shimmer flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
