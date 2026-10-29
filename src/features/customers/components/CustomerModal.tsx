import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { Customer } from '../../../types/database';
import { customerService } from '../services/customerService';
import { validateIndianMobileNumber } from '../../../lib/validation';

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
    } else {
      setName('');
      setPhone('');
    }
    setError(null);
    setPhoneError(null);
  }, [customer, isOpen]);

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
      setError('Customer name is required');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const { isValid, error: vErr } = validateIndianMobileNumber(trimmedPhone);
      if (!isValid) {
        setPhoneError(vErr || 'Please enter a valid 10-digit mobile number.');
        setError(vErr || 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (customer) {
        await customerService.updateCustomer(customer.id, {
          name: trimmedName,
          phone: trimmedPhone || undefined,
        });
      } else {
        await customerService.createCustomer(trimmedName, trimmedPhone || undefined);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      description="Register dairy customers who purchase milk in litres."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Customer / Business Name"
          required
          placeholder="e.g. Hotel Annapurna"
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
            placeholder="e.g. 9422011111"
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
            loadingText={customer ? 'Saving...' : 'Adding...'}
            disabled={Boolean(phoneError)}
          >
            {customer ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
