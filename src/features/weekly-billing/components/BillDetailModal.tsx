import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { MilkTypeBadge } from '../../../components/ui/MilkTypeBadge';
import { BillSkeleton } from '../../../components/skeletons/BillSkeleton';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { weeklyBillingService } from '../services/weeklyBillingService';
import type { FarmerWeeklyBill, CustomerWeeklyBill, MilkCollection, MilkSale } from '../../../types/database';
import { formatCurrency, formatQuantity, formatDate } from '../../../lib/utils';
import { CheckCircle2, AlertCircle, Printer } from 'lucide-react';

export interface BillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'farmer' | 'customer';
  billId: string | null;
  onFinalized?: () => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  billId,
  onFinalized,
}) => {
  const [bill, setBill] = useState<FarmerWeeklyBill | CustomerWeeklyBill | null>(null);
  const [farmerItems, setFarmerItems] = useState<MilkCollection[]>([]);
  const [customerItems, setCustomerItems] = useState<MilkSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const loadBillDetails = React.useCallback(async () => {
    if (!billId) return;
    setIsLoading(true);
    setError(null);
    try {
      if (type === 'farmer') {
        const result = await weeklyBillingService.getFarmerBillDetails(billId);
        setBill(result.bill);
        setFarmerItems(result.items);
      } else {
        const result = await weeklyBillingService.getCustomerBillDetails(billId);
        setBill(result.bill);
        setCustomerItems(result.items);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bill details');
    } finally {
      setIsLoading(false);
    }
  }, [billId, type]);

  useEffect(() => {
    if (isOpen && billId) {
      loadBillDetails();
    } else {
      setBill(null);
      setFarmerItems([]);
      setCustomerItems([]);
      setError(null);
    }
  }, [isOpen, billId, type, loadBillDetails]);

  const handleFinalize = async () => {
    if (!billId) return;
    setIsFinalizing(true);
    try {
      if (type === 'farmer') {
        await weeklyBillingService.finalizeFarmerBill(billId);
      } else {
        await weeklyBillingService.finalizeCustomerBill(billId);
      }
      setIsConfirmOpen(false);
      await loadBillDetails();
      if (onFinalized) onFinalized();
    } catch (err: any) {
      alert(err.message || 'Failed to finalize bill');
    } finally {
      setIsFinalizing(false);
    }
  };

  const isFinalized = bill?.status === 'finalized';
  const entityName =
    type === 'farmer'
      ? (bill as FarmerWeeklyBill)?.farmer?.name || 'Farmer'
      : (bill as CustomerWeeklyBill)?.customer?.name || 'Customer';

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={type === 'farmer' ? 'Farmer Weekly Bill' : 'Customer Weekly Bill'}
        description={`Period: ${formatDate(bill?.period_start)} to ${formatDate(bill?.period_end)}`}
        maxWidth="2xl"
      >
        {isLoading ? (
          <BillSkeleton />
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : bill ? (
          <div className="space-y-4">
            {/* Bill Summary Banner */}
            <div className="bg-[#F5EFEB] p-4 rounded border border-[#afc4d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#567C8D]">
                  {type === 'farmer' ? 'Farmer Name' : 'Customer Name'}
                </span>
                <h4 className="text-base font-bold text-[#2F4156]">{entityName}</h4>
                <div className="text-xs text-[#567C8D] mt-0.5">
                  Billing Period: {formatDate(bill.period_start)} — {formatDate(bill.period_end)}
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-[#567C8D] block">
                  Bill Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={bill.status} />
                </div>
              </div>
            </div>

            {/* Transactions Itemized Table */}
            <div className="border border-[#afc4d4] rounded overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F5EFEB] sticky top-0 border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  {type === 'farmer' ? (
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Fat %</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Litres</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#e1ebf3]">
                  {type === 'farmer'
                    ? farmerItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#faf7f5]">
                          <td className="py-2 px-3 font-medium text-[#2F4156]">
                            {formatDate(item.business_date)}
                          </td>
                          <td className="py-2 px-3">
                            <ShiftBadge shift={item.shift} />
                          </td>
                          <td className="py-2 px-3">
                            <MilkTypeBadge type={item.milk_type} />
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatQuantity(item.quantity, item.quantity_unit)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {item.fat_percent.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ₹{item.applied_rate.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#2F4156]">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))
                    : customerItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#faf7f5]">
                          <td className="py-2 px-3 font-medium text-[#2F4156]">
                            {formatDate(item.business_date)}
                          </td>
                          <td className="py-2 px-3">
                            <ShiftBadge shift={item.shift} />
                          </td>
                          <td className="py-2 px-3">
                            <MilkTypeBadge type={item.milk_type} />
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatQuantity(item.quantity_litres, 'litre')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ₹{item.applied_rate.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#2F4156]">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="bg-[#F5EFEB] p-4 rounded border border-[#afc4d4] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-[#567C8D]">
                  Weekly Total Payable / Due
                </span>
                <p className="text-[11px] text-gray-500">
                  Calculated purely from stored transactions (ACID verified).
                </p>
              </div>
              <div className="text-xl font-bold font-mono text-[#2F4156] tabular-nums">
                {formatCurrency(bill.total_amount)}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#afc4d4] flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Invoice
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                {!isFinalized && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsConfirmOpen(true)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Finalize Bill
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalize}
        title="Finalize Weekly Bill?"
        message="Once finalized, this bill is locked and historical database transactions cannot be unbilled or modified. Do you want to proceed?"
        confirmText="Finalize Bill"
        variant="primary"
        isLoading={isFinalizing}
      />
    </>
  );
};
