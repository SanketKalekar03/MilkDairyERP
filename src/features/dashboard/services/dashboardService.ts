import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { DashboardMetrics } from '../../../types/database';
import { stockService } from '../../stock/services/stockService';

export const dashboardService = {
  async getDashboardMetrics(targetDate?: string): Promise<DashboardMetrics> {
    const today = targetDate || new Date().toISOString().split('T')[0];

    if (!isSupabaseConfigured) {
      return {
        business_date: today,
        current_shift: 'morning',
        is_shift_active: true,
        stock: stockService.getEmptyStockData(today),
        collection: {
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

    // Call PostgreSQL function directly
    const [dashRes, stockData] = await Promise.all([
      supabase.rpc('get_current_day_dashboard', {
        p_target_date: targetDate || null,
      }),
      stockService.getStockSummary(today),
    ]);

    if (dashRes.error) {
      throw new Error(dashRes.error.message || 'Failed to fetch dashboard metrics');
    }

    const metrics = dashRes.data as DashboardMetrics;
    // Ensure stock data is attached even if remote RPC has older version
    if (!metrics.stock) {
      metrics.stock = stockData;
    }

    return metrics;
  },
};
