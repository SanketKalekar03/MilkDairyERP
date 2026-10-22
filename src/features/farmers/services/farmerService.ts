import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Farmer } from '../../../types/database';

export const farmerService = {
  async getFarmers(activeOnly = true): Promise<Farmer[]> {
    if (!isSupabaseConfigured) {
      return [
        { id: '1', name: 'Ramesh Patil', phone: '9822012345', is_active: true, created_at: '', updated_at: '' },
        { id: '2', name: 'Suresh Deshmukh', phone: '9822023456', is_active: true, created_at: '', updated_at: '' },
      ];
    }

    let query = supabase.from('farmers').select('*').order('name', { ascending: true });
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Failed to fetch farmers');
    }

    return (data || []) as Farmer[];
  },

  async createFarmer(name: string, phone?: string): Promise<Farmer> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('farmers')
      .insert({ name: name.trim(), phone: phone?.trim() || null })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create farmer');
    }

    return data as Farmer;
  },

  async updateFarmer(id: string, updates: { name?: string; phone?: string; is_active?: boolean }): Promise<Farmer> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('farmers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update farmer');
    }

    return data as Farmer;
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<Farmer> {
    return this.updateFarmer(id, { is_active: !currentStatus });
  },
};
