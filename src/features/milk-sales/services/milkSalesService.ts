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

    // Call PostgreSQL function directly
    const { data, error } = await supabase.rpc('record_milk_sale', {
      p_customer_id: input.customerId,
      p_milk_type: input.milkType,
      p_quantity_litres: input.quantityLitres,
    });

    if (!error && data) {
      return data;
    }

    // If RPC fails due to legacy column name typo in remote database (sale_rate_version_id),
    // gracefully fall back to direct table insert so the user is never blocked.
    if (error && (error.message.includes('sale_rate_version_id') || error.code === '42703')) {
      console.warn('RPC record_milk_sale failed with column error. Executing direct fallback insert...', error);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User session required to record sale.');
      }

      // Fetch customer name
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('name, is_active')
        .eq('id', input.customerId)
        .single();

      if (custError || !customer) {
        throw new Error('Customer record not found.');
      }
      if (!customer.is_active) {
        throw new Error(`Customer ${customer.name} is currently deactivated.`);
      }

      // Determine shift & business date
      let shift: 'morning' | 'evening' = 'morning';
      let businessDate = new Date().toISOString().split('T')[0];

      try {
        const { data: shiftData } = await supabase.rpc('get_current_shift');
        if (shiftData) {
          shift = (shiftData.shift as 'morning' | 'evening') || 'morning';
          businessDate = shiftData.business_date || businessDate;
        }
      } catch {
        const hours = new Date().getHours();
        shift = hours >= 6 && hours < 18 ? 'morning' : 'evening';
      }

      // Get applicable rate
      const rateInfo = await milkSalesService.getApplicableSaleRate(input.milkType, businessDate);
      const amount = Math.round(input.quantityLitres * rateInfo.appliedRate * 100) / 100;

      // Insert directly into milk_sales using correct sale_rate_id column
      const { data: inserted, error: insertError } = await supabase
        .from('milk_sales')
        .insert({
          customer_id: input.customerId,
          business_date: businessDate,
          shift: shift,
          milk_type: input.milkType,
          quantity_litres: input.quantityLitres,
          sale_rate_id: rateInfo.saleRateId,
          applied_rate: rateInfo.appliedRate,
          amount: amount,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || 'Failed to record milk sale.');
      }

      return {
        success: true,
        id: inserted.id,
        customer_id: inserted.customer_id,
        customer_name: customer.name,
        business_date: inserted.business_date,
        shift: inserted.shift,
        milk_type: inserted.milk_type,
        quantity_litres: inserted.quantity_litres,
        applied_rate: inserted.applied_rate,
        amount: inserted.amount,
        created_at: inserted.created_at,
      };
    }

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
