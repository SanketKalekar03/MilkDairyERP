import React, { useState, useEffect, useCallback } from 'react';
import { weeklyBillingService } from '../services/weeklyBillingService';
import { useFarmers } from '../../farmers/hooks/useFarmers';
import type { FarmerWeeklyBill } from '../../../types/database';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { BillDetailModal } from './BillDetailModal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { ReceiptText, Plus, Eye, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const FarmerBillingView: React.FC = () => {
  const { farmers } = useFarmers(false);

  const [bills, setBills] = useState<FarmerWeeklyBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Bill Generation Form State
  const [genFarmerId, setGenFarmerId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await weeklyBillingService.getFarmerBills();
      setBills(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genFarmerId) {
      setGenError('Please select a farmer');
      return;
    }
    if (!startDate || !endDate) {
      setGenError('Please specify start and end dates');
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    setGenSuccess(null);
    try {
      const result = await weeklyBillingService.generateFarmerBill(
        genFarmerId,
        startDate,
        endDate
      );
      setGenSuccess(
        `Weekly bill drafted successfully! Included ${result.item_count} collections. Total: ${formatCurrency(
          result.total_amount
        )}`
      );
      await loadBills();
      setSelectedBillId(result.bill_id);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate weekly bill');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewBill = (billId: string) => {
    setSelectedBillId(billId);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farmer Weekly Billing"
        subtitle="Generate and finalize atomic weekly payout bills for milk collections."
      />

      {/* Bill Generation Box */}
      <Card className="border-[#afc4d4]">
        <CardHeader className="bg-[#F5EFEB] py-3.5">
          <CardTitle className="text-sm">Generate New Farmer Bill</CardTitle>
          <span className="text-xs text-[#567C8D]">
            Pulls unbilled collection transactions atomically
          </span>
        </CardHeader>
        <CardContent className="p-5">
          {genSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{genSuccess}</span>
            </div>
          )}

          {genError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{genError}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5">
                Farmer <span className="text-red-500">*</span>
              </label>
              <select
                value={genFarmerId}
                onChange={(e) => setGenFarmerId(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
              >
                <option value="">-- Select Farmer --</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.phone ? `(${f.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5">
                Period From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5">
                Period To <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isGenerating}
                loadingText="Generating Weekly Bill..."
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Draft Weekly Bill
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Bills Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2F4156]">
            Generated Farmer Bills
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={loadBills}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : bills.length === 0 ? (
          <EmptyState
            title="No farmer bills generated yet"
            description="Select a farmer and date range above to draft weekly payment statements."
            icon={<ReceiptText className="w-6 h-6" />}
          />
        ) : (
          <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                    <th className="py-3 px-4">Farmer</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Payable</th>
                    <th className="py-3 px-4">Generated Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1ebf3]">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-[#faf7f5] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#2F4156]">
                        {b.farmer?.name || 'Unknown Farmer'}
                      </td>
                      <td className="py-3 px-4 text-[#567C8D]">
                        {formatDate(b.period_start)} to {formatDate(b.period_end)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#2F4156] text-sm tabular-nums">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-[#567C8D]">
                        {formatDate(b.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBill(b.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Bill
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bill Detail & Finalize Modal */}
      <BillDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        type="farmer"
        billId={selectedBillId}
        onFinalized={loadBills}
      />
    </div>
  );
};
