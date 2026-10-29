import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { DairySettings } from '../../../types/database';

export const settingsService = {
  async getSettings(): Promise<DairySettings> {
    if (!isSupabaseConfigured) {
      return {
        id: 'default',
        dairy_name: 'Gokul Dairy Cooperative',
        timezone: 'Asia/Kolkata',
        morning_start: '06:00:00',
        morning_end: '18:00:00',
        evening_start: '18:00:00',
        evening_end: '06:00:00',
        is_default: true,
        created_at: '',
        updated_at: '',
      };
    }

    const { data, error } = await supabase
      .from('dairy_settings')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to load dairy settings');
    }

    return data as DairySettings;
  },

  async updateShiftSettings(updates: {
    dairy_name: string;
    timezone: string;
    morning_start: string;
    morning_end: string;
    evening_start: string;
    evening_end: string;
  }): Promise<DairySettings> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('dairy_settings')
      .update(updates)
      .eq('is_default', true)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update shift settings');
    }

    return data as DairySettings;
  },
};
