import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { Customer } from '../../../types/database';
import { customerService } from '../services/customerService';

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
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (customer) {
        await customerService.updateCustomer(customer.id, { name, phone });
      } else {
        await customerService.createCustomer(name, phone);
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
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
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

        <Input
          label="Phone Number"
          type="tel"
          placeholder="e.g. 9422011111"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          helperText="Optional 10-digit mobile number"
        />

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
          >
            {customer ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
