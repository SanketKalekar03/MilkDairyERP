import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import type { MilkStockData } from '../../../types/database';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Milk,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MilkStockView: React.FC = () => {
  const [stock, setStock] = useState<MilkStockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadStock = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stockService.getStockSummary(targetDate);
      setStock(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load milk stock.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [targetDate]);

  const cow = stock?.cow;
  const buffalo = stock?.buffalo;
  const overall = stock?.overall;

  const renderBadge = (available: number) => {
    if (available > 5) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Healthy Stock
        </span>
      );
    }
    if (available > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-300">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        {available < 0 ? 'Deficit / Oversold' : 'Out of Stock'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Milk Stock & Inventory"
        description="Monitor real-time dairy milk stock, collection inflows, sales outflows, and shift balances."
        actions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-white text-[#2F4156] font-medium"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={loadStock}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Stock
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Top Level Overall Summary Bar */}
      {overall && (
        <div className="bg-[#2F4156] text-white p-6 rounded shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#567C8D] flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C8D9E6]">
                Total Available Dairy Stock (All-Time Balance)
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-3xl font-extrabold font-mono ${overall.total_available_litres < 0 ? 'text-rose-300' : 'text-white'}`}>
                  {overall.total_available_litres.toFixed(3)}
                </span>
                <span className="text-sm font-semibold text-[#C8D9E6]">Litres</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-[#243344] px-3.5 py-2 rounded border border-[#3a5068]">
              <span className="text-[#8ba6b4] block">Today Total Inflow:</span>
              <span className="text-sm font-bold text-white font-mono">
                {overall.total_collected_litres.toFixed(3)} L
              </span>
            </div>
            <div className="bg-[#243344] px-3.5 py-2 rounded border border-[#3a5068]">
              <span className="text-[#8ba6b4] block">Today Total Outflow:</span>
              <span className="text-sm font-bold text-white font-mono">
                {overall.total_sold_litres.toFixed(3)} L
              </span>
            </div>
            <div className="bg-[#243344] px-3.5 py-2 rounded border border-[#3a5068]">
              <span className="text-[#8ba6b4] block">Today Net Balance:</span>
              <span className={`text-sm font-bold font-mono ${overall.day_balance_litres < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {overall.day_balance_litres > 0 ? '+' : ''}{overall.day_balance_litres.toFixed(3)} L
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Milk Type Cards: Cow vs Buffalo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cow Milk Detailed Card */}
        {cow && (
          <Card className="border-[#afc4d4]">
            <CardHeader className="bg-[#F5EFEB] py-3.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Milk className="w-5 h-5 text-[#2F4156]" />
                <CardTitle className="text-sm">Cow Milk Stock</CardTitle>
              </div>
              {renderBadge(cow.available_litres)}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Available Stock Hero */}
              <div className="bg-white p-4 rounded border border-[#afc4d4] flex items-baseline justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-semibold text-[#567C8D] uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <span className="text-[11px] text-[#567C8D]">
                    Ready for customer sales
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold font-mono ${cow.available_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'}`}>
                    {cow.available_litres.toFixed(3)}
                  </span>
                  <span className="text-xs font-semibold text-[#567C8D] ml-1">Litres</span>
                </div>
              </div>

              {/* Shift-wise Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-[#afc4d4] rounded">
                  <thead className="bg-[#F5EFEB] text-[#2F4156] font-semibold border-b border-[#afc4d4]">
                    <tr>
                      <th className="py-2 px-3">Shift</th>
                      <th className="py-2 px-3">Collected (L)</th>
                      <th className="py-2 px-3">Sold (L)</th>
                      <th className="py-2 px-3 text-right">Balance (L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#afc4d4]/60">
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#2F4156]">Morning</td>
                      <td className="py-2 px-3 font-mono">{cow.morning_collected_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{cow.morning_sold_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold">
                        {cow.morning_balance_litres.toFixed(3)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#2F4156]">Evening</td>
                      <td className="py-2 px-3 font-mono">{cow.evening_collected_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{cow.evening_sold_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold">
                        {cow.evening_balance_litres.toFixed(3)}
                      </td>
                    </tr>
                    <tr className="bg-[#F5EFEB]/50 font-bold">
                      <td className="py-2 px-3 text-[#2F4156]">Day Total</td>
                      <td className="py-2 px-3 font-mono">{cow.collected_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{cow.sold_litres.toFixed(3)}</td>
                      <td className={`py-2 px-3 font-mono text-right ${cow.day_balance_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'}`}>
                        {cow.day_balance_litres.toFixed(3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Collection Summary Note */}
              <div className="text-[11px] text-[#567C8D] bg-[#F5EFEB] p-2.5 rounded border border-[#afc4d4]/80 flex justify-between">
                <span>Morning Collection: <strong>{cow.morning_collected_litres.toFixed(3)} L</strong></span>
                <span>Evening Collection: <strong>{cow.evening_collected_litres.toFixed(3)} L</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buffalo Milk Detailed Card */}
        {buffalo && (
          <Card className="border-[#afc4d4]">
            <CardHeader className="bg-[#F5EFEB] py-3.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Milk className="w-5 h-5 text-[#2F4156]" />
                <CardTitle className="text-sm">Buffalo Milk Stock</CardTitle>
              </div>
              {renderBadge(buffalo.available_litres)}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Available Stock Hero */}
              <div className="bg-white p-4 rounded border border-[#afc4d4] flex items-baseline justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-semibold text-[#567C8D] uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <span className="text-[11px] text-[#567C8D]">
                    Ready for customer sales
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold font-mono ${buffalo.available_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'}`}>
                    {buffalo.available_litres.toFixed(3)}
                  </span>
                  <span className="text-xs font-semibold text-[#567C8D] ml-1">Litres</span>
                </div>
              </div>

              {/* Shift-wise Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-[#afc4d4] rounded">
                  <thead className="bg-[#F5EFEB] text-[#2F4156] font-semibold border-b border-[#afc4d4]">
                    <tr>
                      <th className="py-2 px-3">Shift</th>
                      <th className="py-2 px-3">Collected (L)</th>
                      <th className="py-2 px-3">Sold (L)</th>
                      <th className="py-2 px-3 text-right">Balance (L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#afc4d4]/60">
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#2F4156]">Morning</td>
                      <td className="py-2 px-3 font-mono">{buffalo.morning_collected_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{buffalo.morning_sold_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold">
                        {buffalo.morning_balance_litres.toFixed(3)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#2F4156]">Evening</td>
                      <td className="py-2 px-3 font-mono">{buffalo.evening_collected_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{buffalo.evening_sold_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold">
                        {buffalo.evening_balance_litres.toFixed(3)}
                      </td>
                    </tr>
                    <tr className="bg-[#F5EFEB]/50 font-bold">
                      <td className="py-2 px-3 text-[#2F4156]">Day Total</td>
                      <td className="py-2 px-3 font-mono">{buffalo.collected_litres.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{buffalo.sold_litres.toFixed(3)}</td>
                      <td className={`py-2 px-3 font-mono text-right ${buffalo.day_balance_litres < 0 ? 'text-rose-600' : 'text-[#2F4156]'}`}>
                        {buffalo.day_balance_litres.toFixed(3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Collection Summary Note */}
              <div className="text-[11px] text-[#567C8D] bg-[#F5EFEB] p-2.5 rounded border border-[#afc4d4]/80 flex justify-between">
                <span>Morning Collection: <strong>{buffalo.morning_collected_litres.toFixed(3)} L</strong></span>
                <span>Evening Collection: <strong>{buffalo.evening_collected_litres.toFixed(3)} L</strong></span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Operation Links */}
      <div className="bg-white p-5 rounded border border-[#afc4d4] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#2F4156]">
            Perform Daily Milk Operations
          </h4>
          <p className="text-xs text-[#567C8D]">
            Collections increase available stock; Sales decrease available stock.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to="/collection" className="flex-1 sm:flex-initial">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              leftIcon={<ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
            >
              Record Collection (Inflow)
            </Button>
          </Link>
          <Link to="/sales" className="flex-1 sm:flex-initial">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Record Sale (Outflow)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
