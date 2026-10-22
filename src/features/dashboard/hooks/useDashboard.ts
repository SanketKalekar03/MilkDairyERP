import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics } from '../../../types/database';
import { dashboardService } from '../services/dashboardService';

export function useDashboard(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (date?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardMetrics(date || selectedDate);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMetrics(selectedDate);
  }, [fetchMetrics, selectedDate]);

  return {
    metrics,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    refreshMetrics: () => fetchMetrics(selectedDate),
  };
}
