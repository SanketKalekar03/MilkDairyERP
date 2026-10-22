import { useState, useEffect, useCallback } from 'react';
import type { Farmer } from '../../../types/database';
import { farmerService } from '../services/farmerService';

export function useFarmers(activeOnly = false) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await farmerService.getFarmers(activeOnly);
      setFarmers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load farmers');
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  return {
    farmers,
    isLoading,
    error,
    refreshFarmers: fetchFarmers,
  };
}
