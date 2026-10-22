import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ShiftInfo } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ShiftContextType {
  shiftInfo: ShiftInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShift = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Informational fallback when Supabase keys not set yet
      const now = new Date();
      const hours = now.getHours();
      const isMorning = hours >= 4 && hours < 12;
      const isEvening = hours >= 15 && hours < 22;
      setShiftInfo({
        shift: isMorning ? 'morning' : isEvening ? 'evening' : 'morning',
        business_date: now.toISOString().split('T')[0],
        is_active: isMorning || isEvening,
        local_time: now.toLocaleTimeString(),
        timezone: 'Asia/Kolkata',
        morning_window: '04:00 - 12:00',
        evening_window: '15:00 - 22:00',
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_current_shift');
      if (rpcError) {
        throw rpcError;
      }
      setShiftInfo(data as ShiftInfo);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to fetch shift from backend, will retry:', err.message);
      setError(err.message || 'Failed to detect current shift');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShift();
    // Re-check shift every 60 seconds to catch shift transitions automatically
    const interval = setInterval(fetchShift, 60000);
    return () => clearInterval(interval);
  }, [fetchShift]);

  return (
    <ShiftContext.Provider
      value={{
        shiftInfo,
        isLoading,
        error,
        refreshShift: fetchShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export function useShift(): ShiftContextType {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
