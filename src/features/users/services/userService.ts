import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Profile, UserRole } from '../../../types/database';

export const userService = {
  async getUsers(): Promise<Profile[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch user profiles');
    }

    return (data || []) as Profile[];
  },

  async updateUserRole(userId: string, role: UserRole): Promise<Profile> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update user role');
    }

    return data as Profile;
  },

  async toggleUserActive(userId: string, currentStatus: boolean): Promise<Profile> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update user active status');
    }

    return data as Profile;
  },
};
