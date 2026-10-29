import React, { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { collectionRateService } from '../services/collectionRateService';
import type { MilkType } from '../../../types/database';
import { MILK_TYPES } from '../../../lib/constants';
import { getTodayDateString } from '../../../lib/utils';

export interface CollectionRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CollectionRateModal: React.FC<CollectionRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [milkType, setMilkType] = useState<MilkType>('cow');
  const [fatMin, setFatMin] = useState<string>('2.0');
  const [fatMax, setFatMax] = useState<string>('5.0');
  const [ratePerUnit, setRatePerUnit] = useState<string>('38.00');
  const [validFrom, setValidFrom] = useState<string>(getTodayDateString());
  const [validTo, setValidTo] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseFloat(fatMin);
    const max = parseFloat(fatMax);
    const rate = parseFloat(ratePerUnit);

    if (isNaN(min) || isNaN(max) || min < 0 || max <= min) {
      setError('Please provide a valid fat range where Fat Max is greater than Fat Min.');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setError('Rate per litre must be greater than 0.');
      return;
    }
    if (!validFrom) {
      setError('Valid From date is required.');
      return;
    }
    if (validTo && validTo < validFrom) {
      setError('Valid To date cannot be earlier than Valid From date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await collectionRateService.createCollectionRate({
        milk_type: milkType,
        quantity_unit: 'litre',
        fat_min: min,
        fat_max: max,
        rate_per_unit: rate,
        valid_from: validFrom,
        valid_to: validTo || null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save collection rate rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Collection Rate Rule"
      description="Add an effective-dated fat-based purchase rate rule in Litres. Existing transactions remain untouched."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5">
              Milk Type <span className="text-red-500">*</span>
            </label>
            <select
              value={milkType}
              onChange={(e) => setMilkType(e.target.value as MilkType)}
              disabled={isSubmitting}
              className="w-full bg-white text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
            >
              {MILK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5">
              Measurement Unit
            </label>
            <input
              type="text"
              readOnly
              value="Litre (L)"
              className="w-full bg-[#F5EFEB] text-[#2F4156] px-3 py-2 text-sm rounded border border-[#afc4d4] font-medium cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fat Min (%)"
            type="number"
            step="0.1"
            min="0"
            required
            value={fatMin}
            onChange={(e) => setFatMin(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Fat Max (%)"
            type="number"
            step="0.1"
            min="0.1"
            required
            value={fatMax}
            onChange={(e) => setFatMax(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Rate per Litre (₹/L)"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={ratePerUnit}
          onChange={(e) => setRatePerUnit(e.target.value)}
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valid From"
            type="date"
            required
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Valid To (Optional)"
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            disabled={isSubmitting}
            helperText="Leave empty for open-ended active rate"
          />
        </div>

        <div className="pt-3 border-t border-[#afc4d4] flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            loadingText="Saving Rate Rule..."
          >
            Create Rate Rule
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
