import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { MilkCollection, MilkType, QuantityUnit } from '../../../types/database';

export interface CollectionFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  farmerId?: string;
  shift?: 'morning' | 'evening';
  milkType?: MilkType;
  page?: number;
  pageSize?: number;
}

export const milkCollectionService = {
  // Preview rate from backend function
  async getApplicableRate(
    milkType: MilkType,
    quantityUnit: QuantityUnit,
    fatPercent: number,
    businessDate: string
  ): Promise<{ rateRuleId: string; appliedRate: number }> {
    if (!isSupabaseConfigured) {
      // Offline fallback estimate
      const base = milkType === 'cow' ? 38.0 : 56.0;
      return { rateRuleId: 'demo-rate-id', appliedRate: base };
    }

    const { data, error } = await supabase.rpc('get_applicable_collection_rate', {
      p_milk_type: milkType,
      p_quantity_unit: quantityUnit,
      p_fat_percent: fatPercent,
      p_business_date: businessDate,
    });

    if (error) {
      throw new Error(error.message || 'No applicable collection rate found for this fat percentage.');
    }

    if (!data || data.length === 0) {
      throw new Error('No applicable rate found for the specified criteria.');
    }

    return {
      rateRuleId: data[0].rate_rule_id,
      appliedRate: Number(data[0].applied_rate),
    };
  },

  // Authoritative recording in backend
  async recordCollection(input: {
    farmerId: string;
    milkType: MilkType;
    quantity: number;
    quantityUnit: QuantityUnit;
    fatPercent: number;
  }) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    // Call PostgreSQL function directly (or edge function fallback)
    const { data, error } = await supabase.rpc('record_milk_collection', {
      p_farmer_id: input.farmerId,
      p_milk_type: input.milkType,
      p_quantity: input.quantity,
      p_quantity_unit: input.quantityUnit,
      p_fat_percent: input.fatPercent,
    });

    if (error) {
      throw new Error(error.message || 'Failed to record milk collection.');
    }

    return data;
  },

  // Historical collections query with pagination & filtering
  async getCollections(filters: CollectionFilters = {}): Promise<{
    data: MilkCollection[];
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
      .from('milk_collections')
      .select('*, farmer:farmers(name, phone)', { count: 'exact' })
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
    if (filters.farmerId) {
      query = query.eq('farmer_id', filters.farmerId);
    }
    if (filters.shift) {
      query = query.eq('shift', filters.shift);
    }
    if (filters.milkType) {
      query = query.eq('milk_type', filters.milkType);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message || 'Failed to fetch collection history');
    }

    return {
      data: (data || []) as MilkCollection[],
      count: count || 0,
    };
  },
};
