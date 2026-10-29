import React, { useState } from 'react';
import type { DashboardMetrics, MilkShift } from '../../../types/database';
import { ShiftCollectionTable } from './ShiftCollectionTable';
import { ShiftSalesTable } from './ShiftSalesTable';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { formatCurrency, formatQuantity } from '../../../lib/utils';
import {
  Sun,
  Moon,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  CalendarCheck2,
} from 'lucide-react';

interface ShiftOperationsSectionProps {
  metrics: DashboardMetrics;
  activeShift: MilkShift;
}

export const ShiftOperationsSection: React.FC<ShiftOperationsSectionProps> = ({
  metrics,
  activeShift,
}) => {
  // Tabs: 'morning' | 'evening' | 'all' (defaults to the currently active shift)
  const [selectedTab, setSelectedTab] = useState<MilkShift | 'all'>(activeShift);

  const morningColl = metrics.collection.morning;
  const morningSales = metrics.sales.morning;
  const eveningColl = metrics.collection.evening;
  const eveningSales = metrics.sales.evening;

  // Render shift summary strip for single shift view
  const renderShiftSummaryRibbon = (shift: MilkShift) => {
    const isMorning = shift === 'morning';
    const coll = isMorning ? morningColl : eveningColl;
    const sales = isMorning ? morningSales : eveningSales;
    const netLitres = coll.total_litres - sales.total_litres;
    const netRevenue = sales.total_amount - coll.total_amount;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf7f5] p-3.5 rounded-lg border border-[#afc4d4]">
        {/* Procured */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] block">
              Shift Procured
            </span>
            <div className="text-sm font-extrabold text-[#2F4156] font-mono">
              {formatQuantity(coll.total_litres)}
            </div>
            <span className="text-[10px] text-[#567C8D]">
              {formatCurrency(coll.total_amount)}
            </span>
          </div>
        </div>

        {/* Sold */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] block">
              Shift Sold
            </span>
            <div className="text-sm font-extrabold text-[#2F4156] font-mono">
              {formatQuantity(sales.total_litres)}
            </div>
            <span className="text-[10px] text-[#567C8D]">
              {formatCurrency(sales.total_amount)}
            </span>
          </div>
        </div>

        {/* Net Retained */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] block">
              Shift Net Retained
            </span>
            <div
              className={`text-sm font-extrabold font-mono ${
                netLitres >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {netLitres >= 0 ? '+' : ''}
              {formatQuantity(netLitres)}
            </div>
            <span className="text-[10px] text-[#567C8D]">
              {netLitres >= 0 ? 'Added to tanks' : 'Drawn from tanks'}
            </span>
          </div>
        </div>

        {/* Transactions */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] block">
              Total Activity
            </span>
            <div className="text-sm font-extrabold text-[#2F4156] font-mono">
              {coll.tx_count + sales.tx_count} Events
            </div>
            <span className="text-[10px] text-[#567C8D]">
              {coll.tx_count} intake • {sales.tx_count} sales
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-[#afc4d4] shadow-xs p-5 space-y-4">
      {/* Section Header & Segmented Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#afc4d4] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#2F4156]">
              Shift Operations & Reconciliation
            </h3>
            <span className="text-xs text-[#567C8D]">
              (Auto shift: Morning 6 AM – 6 PM | Evening 6 PM – 6 AM)
            </span>
          </div>
          <p className="text-xs text-[#567C8D] mt-0.5">
            Procurement vs retail sales comparison by shift
          </p>
        </div>

        {/* Segmented Switcher */}
        <div className="inline-flex items-center p-1 bg-[#F5EFEB] rounded-lg border border-[#afc4d4] self-start sm:self-auto">
          {/* Morning Shift Tab */}
          <button
            type="button"
            onClick={() => setSelectedTab('morning')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              selectedTab === 'morning'
                ? 'bg-white text-[#2F4156] shadow-xs border border-[#afc4d4]/60'
                : 'text-[#567C8D] hover:text-[#2F4156]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span>Morning</span>
            {activeShift === 'morning' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5 animate-pulse" title="Active Shift Now" />
            )}
          </button>

          {/* Evening Shift Tab */}
          <button
            type="button"
            onClick={() => setSelectedTab('evening')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              selectedTab === 'evening'
                ? 'bg-white text-[#2F4156] shadow-xs border border-[#afc4d4]/60'
                : 'text-[#567C8D] hover:text-[#2F4156]'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Evening</span>
            {activeShift === 'evening' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5 animate-pulse" title="Active Shift Now" />
            )}
          </button>

          {/* All Shifts Combined Tab */}
          <button
            type="button"
            onClick={() => setSelectedTab('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              selectedTab === 'all'
                ? 'bg-white text-[#2F4156] shadow-xs border border-[#afc4d4]/60'
                : 'text-[#567C8D] hover:text-[#2F4156]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#567C8D]" />
            <span>All Shifts</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {selectedTab === 'morning' && (
        <div className="space-y-4">
          {renderShiftSummaryRibbon('morning')}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ShiftCollectionTable shift="morning" data={morningColl} />
            <ShiftSalesTable shift="morning" data={morningSales} />
          </div>
        </div>
      )}

      {selectedTab === 'evening' && (
        <div className="space-y-4">
          {renderShiftSummaryRibbon('evening')}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ShiftCollectionTable shift="evening" data={eveningColl} />
            <ShiftSalesTable shift="evening" data={eveningSales} />
          </div>
        </div>
      )}

      {selectedTab === 'all' && (
        <div className="space-y-6">
          {/* Morning Shift Group */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#afc4d4]/60">
              <ShiftBadge shift="morning" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F4156]">
                Morning Shift (06:00 AM – 06:00 PM)
              </span>
            </div>
            {renderShiftSummaryRibbon('morning')}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ShiftCollectionTable shift="morning" data={morningColl} />
              <ShiftSalesTable shift="morning" data={morningSales} />
            </div>
          </div>

          {/* Evening Shift Group */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#afc4d4]/60">
              <ShiftBadge shift="evening" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F4156]">
                Evening Shift (06:00 PM – 06:00 AM)
              </span>
            </div>
            {renderShiftSummaryRibbon('evening')}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ShiftCollectionTable shift="evening" data={eveningColl} />
              <ShiftSalesTable shift="evening" data={eveningSales} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
