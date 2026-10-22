import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return errorResponse('Method not allowed', 'INVALID_METHOD', 405);
  }

  try {
    const { supabaseClient } = await authenticateUser(req);

    let targetDate: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        targetDate = body.target_date || null;
      } catch {
        // empty body ok
      }
    } else {
      const url = new URL(req.url);
      targetDate = url.searchParams.get('date');
    }

    const { data, error } = await supabaseClient.rpc('get_current_day_dashboard', {
      p_target_date: targetDate,
    });

    if (error) {
      const msg = error.message || 'Failed to fetch dashboard metrics';
      const code = msg.split(':')[0] || 'DATABASE_ERROR';
      return errorResponse(msg, code, 400);
    }

    return jsonResponse(data, 200);
  } catch (err: any) {
    const message = err.message || 'Internal server error';
    const code = message.startsWith('UNAUTHORIZED')
      ? 'UNAUTHORIZED'
      : message.startsWith('FORBIDDEN')
      ? 'FORBIDDEN'
      : 'INTERNAL_ERROR';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500;
    return errorResponse(message, code, status);
  }
});
