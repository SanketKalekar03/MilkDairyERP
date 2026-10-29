import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { milkSalesSchema } from '../schemas/salesSchema';
import type { MilkSalesFormData } from '../schemas/salesSchema';
import { milkSalesService } from '../services/milkSalesService';
import { stockService } from '../../stock/services/stockService';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useShift } from '../../../app/providers/ShiftProvider';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { MILK_TYPES } from '../../../lib/constants';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Store, CheckCircle2, AlertCircle, Layers, AlertTriangle } from 'lucide-react';
import type { MilkType } from '../../../types/database';

export const MilkSalesForm: React.FC = () => {
  const { customers, isLoading: loadingCustomers } = useCustomers(true);
  const { shiftInfo } = useShift();

  const [previewRate, setPreviewRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [isCheckingRate, setIsCheckingRate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Stock management state
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MilkSalesFormData>({
    resolver: zodResolver(milkSalesSchema),
    defaultValues: {
      customer_id: '',
      milk_type: 'cow',
      quantity_litres: undefined,
    },
  });

  const selectedMilkType = watch('milk_type') as MilkType;
  const enteredQtyLitres = watch('quantity_litres');

  // Load available stock whenever selected milk type changes
  const fetchStock = async (mType: MilkType) => {
    setIsLoadingStock(true);
    try {
      const stock = await stockService.getAvailableStock(mType);
      setAvailableStock(stock);
    } catch (err) {
      console.warn('Failed to fetch stock:', err);
      setAvailableStock(null);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    if (selectedMilkType) {
      fetchStock(selectedMilkType);
    }
  }, [selectedMilkType]);

  // Preview applicable selling rate
  useEffect(() => {
    if (selectedMilkType) {
      const timer = setTimeout(async () => {
        setIsCheckingRate(true);
        setRateError(null);
        try {
          const date = shiftInfo?.business_date || new Date().toISOString().split('T')[0];
          const result = await milkSalesService.getApplicableSaleRate(
            selectedMilkType,
            date
          );
          setPreviewRate(result.appliedRate);
        } catch (err: any) {
          setPreviewRate(null);
          setRateError(err.message || `No selling rate configured for ${selectedMilkType} milk.`);
        } finally {
          setIsCheckingRate(false);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [selectedMilkType, shiftInfo?.business_date]);

  const hasInsufficientStock =
    availableStock !== null &&
    enteredQtyLitres !== undefined &&
    !isNaN(Number(enteredQtyLitres)) &&
    Number(enteredQtyLitres) > 0 &&
    Number(enteredQtyLitres) > availableStock;

  const isStockEmpty = availableStock !== null && availableStock <= 0;

  const estimatedAmount =
    previewRate !== null &&
    enteredQtyLitres &&
    !isNaN(Number(enteredQtyLitres)) &&
    Number(enteredQtyLitres) > 0
      ? Math.round(Number(enteredQtyLitres) * previewRate * 100) / 100
      : null;

  const onSubmit = async (data: MilkSalesFormData) => {
    setSuccessMessage(null);
    setSubmitError(null);

    // Double check stock client-side before sending
    if (availableStock !== null && Number(data.quantity_litres) > availableStock) {
      setSubmitError(
        `Insufficient stock! Only ${availableStock.toFixed(3)} L of ${
          data.milk_type === 'cow' ? 'Cow' : 'Buffalo'
        } milk available. Cannot sell ${data.quantity_litres} L.`
      );
      return;
    }

    try {
      const response = await milkSalesService.recordSale({
        customerId: data.customer_id,
        milkType: data.milk_type,
        quantityLitres: Number(data.quantity_litres),
      });

      setSuccessMessage(
        `Milk sale recorded successfully! Customer: ${response.customer_name}, Quantity: ${response.quantity_litres} L, Amount: ${formatCurrency(
          response.amount
        )} (Rate: ₹${response.applied_rate}/L)`
      );

      // Refresh stock balance immediately
      await fetchStock(data.milk_type);

      // Reset form but retain selected milk type
      reset({
        customer_id: '',
        milk_type: data.milk_type,
        quantity_litres: undefined,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record milk sale.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Milk Sales Entry"
        description="Record customer milk sales in litres with real-time stock balance validation."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#567C8D] font-medium hidden sm:inline">
              Session Shift:
            </span>
            <ShiftBadge shift={shiftInfo?.shift || 'morning'} />
            <span className="text-xs text-[#567C8D] font-mono ml-1">
              ({formatDate(shiftInfo?.business_date)})
            </span>
          </div>
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded text-rose-900 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{submitError}</span>
        </div>
      )}

      {/* Main Sales Form */}
      <Card className="border-[#afc4d4]">
        <CardHeader className="bg-[#F5EFEB] py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#2F4156]" />
              <CardTitle className="text-sm">Sales Entry Form</CardTitle>
            </div>
            <span className="text-xs text-[#567C8D] font-medium">
              Standard unit: Litres (L)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Customer Selection */}
            <div>
              <label
                htmlFor="customer_id"
                className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <select
                id="customer_id"
                disabled={isSubmitting || loadingCustomers}
                className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                {...register('customer_id')}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.customer_id.message}
                </p>
              )}
            </div>

            {/* Milk Type & Available Stock Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Milk Type */}
              <div>
                <label
                  htmlFor="milk_type"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
                >
                  Milk Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="milk_type"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('milk_type')}
                >
                  {MILK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity in Litres */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="quantity_litres"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156]"
                  >
                    Quantity (Litres) <span className="text-red-500">*</span>
                  </label>

                  {/* Real-time Available Stock Badge */}
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                      availableStock === null || isLoadingStock
                        ? 'bg-gray-100 text-gray-500 border-gray-200'
                        : availableStock > 5
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                        : availableStock > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                        : 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>
                      {isLoadingStock
                        ? 'Checking stock...'
                        : availableStock !== null
                        ? `Stock: ${availableStock.toFixed(3)} L`
                        : 'Stock unavailable'}
                    </span>
                  </span>
                </div>

                <input
                  id="quantity_litres"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="e.g. 5.000"
                  disabled={isSubmitting}
                  className={`w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border ${
                    hasInsufficientStock
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]'
                  }`}
                  {...register('quantity_litres', { valueAsNumber: true })}
                />
                {errors.quantity_litres && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.quantity_litres.message}
                  </p>
                )}

                {/* Stock Warning Message */}
                {hasInsufficientStock && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      Insufficient stock! Only {availableStock?.toFixed(3)} L available.
                    </span>
                  </p>
                )}

                {isStockEmpty && (
                  <p className="mt-1.5 text-xs text-amber-700 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Zero stock available for {selectedMilkType === 'cow' ? 'Cow' : 'Buffalo'} Milk. Please record collection first.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Selling Rate & Amount Preview Box */}
            <div className="bg-[#F5EFEB] p-4 rounded border border-[#afc4d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#567C8D] block">
                  Applicable Selling Rate
                </span>
                <div className="text-sm font-semibold text-[#2F4156] mt-0.5">
                  {isCheckingRate ? (
                    <span className="text-xs text-gray-500">Checking active selling rate...</span>
                  ) : rateError ? (
                    <span className="text-xs text-rose-600 font-medium">{rateError}</span>
                  ) : previewRate !== null ? (
                    <span>₹{previewRate.toFixed(2)} per Litre</span>
                  ) : (
                    <span className="text-xs text-gray-400">Loading rate...</span>
                  )}
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#afc4d4]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#567C8D] block">
                  Estimated Total
                </span>
                <div className="text-lg font-bold text-[#2F4156] font-mono tabular-nums">
                  {estimatedAmount !== null ? formatCurrency(estimatedAmount) : '₹0.00'}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                loadingText="Recording Milk Sale..."
                disabled={Boolean(rateError) || hasInsufficientStock || isStockEmpty}
              >
                Save Sales Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
