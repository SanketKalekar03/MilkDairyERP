import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { SaleRateVersion, MilkType } from '../../../types/database';

export const sellingRateService = {
  async getSellingRates(): Promise<SaleRateVersion[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('sale_rate_versions')
      .select('*')
      .order('milk_type', { ascending: true })
      .order('valid_from', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch selling rates');
    }

    return (data || []) as SaleRateVersion[];
  },

  async createSellingRate(rate: {
    milk_type: MilkType;
    rate_per_litre: number;
    valid_from: string;
    valid_to?: string | null;
  }): Promise<SaleRateVersion> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('sale_rate_versions')
      .insert({
        milk_type: rate.milk_type,
        rate_per_litre: rate.rate_per_litre,
        valid_from: rate.valid_from,
        valid_to: rate.valid_to || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create selling rate version');
    }

    return data as SaleRateVersion;
  },
};
