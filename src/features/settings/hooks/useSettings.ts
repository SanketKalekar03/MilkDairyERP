import { useState, useEffect, useCallback } from 'react';
import type { DairySettings } from '../../../types/database';
import { settingsService } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState<DairySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refreshSettings: fetchSettings,
  };
}
