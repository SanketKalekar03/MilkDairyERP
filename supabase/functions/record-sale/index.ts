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
    const { customer_id, milk_type, quantity_litres } = body;

    // Server-side validation
    if (!customer_id) return errorResponse('Customer ID is required', 'INVALID_INPUT');
    if (!milk_type || !['cow', 'buffalo'].includes(milk_type)) {
      return errorResponse('Valid milk type (cow or buffalo) is required', 'INVALID_INPUT');
    }
    if (!quantity_litres || Number(quantity_litres) <= 0) {
      return errorResponse('Quantity in litres must be greater than 0', 'INVALID_INPUT');
    }

    // Call PostgreSQL function for atomic determination and insert
    const { data, error } = await supabaseClient.rpc('record_milk_sale', {
      p_customer_id: customer_id,
      p_milk_type: milk_type,
      p_quantity_litres: Number(quantity_litres),
      p_created_by: user.userId,
    });

    if (error) {
      const msg = error.message || 'Failed to record milk sale';
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
