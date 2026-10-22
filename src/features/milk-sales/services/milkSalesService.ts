import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { MilkSale, MilkType } from '../../../types/database';

export interface SalesFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  shift?: 'morning' | 'evening';
  milkType?: MilkType;
  page?: number;
  pageSize?: number;
}

export const milkSalesService = {
  // Preview selling rate from backend function
  async getApplicableSaleRate(
    milkType: MilkType,
    businessDate: string
  ): Promise<{ saleRateId: string; appliedRate: number }> {
    if (!isSupabaseConfigured) {
      const base = milkType === 'cow' ? 55.0 : 72.0;
      return { saleRateId: 'demo-sale-rate-id', appliedRate: base };
    }

    const { data, error } = await supabase.rpc('get_applicable_sale_rate', {
      p_milk_type: milkType,
      p_business_date: businessDate,
    });

    if (error) {
      throw new Error(error.message || `No applicable selling rate found for ${milkType} milk.`);
    }

    if (!data || data.length === 0) {
      throw new Error(`No applicable selling rate configured for ${milkType} milk.`);
    }

    return {
      saleRateId: data[0].sale_rate_id,
      appliedRate: Number(data[0].applied_rate),
    };
  },

  // Authoritative recording in backend
  async recordSale(input: {
    customerId: string;
    milkType: MilkType;
    quantityLitres: number;
  }) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    // Call PostgreSQL function directly (or edge function fallback)
    const { data, error } = await supabase.rpc('record_milk_sale', {
      p_customer_id: input.customerId,
      p_milk_type: input.milkType,
      p_quantity_litres: input.quantityLitres,
    });

    if (error) {
      throw new Error(error.message || 'Failed to record milk sale.');
    }

    return data;
  },

  // Historical sales query with pagination & filtering
  async getSales(filters: SalesFilters = {}): Promise<{
    data: MilkSale[];
    count: number;
  }> {
    if (!isSupabaseConfigured) {
      return { data: [], count: 0 };
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('milk_sales')
      .select('*, customer:customers(name, phone)', { count: 'exact' })
      .order('business_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.date) {
      query = query.eq('business_date', filters.date);
    }
    if (filters.startDate) {
      query = query.gte('business_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('business_date', filters.endDate);
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters.shift) {
      query = query.eq('shift', filters.shift);
    }
    if (filters.milkType) {
      query = query.eq('milk_type', filters.milkType);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message || 'Failed to fetch sales history');
    }

    return {
      data: (data || []) as MilkSale[],
      count: count || 0,
    };
  },
};
