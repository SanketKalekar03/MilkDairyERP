import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { Farmer } from '../../../types/database';
import { farmerService } from '../services/farmerService';

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
  }, [farmer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Farmer name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (farmer) {
        await farmerService.updateFarmer(farmer.id, { name, phone });
      } else {
        await farmerService.createFarmer(name, phone);
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
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
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

        <Input
          label="Phone Number"
          type="tel"
          placeholder="e.g. 9822012345"
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
            loadingText={farmer ? 'Saving...' : 'Adding...'}
          >
            {farmer ? 'Save Changes' : 'Add Farmer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
