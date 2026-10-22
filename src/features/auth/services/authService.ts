import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Profile } from '../../../types/database';

export const authService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Failed to sign in');
    }

    // Fetch user profile
    const profile = await this.getProfile(data.user.id);
    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error('Your account has been deactivated. Please contact the administrator.');
    }

    return { user: data.user, session: data.session, profile };
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  },

  async getProfile(userId: string): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'User profile not found in database');
    }

    return data as Profile;
  },
};
