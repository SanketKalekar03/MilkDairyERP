import React from 'react';
import { Link } from 'react-router-dom';
import type { MilkStockData } from '../../../types/database';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Droplet,
  Percent,
} from 'lucide-react';
import { formatQuantity } from '../../../lib/utils';

interface MilkStockCardProps {
  stock?: MilkStockData;
}

export const MilkStockCard: React.FC<MilkStockCardProps> = ({ stock }) => {
  if (!stock) return null;

  const cow = stock.cow;
  const buffalo = stock.buffalo;
  const overall = stock.overall;

  const getStatusBadge = (available: number) => {
    if (available > 10) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Optimal Stock
        </span>
      );
    }
    if (available > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Low Stock
        </span>
      );
    }
    if (available === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-300">
          Empty Tank
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        Deficit / Oversold
      </span>
    );
  };

  // Helper for visual progress meter calculation (0-100%)
  const calculateFillPercent = (available: number, collected: number) => {
    if (available <= 0) return 0;
    const maxRef = Math.max(collected, 50); // reference base
    const percent = Math.min(Math.round((available / maxRef) * 100), 100);
    return Math.max(percent, 5); // show at least a small sliver if positive
  };

  return (
    <div className="bg-white rounded-lg border border-[#afc4d4] shadow-xs p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#afc4d4] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2F4156] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5 text-[#C8D9E6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#2F4156]">
                Live Milk Tank & Stock Inventory
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Live
              </span>
            </div>
            <p className="text-xs text-[#567C8D]">
              Real-time available volume ready for dispatch or sales (Measured in Litres)
            </p>
          </div>
        </div>

        {/* Total Overall Balance Pill & Link to Detailed Ledger */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-[#F5EFEB] px-3 py-1.5 rounded-md border border-[#afc4d4]">
            <Scale className="w-4 h-4 text-[#567C8D]" />
            <span className="text-xs text-[#567C8D] font-medium">Total Dairy Stock:</span>
            <span
              className={`text-sm font-extrabold font-mono ${
                overall.total_available_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'
              }`}
            >
              {formatQuantity(overall.total_available_litres)}
            </span>
          </div>

          <Link
            to="/stock"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#567C8D] hover:text-[#2F4156] bg-white hover:bg-[#F5EFEB] px-2.5 py-1.5 rounded-md border border-[#afc4d4] transition-colors"
          >
            <span>Stock Ledger</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 2 Visual Tank Cards: Cow Milk vs Buffalo Milk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cow Milk Tank */}
        <div className="rounded-lg border border-[#afc4d4] p-4 bg-[#faf7f5] hover:border-[#567C8D] transition-colors flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#afc4d4]/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-sm font-bold text-[#2F4156] uppercase tracking-wide">
                  Cow Milk Tank
                </span>
              </div>
              {getStatusBadge(cow.available_litres)}
            </div>

            {/* Hero Available Stock Number */}
            <div className="bg-white p-3.5 rounded-md border border-[#afc4d4]/80 my-3 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#567C8D] block">
                  Available to Sell
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`text-3xl font-extrabold font-mono tracking-tight ${
                      cow.available_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'
                    }`}
                  >
                    {cow.available_litres.toFixed(3)}
                  </span>
                  <span className="text-xs font-semibold text-[#567C8D]">Litres</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplet className="w-5 h-5 fill-blue-500/20 text-blue-600" />
              </div>
            </div>

            {/* Visual Tank Gauge Bar */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px] text-[#567C8D] font-medium">
                <span>Tank Fill Indicator</span>
                <span>{calculateFillPercent(cow.available_litres, cow.collected_litres)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#e1ebf3] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    cow.available_litres > 10
                      ? 'bg-emerald-500'
                      : cow.available_litres > 0
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${calculateFillPercent(cow.available_litres, cow.collected_litres)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3-Column Today Flow Ledger */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#afc4d4]/60 text-xs">
            {/* Inflow */}
            <div className="bg-white p-2 rounded border border-[#afc4d4]/70">
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[10px] uppercase">
                <ArrowDownLeft className="w-3 h-3" />
                <span>Today In</span>
              </div>
              <p className="text-xs font-extrabold text-[#2F4156] font-mono mt-1">
                {cow.collected_litres.toFixed(1)} L
              </p>
              <p className="text-[9px] text-[#567C8D] mt-0.5 truncate">
                M:{cow.morning_collected_litres.toFixed(0)} | E:{cow.evening_collected_litres.toFixed(0)}
              </p>
            </div>

            {/* Outflow */}
            <div className="bg-white p-2 rounded border border-[#afc4d4]/70">
              <div className="flex items-center gap-1 text-amber-700 font-bold text-[10px] uppercase">
                <ArrowUpRight className="w-3 h-3" />
                <span>Today Out</span>
              </div>
              <p className="text-xs font-extrabold text-[#2F4156] font-mono mt-1">
                {cow.sold_litres.toFixed(1)} L
              </p>
              <p className="text-[9px] text-[#567C8D] mt-0.5 truncate">Retail sales</p>
            </div>

            {/* Day Balance */}
            <div className="bg-white p-2 rounded border border-[#afc4d4]/70">
              <div className="flex items-center gap-1 text-[#567C8D] font-bold text-[10px] uppercase">
                <Scale className="w-3 h-3" />
                <span>Net Today</span>
              </div>
              <p
                className={`text-xs font-extrabold font-mono mt-1 ${
                  cow.day_balance_litres >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {cow.day_balance_litres >= 0 ? '+' : ''}
                {cow.day_balance_litres.toFixed(1)} L
              </p>
              <p className="text-[9px] text-[#567C8D] mt-0.5 truncate">Retained</p>
            </div>
          </div>
        </div>

        {/* Buffalo Milk Tank */}
        <div className="rounded-lg border border-[#afc4d4] p-4 bg-[#faf7f5] hover:border-[#567C8D] transition-colors flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#afc4d4]/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-sm font-bold text-[#2F4156] uppercase tracking-wide">
                  Buffalo Milk Tank
                </span>
              </div>
              {getStatusBadge(buffalo.available_litres)}
            </div>

            {/* Hero Available Stock Number */}
            <div className="bg-white p-3.5 rounded-md border border-[#afc4d4]/80 my-3 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#567C8D] block">
                  Available to Sell
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`text-3xl font-extrabold font-mono tracking-tight ${
                      buffalo.available_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'
                    }`}
                  >
                    {buffalo.available_litres.toFixed(3)}
                  </span>
                  <span className="text-xs font-semibold text-[#567C8D]">Litres</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Droplet className="w-5 h-5 fill-indigo-500/20 text-indigo-600" />
              </div>
            </div>

            {/* Visual Tank Gauge Bar */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px] text-[#567C8D] font-medium">
                <span>Tank Fill Indicator</span>
                <span>{calculateFillPercent(buffalo.available_litres, buffalo.collected_litres)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#e1ebf3] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    buffalo.available_litres > 10
                      ? 'bg-emerald-500'
                      : buffalo.available_litres > 0
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${calculateFillPercent(
                      buffalo.available_litres,
                      buffalo.collected_litres
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3-Column Today Flow Ledger */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#afc4d4]/60 text-xs">
            {/* Inflow */}
            <div className="bg-white p-2 rounded border border-[#afc4d4]/70">
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[10px] uppercase">
                <ArrowDownLeft className="w-3 h-3" />
                <span>Today In</span>
              </div>
              <p className="text-xs font-extrabold text-[#2F4156] font-mono mt-1">
                {buffalo.collected_litres.toFixed(1)} L
              </p>
              <p className="text-[9px] text-[#567C8D] mt-0.5 truncate">
                M:{buffalo.morning_collected_litres.toFixed(0)} | E:{buffalo.evening_collected_litres.toFixed(0)}
              </p>
            </div>

            {/* Outflow */}
            <div className="bg-white p-2 rounded border border-[#afc4d4]/70">
              <div className="flex items-center gap-1 text-amber-700 font-bold text-[10px] uppercase">
                <ArrowUpRight className="w-3 h-3" />
                <span>Today Out</span>
              </div>
              <p className="text-xs font-extrabold text-[#2F4156] font-mono mt-1">
                {buffalo.sold_litres.toFixed(1)} L
              </p>
              <p className="text-[9px] text-[#567C8D] mt-0.5 truncate">Retail sales</p>
            </div>

            {/* Day Balance */}
            <div className="bg-white p-2 rounded border border-[#afc4d4]/70">
              <div className="flex items-center gap-1 text-[#567C8D] font-bold text-[10px] uppercase">
                <Scale className="w-3 h-3" />
                <span>Net Today</span>
              </div>
              <p
                className={`text-xs font-extrabold font-mono mt-1 ${
                  buffalo.day_balance_litres >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {buffalo.day_balance_litres >= 0 ? '+' : ''}
                {buffalo.day_balance_litres.toFixed(1)} L
              </p>
              <p className="text-[9px] text-[#567C8D] mt-0.5 truncate">Retained</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
