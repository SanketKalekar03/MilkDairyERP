import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { CollectionRateRule, MilkType, QuantityUnit } from '../../../types/database';

export const collectionRateService = {
  async getCollectionRates(): Promise<CollectionRateRule[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('collection_rate_rules')
      .select('*')
      .order('milk_type', { ascending: true })
      .order('quantity_unit', { ascending: true })
      .order('fat_min', { ascending: true })
      .order('valid_from', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch collection rate rules');
    }

    return (data || []) as CollectionRateRule[];
  },

  async createCollectionRate(rule: {
    milk_type: MilkType;
    quantity_unit?: QuantityUnit;
    fat_min: number;
    fat_max: number;
    rate_per_unit: number;
    valid_from: string;
    valid_to?: string | null;
  }): Promise<CollectionRateRule> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('collection_rate_rules')
      .insert({
        milk_type: rule.milk_type,
        quantity_unit: rule.quantity_unit || 'litre',
        fat_min: rule.fat_min,
        fat_max: rule.fat_max,
        rate_per_unit: rule.rate_per_unit,
        valid_from: rule.valid_from,
        valid_to: rule.valid_to || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create collection rate rule');
    }

    return data as CollectionRateRule;
  },
};
