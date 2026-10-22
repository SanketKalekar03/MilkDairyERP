import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'INVALID_METHOD', 405);
  }

  try {
    const { supabaseClient, user } = await authenticateUser(req);

    const body = await req.json();
    const { bill_id } = body;

    if (!bill_id) return errorResponse('Bill ID is required', 'INVALID_INPUT');

    const { data, error } = await supabaseClient.rpc('finalize_farmer_weekly_bill', {
      p_bill_id: bill_id,
      p_finalized_by: user.userId,
    });

    if (error) {
      const msg = error.message || 'Failed to finalize farmer weekly bill';
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
