import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { Farmer } from '../../../types/database';
import { farmerService } from '../services/farmerService';
import { validateIndianMobileNumber } from '../../../lib/validation';

export interface FarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer?: Farmer | null;
  onSuccess: () => void;
}

export const FarmerModal: React.FC<FarmerModalProps> = ({
  isOpen,
  onClose,
  farmer,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (farmer) {
      setName(farmer.name);
      setPhone(farmer.phone || '');
    } else {
      setName('');
      setPhone('');
    }
    setError(null);
    setPhoneError(null);
  }, [farmer, isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric digits and restrict to max 10 characters
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);

    if (digits.length === 0) {
      setPhoneError(null);
      return;
    }

    const { isValid, error: vErr } = validateIndianMobileNumber(digits);
    if (!isValid && digits.length === 10) {
      setPhoneError(vErr || 'Invalid mobile number');
    } else if (digits.length > 0 && digits.length < 10) {
      setPhoneError(`10 digits required (${digits.length}/10 entered)`);
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Farmer name is required');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const { isValid, error: vErr, cleaned } = validateIndianMobileNumber(trimmedPhone);
      if (!isValid) {
        setPhoneError(vErr || 'Please enter a valid 10-digit mobile number.');
        setError(vErr || 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (farmer) {
        await farmerService.updateFarmer(farmer.id, {
          name: trimmedName,
          phone: trimmedPhone || undefined,
        });
      } else {
        await farmerService.createFarmer(trimmedName, trimmedPhone || undefined);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save farmer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={farmer ? 'Edit Farmer' : 'Add New Farmer'}
      description="Register dairy farmers for milk collection and weekly billing."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          required
          placeholder="e.g. Ramesh Patil"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />

        <div>
          <Input
            label="Phone Number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 9822012345"
            value={phone}
            onChange={handlePhoneChange}
            error={phoneError || undefined}
            disabled={isSubmitting}
            helperText={
              !phoneError
                ? `Optional 10-digit mobile number (${phone.length}/10 digits)`
                : undefined
            }
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
            loadingText={farmer ? 'Saving...' : 'Adding...'}
            disabled={Boolean(phoneError)}
          >
            {farmer ? 'Save Changes' : 'Add Farmer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
