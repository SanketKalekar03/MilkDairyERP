import { useState, useEffect, useCallback } from 'react';
import type { SaleRateVersion } from '../../../types/database';
import { sellingRateService } from '../services/sellingRateService';

export function useSellingRates() {
  const [rates, setRates] = useState<SaleRateVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sellingRateService.getSellingRates();
      setRates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load selling rates');
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
