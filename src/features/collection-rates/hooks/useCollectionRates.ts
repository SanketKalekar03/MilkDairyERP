import { useState, useEffect, useCallback } from 'react';
import type { CollectionRateRule } from '../../../types/database';
import { collectionRateService } from '../services/collectionRateService';

export function useCollectionRates() {
  const [rates, setRates] = useState<CollectionRateRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await collectionRateService.getCollectionRates();
      setRates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load collection rates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates,
    isLoading,
    error,
    refreshRates: fetchRates,
  };
}
