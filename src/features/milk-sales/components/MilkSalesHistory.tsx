import React, { useState, useEffect, useCallback } from 'react';
import { milkSalesService } from '../services/milkSalesService';
import { useCustomers } from '../../customers/hooks/useCustomers';
import type { MilkSale } from '../../../types/database';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { MilkTypeBadge } from '../../../components/ui/MilkTypeBadge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatQuantity, formatDate } from '../../../lib/utils';
import { MILK_TYPES, SHIFT_OPTIONS } from '../../../lib/constants';
import { ChevronLeft, ChevronRight, RefreshCw, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MilkSalesHistory: React.FC = () => {
  const { customers } = useCustomers(false);

  const [sales, setSales] = useState<MilkSale[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterMilkType, setFilterMilkType] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await milkSalesService.getSales({
        date: filterDate || undefined,
        shift: (filterShift as any) || undefined,
        milkType: (filterMilkType as any) || undefined,
        customerId: filterCustomerId || undefined,
        page,
        pageSize,
      });
      setSales(result.data);
      setTotalCount(result.count);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales history');
    } finally {
      setIsLoading(false);
    }
  }, [filterDate, filterShift, filterMilkType, filterCustomerId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterShift('');
    setFilterMilkType('');
    setFilterCustomerId('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Milk Sales History"
        subtitle="Historical audit log of all customer milk sales (strictly in litres) with applied selling rates."
        actions={
          <Link to="/sales">
            <Button variant="primary" size="sm">
              Record Sale
            </Button>
          </Link>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded border border-[#afc4d4] space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156]"
            />
          </div>

          {/* Shift */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">
              Shift
            </label>
            <select
              value={filterShift}
              onChange={(e) => {
                setFilterShift(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156]"
            >
              <option value="">All Shifts</option>
              {SHIFT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Milk Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">
              Milk Type
            </label>
            <select
              value={filterMilkType}
              onChange={(e) => {
                setFilterMilkType(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156]"
            >
              <option value="">All Types</option>
              {MILK_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">
              Customer
            </label>
            <select
              value={filterCustomerId}
              onChange={(e) => {
                setFilterCustomerId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156]"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[#afc4d4]">
          <span className="text-xs text-[#567C8D] font-medium">
            Found {totalCount} records
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Table Data */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : sales.length === 0 ? (
        <EmptyState
          title="No sales records found"
          description="Try adjusting your filter criteria or record a new customer sale."
          icon={<Store className="w-6 h-6" />}
          actionLabel="Record Sale"
          onAction={() => window.location.assign('/sales')}
        />
      ) : (
        <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  <th className="py-3 px-4">Date & Shift</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Milk Type</th>
                  <th className="py-3 px-4 text-right">Volume (Litres)</th>
                  <th className="py-3 px-4 text-right">Applied Rate</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1ebf3]">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2F4156]">
                        {formatDate(s.business_date)}
                      </div>
                      <div className="mt-0.5">
                        <ShiftBadge shift={s.shift} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2F4156]">
                      {s.customer?.name || 'Unknown Customer'}
                    </td>
                    <td className="py-3 px-4">
                      <MilkTypeBadge type={s.milk_type} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-700">
                      {formatQuantity(s.quantity_litres, 'litre')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-700">
                      ₹{s.applied_rate.toFixed(2)}/L
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2F4156] tabular-nums text-sm">
                      {formatCurrency(s.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-[#F5EFEB] border-t border-[#afc4d4] flex items-center justify-between">
              <span className="text-xs text-[#567C8D]">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
