import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { FarmerWeeklyBill, CustomerWeeklyBill, MilkCollection, MilkSale } from '../../../types/database';

export const weeklyBillingService = {
  // Farmer Bills
  async getFarmerBills(farmerId?: string): Promise<FarmerWeeklyBill[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('farmer_weekly_bills')
      .select('*, farmer:farmers(name, phone)')
      .order('period_start', { ascending: false });

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Failed to fetch farmer bills');
    }

    return (data || []) as FarmerWeeklyBill[];
  },

  async getFarmerBillDetails(billId: string): Promise<{
    bill: FarmerWeeklyBill;
    items: MilkCollection[];
  }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data: bill, error: billError } = await supabase
      .from('farmer_weekly_bills')
      .select('*, farmer:farmers(name, phone)')
      .eq('id', billId)
      .single();

    if (billError || !bill) {
      throw new Error(billError?.message || 'Farmer bill not found');
    }

    // Fetch bill items
    const { data: items, error: itemsError } = await supabase
      .from('farmer_weekly_bill_items')
      .select('collection:milk_collections(*)')
      .eq('bill_id', billId);

    if (itemsError) {
      throw new Error(itemsError.message || 'Failed to fetch bill items');
    }

    const collections = (items || []).map((i: any) => i.collection).filter(Boolean);

    return {
      bill: bill as FarmerWeeklyBill,
      items: collections,
    };
  },

  async generateFarmerBill(farmerId: string, periodStart: string, periodEnd: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase.rpc('create_farmer_weekly_bill', {
      p_farmer_id: farmerId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate farmer weekly bill');
    }

    return data;
  },

  async finalizeFarmerBill(billId: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase.rpc('finalize_farmer_weekly_bill', {
      p_bill_id: billId,
    });

    if (error) {
      throw new Error(error.message || 'Failed to finalize farmer weekly bill');
    }

    return data;
  },

  // Customer Bills
  async getCustomerBills(customerId?: string): Promise<CustomerWeeklyBill[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('customer_weekly_bills')
      .select('*, customer:customers(name, phone)')
      .order('period_start', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Failed to fetch customer bills');
    }

    return (data || []) as CustomerWeeklyBill[];
  },

  async getCustomerBillDetails(billId: string): Promise<{
    bill: CustomerWeeklyBill;
    items: MilkSale[];
  }> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data: bill, error: billError } = await supabase
      .from('customer_weekly_bills')
      .select('*, customer:customers(name, phone)')
      .eq('id', billId)
      .single();

    if (billError || !bill) {
      throw new Error(billError?.message || 'Customer bill not found');
    }

    const { data: items, error: itemsError } = await supabase
      .from('customer_weekly_bill_items')
      .select('sale:milk_sales(*)')
      .eq('bill_id', billId);

    if (itemsError) {
      throw new Error(itemsError.message || 'Failed to fetch customer bill items');
    }

    const sales = (items || []).map((i: any) => i.sale).filter(Boolean);

    return {
      bill: bill as CustomerWeeklyBill,
      items: sales,
    };
  },

  async generateCustomerBill(customerId: string, periodStart: string, periodEnd: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase.rpc('create_customer_weekly_bill', {
      p_customer_id: customerId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate customer weekly bill');
    }

    return data;
  },

  async finalizeCustomerBill(billId: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase.rpc('finalize_customer_weekly_bill', {
      p_bill_id: billId,
    });

    if (error) {
      throw new Error(error.message || 'Failed to finalize customer weekly bill');
    }

    return data;
  },
};
