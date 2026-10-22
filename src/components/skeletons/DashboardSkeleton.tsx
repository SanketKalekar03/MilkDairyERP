import React from 'react';
import { CardSkeleton } from './CardSkeleton';
import { TableSkeleton } from './TableSkeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="bg-white p-5 rounded border border-[#afc4d4] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-gray-300 rounded skeleton-shimmer" />
          <div className="h-4 w-40 bg-gray-200 rounded skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-gray-200 rounded skeleton-shimmer" />
          <div className="h-8 w-28 bg-gray-200 rounded skeleton-shimmer" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Main Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-5 w-40 bg-gray-300 rounded skeleton-shimmer" />
          <TableSkeleton rows={4} columns={4} />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-40 bg-gray-300 rounded skeleton-shimmer" />
          <TableSkeleton rows={4} columns={4} />
        </div>
      </div>
    </div>
  );
};
