import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { MilkStockData, MilkType } from '../../../types/database';

export const stockService = {
  /**
   * Fetch complete milk stock summary (inflow, outflow, available balance)
   */
  async getStockSummary(targetDate?: string): Promise<MilkStockData> {
    const today = targetDate || new Date().toISOString().split('T')[0];

    if (!isSupabaseConfigured) {
      return this.getEmptyStockData(today);
    }

    // Try calling the PostgreSQL RPC get_milk_stock first
    try {
      const { data, error } = await supabase.rpc('get_milk_stock', {
        p_target_date: today,
      });

      if (!error && data && data.cow && data.buffalo) {
        return data as MilkStockData;
      }
    } catch {
      // Fallback to client-side aggregation if RPC is not yet applied
    }

    return this.calculateStockFromTables(today);
  },

  /**
   * Get real-time available stock in litres for a specific milk type
   */
  async getAvailableStock(milkType: MilkType): Promise<number> {
    if (!isSupabaseConfigured) return 0;

    try {
      const summary = await this.getStockSummary();
      return milkType === 'cow'
        ? summary.cow.available_litres
        : summary.buffalo.available_litres;
    } catch {
      return 0;
    }
  },

  /**
   * Robust fallback calculation by directly querying collections and sales
   */
  async calculateStockFromTables(targetDate: string): Promise<MilkStockData> {
    const [collRes, salesRes] = await Promise.all([
      supabase
        .from('milk_collections')
        .select('milk_type, quantity, shift, business_date'),
      supabase
        .from('milk_sales')
        .select('milk_type, quantity_litres, shift, business_date'),
    ]);

    const collections = collRes.data || [];
    const sales = salesRes.data || [];

    // Filter today's transactions
    const collToday = collections.filter((c) => c.business_date === targetDate);
    const salesToday = sales.filter((s) => s.business_date === targetDate);

    // Compute Cow Milk metrics (pure Litres)
    const cowCollToday = collToday.filter((c) => c.milk_type === 'cow');
    const cowSalesToday = salesToday.filter((s) => s.milk_type === 'cow');

    const cowLitresToday = cowCollToday.reduce((sum, c) => sum + Number(c.quantity), 0);
    const cowSoldToday = cowSalesToday.reduce(
      (sum, s) => sum + Number(s.quantity_litres),
      0
    );

    // Shift-wise Cow
    const cowMorningColl = cowCollToday
      .filter((c) => c.shift === 'morning')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    const cowMorningSold = cowSalesToday
      .filter((s) => s.shift === 'morning')
      .reduce((sum, s) => sum + Number(s.quantity_litres), 0);

    const cowEveningColl = cowCollToday
      .filter((c) => c.shift === 'evening')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    const cowEveningSold = cowSalesToday
      .filter((s) => s.shift === 'evening')
      .reduce((sum, s) => sum + Number(s.quantity_litres), 0);

    // Cumulative Cow
    const cowTotalCollectedAllTime = collections
      .filter((c) => c.milk_type === 'cow')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    const cowTotalSoldAllTime = sales
      .filter((s) => s.milk_type === 'cow')
      .reduce((sum, s) => sum + Number(s.quantity_litres), 0);
    const cowAvailable = Math.round((cowTotalCollectedAllTime - cowTotalSoldAllTime) * 1000) / 1000;

    // Compute Buffalo Milk metrics (pure Litres)
    const bufCollToday = collToday.filter((c) => c.milk_type === 'buffalo');
    const bufSalesToday = salesToday.filter((s) => s.milk_type === 'buffalo');

    const bufLitresToday = bufCollToday.reduce((sum, c) => sum + Number(c.quantity), 0);
    const bufSoldToday = bufSalesToday.reduce(
      (sum, s) => sum + Number(s.quantity_litres),
      0
    );

    // Shift-wise Buffalo
    const bufMorningColl = bufCollToday
      .filter((c) => c.shift === 'morning')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    const bufMorningSold = bufSalesToday
      .filter((s) => s.shift === 'morning')
      .reduce((sum, s) => sum + Number(s.quantity_litres), 0);

    const bufEveningColl = bufCollToday
      .filter((c) => c.shift === 'evening')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    const bufEveningSold = bufSalesToday
      .filter((s) => s.shift === 'evening')
      .reduce((sum, s) => sum + Number(s.quantity_litres), 0);

    // Cumulative Buffalo
    const bufTotalCollectedAllTime = collections
      .filter((c) => c.milk_type === 'buffalo')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    const bufTotalSoldAllTime = sales
      .filter((s) => s.milk_type === 'buffalo')
      .reduce((sum, s) => sum + Number(s.quantity_litres), 0);
    const bufAvailable = Math.round((bufTotalCollectedAllTime - bufTotalSoldAllTime) * 1000) / 1000;

    return {
      business_date: targetDate,
      cow: {
        collected_litres: Math.round(cowLitresToday * 1000) / 1000,
        total_collected_equiv_litres: Math.round(cowLitresToday * 1000) / 1000,
        sold_litres: Math.round(cowSoldToday * 1000) / 1000,
        available_litres: cowAvailable,
        day_balance_litres: Math.round((cowLitresToday - cowSoldToday) * 1000) / 1000,
        morning_collected_litres: Math.round(cowMorningColl * 1000) / 1000,
        morning_collected_equiv_litres: Math.round(cowMorningColl * 1000) / 1000,
        morning_sold_litres: Math.round(cowMorningSold * 1000) / 1000,
        morning_balance_litres: Math.round((cowMorningColl - cowMorningSold) * 1000) / 1000,
        evening_collected_litres: Math.round(cowEveningColl * 1000) / 1000,
        evening_collected_equiv_litres: Math.round(cowEveningColl * 1000) / 1000,
        evening_sold_litres: Math.round(cowEveningSold * 1000) / 1000,
        evening_balance_litres: Math.round((cowEveningColl - cowEveningSold) * 1000) / 1000,
      },
      buffalo: {
        collected_litres: Math.round(bufLitresToday * 1000) / 1000,
        total_collected_equiv_litres: Math.round(bufLitresToday * 1000) / 1000,
        sold_litres: Math.round(bufSoldToday * 1000) / 1000,
        available_litres: bufAvailable,
        day_balance_litres: Math.round((bufLitresToday - bufSoldToday) * 1000) / 1000,
        morning_collected_litres: Math.round(bufMorningColl * 1000) / 1000,
        morning_collected_equiv_litres: Math.round(bufMorningColl * 1000) / 1000,
        morning_sold_litres: Math.round(bufMorningSold * 1000) / 1000,
        morning_balance_litres: Math.round((bufMorningColl - bufMorningSold) * 1000) / 1000,
        evening_collected_litres: Math.round(bufEveningColl * 1000) / 1000,
        evening_collected_equiv_litres: Math.round(bufEveningColl * 1000) / 1000,
        evening_sold_litres: Math.round(bufEveningSold * 1000) / 1000,
        evening_balance_litres: Math.round((bufEveningColl - bufEveningSold) * 1000) / 1000,
      },
      overall: {
        total_collected_litres:
          Math.round((cowLitresToday + bufLitresToday) * 1000) / 1000,
        total_collected_equiv_litres:
          Math.round((cowLitresToday + bufLitresToday) * 1000) / 1000,
        total_sold_litres: Math.round((cowSoldToday + bufSoldToday) * 1000) / 1000,
        total_available_litres: Math.round((cowAvailable + bufAvailable) * 1000) / 1000,
        day_balance_litres:
          Math.round(
            (cowLitresToday - cowSoldToday + (bufLitresToday - bufSoldToday)) * 1000
          ) / 1000,
      },
    };
  },

  getEmptyStockData(date: string): MilkStockData {
    const emptyDetail = {
      collected_litres: 0,
      total_collected_equiv_litres: 0,
      sold_litres: 0,
      available_litres: 0,
      day_balance_litres: 0,
      morning_collected_litres: 0,
      morning_collected_equiv_litres: 0,
      morning_sold_litres: 0,
      morning_balance_litres: 0,
      evening_collected_litres: 0,
      evening_collected_equiv_litres: 0,
      evening_sold_litres: 0,
      evening_balance_litres: 0,
    };

    return {
      business_date: date,
      cow: { ...emptyDetail },
      buffalo: { ...emptyDetail },
      overall: {
        total_collected_litres: 0,
        total_collected_equiv_litres: 0,
        total_sold_litres: 0,
        total_available_litres: 0,
        day_balance_litres: 0,
      },
    };
  },
};
