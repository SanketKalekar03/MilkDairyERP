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

  /**
   * Determine shift automatically based on system timing:
   * - Morning Shift: starts at 6:00 AM (06:00) and ends at 6:00 PM (18:00)
   * - Evening Shift: starts at exact 6:00 PM (18:00) and ends at 6:00 AM (06:00)
   */
  const getSystemTimingShift = useCallback((): ShiftInfo => {
    const now = new Date();
    const hours = now.getHours();
    const isMorning = hours >= 6 && hours < 18;
    // Between 00:00 and 05:59, evening shift belongs to previous calendar day
    const isPastMidnightEvening = hours < 6;
    const businessDate = isPastMidnightEvening
      ? new Date(now.getTime() - 86400000).toISOString().split('T')[0]
      : now.toISOString().split('T')[0];

    return {
      shift: isMorning ? 'morning' : 'evening',
      business_date: businessDate,
      is_active: true,
      local_time: now.toLocaleTimeString(),
      timezone: 'Asia/Kolkata',
      morning_window: '06:00 - 18:00',
      evening_window: '18:00 - 06:00',
    };
  }, []);

  const fetchShift = useCallback(async () => {
    const systemShift = getSystemTimingShift();

    if (!isSupabaseConfigured) {
      setShiftInfo(systemShift);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_current_shift');
      if (rpcError) {
        throw rpcError;
      }
      if (data) {
        // Enforce the 6:00 AM & 6:00 PM automatic system timing rule across the application
        const now = new Date();
        const hours = now.getHours();
        const expectedShift = hours >= 6 && hours < 18 ? 'morning' : 'evening';
        const isPastMidnightEvening = hours < 6;
        const businessDate = isPastMidnightEvening
          ? new Date(now.getTime() - 86400000).toISOString().split('T')[0]
          : data.business_date || systemShift.business_date;

        setShiftInfo({
          ...(data as ShiftInfo),
          shift: expectedShift,
          business_date: businessDate,
          is_active: true,
          morning_window: '06:00 - 18:00',
          evening_window: '18:00 - 06:00',
        });
      } else {
        setShiftInfo(systemShift);
      }
      setError(null);
    } catch (err: any) {
      console.warn('Backend shift check failed, using system timing:', err.message);
      setShiftInfo(systemShift);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [getSystemTimingShift]);

  useEffect(() => {
    fetchShift();
    // Check every 15 seconds to ensure seamless automatic transition at exact 6:00 AM and 6:00 PM
    const interval = setInterval(fetchShift, 15000);
    const handleFocus = () => fetchShift();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
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
