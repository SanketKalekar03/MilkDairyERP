import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { milkSalesSchema } from '../schemas/salesSchema';
import type { MilkSalesFormData } from '../schemas/salesSchema';
import { milkSalesService } from '../services/milkSalesService';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useShift } from '../../../app/providers/ShiftProvider';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { MILK_TYPES } from '../../../lib/constants';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Store, CheckCircle2, AlertCircle } from 'lucide-react';

export const MilkSalesForm: React.FC = () => {
  const { customers, isLoading: loadingCustomers } = useCustomers(true);
  const { shiftInfo } = useShift();

  const [previewRate, setPreviewRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [isCheckingRate, setIsCheckingRate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const selectedMilkType = watch('milk_type');
  const enteredQtyLitres = watch('quantity_litres');

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

  const estimatedAmount =
    previewRate !== null &&
    enteredQtyLitres &&
    !isNaN(enteredQtyLitres) &&
    enteredQtyLitres > 0
      ? Math.round(Number(enteredQtyLitres) * previewRate * 100) / 100
      : null;

  const onSubmit = async (data: MilkSalesFormData) => {
    setSuccessMessage(null);
    setSubmitError(null);
    try {
      const response = await milkSalesService.recordSale({
        customerId: data.customer_id,
        milkType: data.milk_type,
        quantityLitres: Number(data.quantity_litres),
      });

      setSuccessMessage(
        `Milk sale recorded successfully! Customer: ${response.customer_name}, Amount: ${formatCurrency(
          response.amount
        )} (Rate: ₹${response.applied_rate}/L)`
      );

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

  const currentShift = shiftInfo?.shift || 'morning';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Record Milk Sale"
        subtitle="Record daily milk sales to retail and bulk customers strictly in litres."
      />

      {/* Current Shift Informational Notice */}
      <div className="bg-white p-4 rounded border border-[#afc4d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#F5EFEB] flex items-center justify-center text-[#2F4156] border border-[#afc4d4]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#567C8D] font-bold uppercase tracking-wider">
                Current Shift:
              </span>
              <ShiftBadge shift={currentShift} />
              {!shiftInfo?.is_active && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  Outside Standard Shift Window
                </span>
              )}
            </div>
            <p className="text-xs text-[#567C8D] mt-0.5">
              Shift is automatically determined by backend server clock ({formatDate(shiftInfo?.business_date)}).
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{submitError}</span>
        </div>
      )}

      {/* Main Sales Form */}
      <Card className="border-[#afc4d4]">
        <CardHeader className="bg-[#F5EFEB] py-3.5">
          <CardTitle className="text-sm">Sales Entry Form</CardTitle>
          <span className="text-xs text-[#567C8D] font-medium">
            Standard unit: Litres (L)
          </span>
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

            {/* Milk Type & Litres */}
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
                <label
                  htmlFor="quantity_litres"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
                >
                  Quantity (Litres) <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity_litres"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="e.g. 5.000"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('quantity_litres', { valueAsNumber: true })}
                />
                {errors.quantity_litres && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.quantity_litres.message}
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
                disabled={Boolean(rateError)}
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
