import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Profile } from '../../../types/database';

export const authService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error(
          'Invalid email or password. If this is a new database setup, please run the SQL seed script in your Supabase SQL Editor to create the Admin & Operator accounts.'
        );
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email is not confirmed yet. Please verify your email or run the seed script to confirm accounts.');
      }
      throw new Error(error.message || 'Failed to sign in');
    }

    if (!data.user) {
      throw new Error('No user returned from authentication.');
    }

    // Fetch or self-provision user profile
    const profile = await this.getProfile(data.user.id);
    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error('Your account has been deactivated. Please contact the administrator.');
    }

    return { user: data.user, session: data.session, profile };
  },

  async signUp(email: string, password: string, fullName?: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const name = fullName?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to register account');
    }

    if (!data.user) {
      throw new Error('Registration failed. Please try again.');
    }

    // If session is immediately returned (Auto-confirm enabled in Supabase)
    if (data.session) {
      const profile = await this.getProfile(data.user.id);
      return { user: data.user, session: data.session, profile };
    }

    return { user: data.user, session: null, profile: null };
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

    // Try fetching existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      return data as Profile;
    }

    if (error && error.code !== 'PGRST116') {
      console.warn('Profile fetch warning:', error.message);
    }

    // Self-provision profile if row does not exist yet (e.g. user created via Supabase Auth Dashboard)
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;

    const email = (currentUser?.email || '').toLowerCase();
    const fullName =
      currentUser?.user_metadata?.full_name ||
      currentUser?.user_metadata?.name ||
      (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Dairy Staff');

    // Check if any admin exists currently
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    const isFirstUserOrAdmin =
      count === 0 ||
      count === null ||
      email.includes('admin') ||
      email.includes('proprietor');

    const newProfileData = {
      id: userId,
      full_name: fullName,
      role: (isFirstUserOrAdmin ? 'admin' : 'operator') as const,
      is_active: true,
    };

    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .upsert(newProfileData)
      .select()
      .single();

    if (insertError || !createdProfile) {
      console.error('Failed to auto-provision profile:', insertError);
      // Fallback in-memory profile so user is not locked out
      return {
        id: userId,
        full_name: fullName,
        role: isFirstUserOrAdmin ? 'admin' : 'operator',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return createdProfile as Profile;
  },
};
