import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Customer } from '../../../types/database';
import { validateIndianMobileNumber } from '../../../lib/validation';

export const customerService = {
  async getCustomers(activeOnly = true): Promise<Customer[]> {
    if (!isSupabaseConfigured) {
      return [
        { id: '1', name: 'Hotel Annapurna', phone: '9422011111', is_active: true, created_at: '', updated_at: '' },
        { id: '2', name: 'Pooja Sweets', phone: '9422022222', is_active: true, created_at: '', updated_at: '' },
      ];
    }

    let query = supabase.from('customers').select('*').order('name', { ascending: true });
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Failed to fetch customers');
    }

    return (data || []) as Customer[];
  },

  async createCustomer(name: string, phone?: string): Promise<Customer> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const cleanPhone = phone?.trim();
    if (cleanPhone) {
      const { isValid, error, cleaned } = validateIndianMobileNumber(cleanPhone);
      if (!isValid) throw new Error(error || 'Invalid 10-digit mobile number');
      phone = cleaned;
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ name: name.trim(), phone: phone?.trim() || null })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create customer');
    }

    return data as Customer;
  },

  async updateCustomer(id: string, updates: { name?: string; phone?: string; is_active?: boolean }): Promise<Customer> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    if (updates.phone !== undefined) {
      const cleanPhone = updates.phone?.trim();
      if (cleanPhone) {
        const { isValid, error, cleaned } = validateIndianMobileNumber(cleanPhone);
        if (!isValid) throw new Error(error || 'Invalid 10-digit mobile number');
        updates.phone = cleaned;
      } else {
        updates.phone = undefined;
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update customer');
    }

    return data as Customer;
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<Customer> {
    return this.updateCustomer(id, { is_active: !currentStatus });
  },
};
