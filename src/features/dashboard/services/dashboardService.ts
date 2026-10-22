import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { DashboardMetrics } from '../../../types/database';

export const dashboardService = {
  async getDashboardMetrics(targetDate?: string): Promise<DashboardMetrics> {
    if (!isSupabaseConfigured) {
      // Empty initial structure if DB keys not yet configured
      return {
        business_date: targetDate || new Date().toISOString().split('T')[0],
        current_shift: 'morning',
        is_shift_active: true,
        collection: {
          morning: {
            cow_kg: 0,
            cow_litres: 0,
            cow_amount: 0,
            buffalo_kg: 0,
            buffalo_litres: 0,
            buffalo_amount: 0,
            total_kg: 0,
            total_litres: 0,
            total_amount: 0,
            tx_count: 0,
          },
          evening: {
            cow_kg: 0,
            cow_litres: 0,
            cow_amount: 0,
            buffalo_kg: 0,
            buffalo_litres: 0,
            buffalo_amount: 0,
            total_kg: 0,
            total_litres: 0,
            total_amount: 0,
            tx_count: 0,
          },
          day_total: {
            total_kg: 0,
            total_litres: 0,
            total_amount: 0,
            tx_count: 0,
          },
        },
        sales: {
          morning: {
            cow_litres: 0,
            cow_amount: 0,
            buffalo_litres: 0,
            buffalo_amount: 0,
            total_litres: 0,
            total_amount: 0,
            tx_count: 0,
          },
          evening: {
            cow_litres: 0,
            cow_amount: 0,
            buffalo_litres: 0,
            buffalo_amount: 0,
            total_litres: 0,
            total_amount: 0,
            tx_count: 0,
          },
          day_total: {
            total_litres: 0,
            total_amount: 0,
            tx_count: 0,
          },
        },
      };
    }

    // Call PostgreSQL function directly (or edge function fallback)
    const { data, error } = await supabase.rpc('get_current_day_dashboard', {
      p_target_date: targetDate || null,
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch dashboard metrics');
    }

    return data as DashboardMetrics;
  },
};
