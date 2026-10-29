import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../../auth/hooks/useAuth';
import { useShift } from '../../../app/providers/ShiftProvider';
import { DashboardSkeleton } from '../../../components/skeletons/DashboardSkeleton';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { MetricCard } from './MetricCard';
import { MilkStockCard } from './MilkStockCard';
import { ShiftOperationsSection } from './ShiftOperationsSection';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { formatCurrency, formatQuantity } from '../../../lib/utils';
import {
  Milk,
  Store,
  Sun,
  Moon,
  Layers,
  Plus,
  Calendar,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
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
  const userName = profile?.full_name || 'Dairy Operator';
  const todayDate = new Date().toISOString().split('T')[0];
  const isViewingToday = selectedDate === todayDate;

  // Collection Totals
  const collectionTotal = metrics?.collection?.day_total || {
    total_litres: 0,
    total_amount: 0,
    tx_count: 0,
  };

  // Sales Totals
  const salesTotal = metrics?.sales?.day_total || {
    total_litres: 0,
    total_amount: 0,
    tx_count: 0,
  };

  // Current active shift data
  const activeShiftCollection =
    currentShift === 'morning'
      ? metrics?.collection?.morning
      : metrics?.collection?.evening;

  const activeShiftSales =
    currentShift === 'morning'
      ? metrics?.sales?.morning
      : metrics?.sales?.evening;

  // Stock Totals
  const stockOverall = metrics?.stock?.overall || {
    total_available_litres: 0,
    total_collected_litres: 0,
    total_sold_litres: 0,
  };
  const cowStock = metrics?.stock?.cow?.available_litres || 0;
  const buffaloStock = metrics?.stock?.buffalo?.available_litres || 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome, Live Shift & Action Center */}
      <div className="bg-white p-5 rounded-lg border border-[#afc4d4] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        {/* Left: User Welcome & Live Shift Indicator */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-[#2F4156]">
              Welcome, {userName}
            </h2>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C8D9E6] text-[#2F4156]">
              {profile?.role || 'Staff'}
            </span>
            {!isViewingToday && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                Viewing Past Record: {selectedDate}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#567C8D]">
            <div className="flex items-center gap-1.5">
              <span>Active Shift:</span>
              <ShiftBadge shift={currentShift} />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Auto-timed (6 AM – 6 PM)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Auto-refresh Date Picker */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Quick Action: Record Milk Collection */}
          <Link
            to="/collection"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-md bg-[#2F4156] text-white hover:bg-[#243344] shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Collection</span>
          </Link>

          {/* Quick Action: Record Milk Sale */}
          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </Link>

          {/* Date Selector (Auto-refreshes on change) */}
          <div className="flex items-center gap-1.5 bg-[#F5EFEB] px-2.5 py-1.5 rounded-md border border-[#afc4d4]">
            <Calendar className="w-3.5 h-3.5 text-[#567C8D]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="text-xs bg-transparent text-[#2F4156] font-semibold focus:outline-hidden cursor-pointer"
              title="Select business date (auto-refreshes)"
            />
            {!isViewingToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayDate)}
                className="text-[10px] font-bold uppercase text-blue-700 hover:text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 ml-1"
                title="Return to today"
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Balanced Executive 4-KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Milk Collection (Procurement) */}
        <MetricCard
          title={isViewingToday ? "Today Collection" : "Day Collection"}
          amount={collectionTotal.total_amount}
          qtyLitres={collectionTotal.total_litres}
          primaryMetric="litres"
          icon={Milk}
          variant="blue"
          details={[
            {
              label: 'M',
              value: formatQuantity(metrics?.collection?.morning?.total_litres || 0),
            },
            {
              label: 'E',
              value: formatQuantity(metrics?.collection?.evening?.total_litres || 0),
            },
            {
              label: 'Tx',
              value: `${collectionTotal.tx_count}`,
            },
          ]}
        />

        {/* Card 2: Today's Milk Sales (Distribution) */}
        <MetricCard
          title={isViewingToday ? "Today Sales" : "Day Sales"}
          amount={salesTotal.total_amount}
          qtyLitres={salesTotal.total_litres}
          primaryMetric="litres"
          icon={Store}
          variant="emerald"
          details={[
            {
              label: 'M',
              value: formatQuantity(metrics?.sales?.morning?.total_litres || 0),
            },
            {
              label: 'E',
              value: formatQuantity(metrics?.sales?.evening?.total_litres || 0),
            },
            {
              label: 'Tx',
              value: `${salesTotal.tx_count}`,
            },
          ]}
        />

        {/* Card 3: Active Shift Progress */}
        <MetricCard
          title={`${currentShift === 'morning' ? 'Morning' : 'Evening'} Shift`}
          amount={activeShiftCollection?.total_amount || 0}
          qtyLitres={activeShiftCollection?.total_litres || 0}
          primaryMetric="litres"
          icon={currentShift === 'morning' ? Sun : Moon}
          variant="amber"
          badge={
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Active
            </span>
          }
          details={[
            {
              label: 'Sold',
              value: formatQuantity(activeShiftSales?.total_litres || 0),
            },
            {
              label: 'Entries',
              value: `${(activeShiftCollection?.tx_count || 0) + (activeShiftSales?.tx_count || 0)}`,
            },
          ]}
        />

        {/* Card 4: Live Milk Stock in Tanks */}
        <MetricCard
          title="Available Stock"
          amount={stockOverall.total_available_litres * 55}
          qtyLitres={stockOverall.total_available_litres}
          primaryMetric="litres"
          icon={Layers}
          variant="purple"
          onClick={() => navigate('/stock')}
          details={[
            {
              label: 'Cow',
              value: `${cowStock.toFixed(1)} L`,
            },
            {
              label: 'Buff',
              value: `${buffaloStock.toFixed(1)} L`,
            },
          ]}
        />
      </div>

      {/* Real-time Milk Tank & Inventory Section */}
      <MilkStockCard stock={metrics?.stock} />

      {/* Interactive Shift Operations Section */}
      {metrics && (
        <ShiftOperationsSection
          metrics={metrics}
          activeShift={currentShift}
        />
      )}
    </div>
  );
};
