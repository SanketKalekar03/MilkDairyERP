import React, { useState, useEffect, useCallback } from 'react';
import { milkCollectionService } from '../services/milkCollectionService';
import { useFarmers } from '../../farmers/hooks/useFarmers';
import type { MilkCollection } from '../../../types/database';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { MilkTypeBadge } from '../../../components/ui/MilkTypeBadge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatQuantity, formatDate } from '../../../lib/utils';
import { MILK_TYPES, SHIFT_OPTIONS } from '../../../lib/constants';
import { Filter, ChevronLeft, ChevronRight, RefreshCw, Milk } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MilkCollectionHistory: React.FC = () => {
  const { farmers } = useFarmers(false);

  const [collections, setCollections] = useState<MilkCollection[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterMilkType, setFilterMilkType] = useState('');
  const [filterFarmerId, setFilterFarmerId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await milkCollectionService.getCollections({
        date: filterDate || undefined,
        shift: (filterShift as any) || undefined,
        milkType: (filterMilkType as any) || undefined,
        farmerId: filterFarmerId || undefined,
        page,
        pageSize,
      });
      setCollections(result.data);
      setTotalCount(result.count);
    } catch (err: any) {
      setError(err.message || 'Failed to load collections history');
    } finally {
      setIsLoading(false);
    }
  }, [filterDate, filterShift, filterMilkType, filterFarmerId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterShift('');
    setFilterMilkType('');
    setFilterFarmerId('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Milk Collection History"
        subtitle="Historical audit log of all farmer milk collections with applied rates."
        actions={
          <Link to="/collection">
            <Button variant="primary" size="sm">
              Record Collection
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

          {/* Farmer */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">
              Farmer
            </label>
            <select
              value={filterFarmerId}
              onChange={(e) => {
                setFilterFarmerId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156]"
            >
              <option value="">All Farmers</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
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
        <TableSkeleton rows={8} columns={7} />
      ) : collections.length === 0 ? (
        <EmptyState
          title="No collection records found"
          description="Try adjusting your filter criteria or record a new collection."
          icon={<Milk className="w-6 h-6" />}
          actionLabel="Record Collection"
          onAction={() => window.location.assign('/collection')}
        />
      ) : (
        <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  <th className="py-3 px-4">Date & Shift</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Milk Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Fat %</th>
                  <th className="py-3 px-4 text-right">Applied Rate</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1ebf3]">
                {collections.map((c) => (
                  <tr key={c.id} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2F4156]">
                        {formatDate(c.business_date)}
                      </div>
                      <div className="mt-0.5">
                        <ShiftBadge shift={c.shift} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2F4156]">
                      {c.farmer?.name || 'Unknown Farmer'}
                    </td>
                    <td className="py-3 px-4">
                      <MilkTypeBadge type={c.milk_type} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-700">
                      {formatQuantity(c.quantity, c.quantity_unit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-700">
                      {c.fat_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-700">
                      ₹{c.applied_rate.toFixed(2)}/{c.quantity_unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2F4156] tabular-nums text-sm">
                      {formatCurrency(c.amount)}
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
