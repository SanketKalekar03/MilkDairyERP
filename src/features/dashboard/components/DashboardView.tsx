import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../../auth/hooks/useAuth';
import { useShift } from '../../../app/providers/ShiftProvider';
import { DashboardSkeleton } from '../../../components/skeletons/DashboardSkeleton';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { MetricCard } from './MetricCard';
import { ShiftCollectionTable } from './ShiftCollectionTable';
import { ShiftSalesTable } from './ShiftSalesTable';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { formatDate, getTodayDateString } from '../../../lib/utils';
import { Milk, Store, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const DashboardView: React.FC = () => {
  const { profile } = useAuth();
  const { shiftInfo } = useShift();
  const { metrics, isLoading, error, selectedDate, setSelectedDate, refreshMetrics } =
    useDashboard();

  if (isLoading && !metrics) {
    return <DashboardSkeleton />;
  }

  if (error && !metrics) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message={error}
        onRetry={refreshMetrics}
      />
    );
  }

  const currentShift = shiftInfo?.shift || 'morning';
  const userName = profile?.full_name || 'Operator';
  const todayDate = getTodayDateString();
  const isViewingToday = selectedDate === todayDate;

  const collectionTotal = metrics?.collection?.day_total || {
    total_kg: 0,
    total_litres: 0,
    total_amount: 0,
    tx_count: 0,
  };

  const salesTotal = metrics?.sales?.day_total || {
    total_litres: 0,
    total_amount: 0,
    tx_count: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Shift Banner */}
      <div className="bg-white p-5 rounded border border-[#afc4d4] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#2F4156]">
              Welcome, {userName}
            </h2>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C8D9E6] text-[#2F4156]">
              {profile?.role}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#567C8D]">
            <div className="flex items-center gap-1.5">
              <span>Current Shift:</span>
              <ShiftBadge shift={currentShift} />
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(selectedDate)}</span>
            </div>
          </div>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156] font-medium"
          />
          {!isViewingToday && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedDate(todayDate)}
            >
              Today
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={refreshMetrics}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Aggregated Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collection Today */}
        <MetricCard
          title={isViewingToday ? "Today's Total Collection" : 'Daily Total Collection'}
          amount={collectionTotal.total_amount}
          qtyKg={collectionTotal.total_kg}
          qtyLitres={collectionTotal.total_litres}
          txCount={collectionTotal.tx_count}
          icon={Milk}
          subtitle="All shifts combined"
        />

        {/* Morning Shift Collection */}
        <MetricCard
          title="Morning Collection"
          amount={metrics?.collection?.morning?.total_amount || 0}
          qtyKg={metrics?.collection?.morning?.total_kg || 0}
          qtyLitres={metrics?.collection?.morning?.total_litres || 0}
          txCount={metrics?.collection?.morning?.tx_count || 0}
          icon={Milk}
        />

        {/* Evening Shift Collection */}
        <MetricCard
          title="Evening Collection"
          amount={metrics?.collection?.evening?.total_amount || 0}
          qtyKg={metrics?.collection?.evening?.total_kg || 0}
          qtyLitres={metrics?.collection?.evening?.total_litres || 0}
          txCount={metrics?.collection?.evening?.tx_count || 0}
          icon={Milk}
        />

        {/* Total Sales Today */}
        <MetricCard
          title={isViewingToday ? "Today's Total Sales" : 'Daily Total Sales'}
          amount={salesTotal.total_amount}
          qtyLitres={salesTotal.total_litres}
          txCount={salesTotal.tx_count}
          icon={Store}
          subtitle="Measured in Litres only"
        />
      </div>

      {/* Morning Shift Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-[#afc4d4] pb-2">
          <ShiftBadge shift="morning" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2F4156]">
            Morning Shift Operations
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metrics && (
            <>
              <ShiftCollectionTable
                shift="morning"
                data={metrics.collection.morning}
              />
              <ShiftSalesTable shift="morning" data={metrics.sales.morning} />
            </>
          )}
        </div>
      </div>

      {/* Evening Shift Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-[#afc4d4] pb-2">
          <ShiftBadge shift="evening" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2F4156]">
            Evening Shift Operations
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metrics && (
            <>
              <ShiftCollectionTable
                shift="evening"
                data={metrics.collection.evening}
              />
              <ShiftSalesTable shift="evening" data={metrics.sales.evening} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
