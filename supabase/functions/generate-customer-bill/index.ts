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
    const { customer_id, period_start, period_end } = body;

    if (!customer_id) return errorResponse('Customer ID is required', 'INVALID_INPUT');
    if (!period_start || !period_end) return errorResponse('Period start and end dates are required', 'INVALID_INPUT');
    if (new Date(period_end) < new Date(period_start)) {
      return errorResponse('Period end date cannot precede start date', 'INVALID_INPUT');
    }

    const { data, error } = await supabaseClient.rpc('create_customer_weekly_bill', {
      p_customer_id: customer_id,
      p_period_start: period_start,
      p_period_end: period_end,
      p_created_by: user.userId,
    });

    if (error) {
      const msg = error.message || 'Failed to generate customer weekly bill';
      const code = msg.split(':')[0] || 'DATABASE_ERROR';
      return errorResponse(msg, code, 400);
    }

    return jsonResponse(data, 201);
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
