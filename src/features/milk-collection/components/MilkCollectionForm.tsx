import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { milkCollectionSchema } from '../schemas/collectionSchema';
import type { MilkCollectionFormData } from '../schemas/collectionSchema';
import { milkCollectionService } from '../services/milkCollectionService';
import { useFarmers } from '../../farmers/hooks/useFarmers';
import { useShift } from '../../../app/providers/ShiftProvider';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { MILK_TYPES, QUANTITY_UNITS } from '../../../lib/constants';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Milk, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export const MilkCollectionForm: React.FC = () => {
  const { farmers, isLoading: loadingFarmers } = useFarmers(true);
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
  } = useForm<MilkCollectionFormData>({
    resolver: zodResolver(milkCollectionSchema),
    defaultValues: {
      farmer_id: '',
      milk_type: 'cow',
      quantity_unit: 'litre',
      quantity: undefined,
      fat_percent: undefined,
    },
  });

  const selectedMilkType = watch('milk_type');
  const selectedUnit = watch('quantity_unit');
  const enteredQty = watch('quantity');
  const enteredFat = watch('fat_percent');

  // Preview applicable rate when milk_type, unit, or fat_percent changes
  useEffect(() => {
    if (
      selectedMilkType &&
      selectedUnit &&
      enteredFat !== undefined &&
      !isNaN(enteredFat) &&
      enteredFat >= 0
    ) {
      const timer = setTimeout(async () => {
        setIsCheckingRate(true);
        setRateError(null);
        try {
          const date = shiftInfo?.business_date || new Date().toISOString().split('T')[0];
          const result = await milkCollectionService.getApplicableRate(
            selectedMilkType,
            selectedUnit,
            Number(enteredFat),
            date
          );
          setPreviewRate(result.appliedRate);
        } catch (err: any) {
          setPreviewRate(null);
          setRateError(err.message || 'No collection rate defined for this fat %');
        } finally {
          setIsCheckingRate(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setPreviewRate(null);
      setRateError(null);
    }
  }, [selectedMilkType, selectedUnit, enteredFat, shiftInfo?.business_date]);

  const estimatedAmount =
    previewRate !== null && enteredQty && !isNaN(enteredQty) && enteredQty > 0
      ? Math.round(Number(enteredQty) * previewRate * 100) / 100
      : null;

  const onSubmit = async (data: MilkCollectionFormData) => {
    setSuccessMessage(null);
    setSubmitError(null);
    try {
      const response = await milkCollectionService.recordCollection({
        farmerId: data.farmer_id,
        milkType: data.milk_type,
        quantity: Number(data.quantity),
        quantityUnit: data.quantity_unit,
        fatPercent: Number(data.fat_percent),
      });

      setSuccessMessage(
        `Milk collection recorded successfully! Farmer: ${response.farmer_name}, Amount: ${formatCurrency(
          response.amount
        )} (Rate: ₹${response.applied_rate}/${data.quantity_unit})`
      );

      // Reset form but keep current milk type and unit for rapid repeated entry
      reset({
        farmer_id: '',
        milk_type: data.milk_type,
        quantity_unit: data.quantity_unit,
        quantity: undefined,
        fat_percent: undefined,
      });
      setPreviewRate(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record milk collection.');
    }
  };

  const currentShift = shiftInfo?.shift || 'morning';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Record Milk Collection"
        subtitle="Collect milk from farmers in either Kilograms (kg) or Litres (L)."
      />

      {/* Current Shift Informational Notice */}
      <div className="bg-white p-4 rounded border border-[#afc4d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#F5EFEB] flex items-center justify-center text-[#2F4156] border border-[#afc4d4]">
            <Milk className="w-5 h-5" />
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

      {/* Main Collection Form */}
      <Card className="border-[#afc4d4]">
        <CardHeader className="bg-[#F5EFEB] py-3.5">
          <CardTitle className="text-sm">Collection Entry Form</CardTitle>
          <span className="text-xs text-[#567C8D] font-medium">
            Database calculates final rate & amount
          </span>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Farmer Selection */}
            <div>
              <label
                htmlFor="farmer_id"
                className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
              >
                Farmer Name <span className="text-red-500">*</span>
              </label>
              <select
                id="farmer_id"
                disabled={isSubmitting || loadingFarmers}
                className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                {...register('farmer_id')}
              >
                <option value="">-- Select Farmer --</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.phone ? `(${f.phone})` : ''}
                  </option>
                ))}
              </select>
              {errors.farmer_id && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.farmer_id.message}
                </p>
              )}
            </div>

            {/* Milk Type and Quantity Unit Grid */}
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

              {/* Quantity Unit */}
              <div>
                <label
                  htmlFor="quantity_unit"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
                >
                  Unit of Measurement <span className="text-red-500">*</span>
                </label>
                <select
                  id="quantity_unit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('quantity_unit')}
                >
                  {QUANTITY_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity and Fat % */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
                >
                  Quantity ({selectedUnit}) <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="e.g. 15.500"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('quantity', { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              {/* Fat % */}
              <div>
                <label
                  htmlFor="fat_percent"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
                >
                  Fat Percentage (%) <span className="text-red-500">*</span>
                </label>
                <input
                  id="fat_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  placeholder="e.g. 4.2"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('fat_percent', { valueAsNumber: true })}
                />
                {errors.fat_percent && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.fat_percent.message}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Rate & Amount Preview Box */}
            <div className="bg-[#F5EFEB] p-4 rounded border border-[#afc4d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#567C8D] block">
                  Applicable Rate (Preview)
                </span>
                <div className="text-sm font-semibold text-[#2F4156] mt-0.5">
                  {isCheckingRate ? (
                    <span className="text-xs text-gray-500">Checking rate rule...</span>
                  ) : rateError ? (
                    <span className="text-xs text-rose-600 font-medium">{rateError}</span>
                  ) : previewRate !== null ? (
                    <span>
                      ₹{previewRate.toFixed(2)} / {selectedUnit}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Enter fat % to view applicable rate
                    </span>
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
                loadingText="Recording Milk Collection..."
                disabled={Boolean(rateError)}
              >
                Save Collection Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
