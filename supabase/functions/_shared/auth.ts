import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export interface UserContext {
  userId: string;
  role: 'admin' | 'operator';
  fullName: string;
  isActive: boolean;
}

export async function authenticateUser(req: Request): Promise<{
  supabaseClient: ReturnType<typeof createClient>;
  user: UserContext;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('UNAUTHORIZED: Missing Authorization header.');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const token = authHeader.replace('Bearer ', '').trim();
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    throw new Error('UNAUTHORIZED: Invalid authentication session.');
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('FORBIDDEN: User profile not found.');
  }

  if (!profile.is_active) {
    throw new Error('FORBIDDEN: User account is inactive.');
  }

  return {
    supabaseClient,
    user: {
      userId: profile.id,
      role: profile.role,
      fullName: profile.full_name,
      isActive: profile.is_active,
    },
  };
}
