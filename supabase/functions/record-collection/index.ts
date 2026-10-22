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
    const { farmer_id, milk_type, quantity, quantity_unit, fat_percent } = body;

    // Server-side validation
    if (!farmer_id) return errorResponse('Farmer ID is required', 'INVALID_INPUT');
    if (!milk_type || !['cow', 'buffalo'].includes(milk_type)) {
      return errorResponse('Valid milk type (cow or buffalo) is required', 'INVALID_INPUT');
    }
    if (!quantity || Number(quantity) <= 0) {
      return errorResponse('Quantity must be greater than 0', 'INVALID_INPUT');
    }
    if (!quantity_unit || !['kg', 'litre'].includes(quantity_unit)) {
      return errorResponse('Valid quantity unit (kg or litre) is required', 'INVALID_INPUT');
    }
    if (fat_percent === undefined || Number(fat_percent) < 0) {
      return errorResponse('Fat percentage cannot be negative', 'INVALID_INPUT');
    }

    // Call PostgreSQL function for atomic determination and insert
    const { data, error } = await supabaseClient.rpc('record_milk_collection', {
      p_farmer_id: farmer_id,
      p_milk_type: milk_type,
      p_quantity: Number(quantity),
      p_quantity_unit: quantity_unit,
      p_fat_percent: Number(fat_percent),
      p_created_by: user.userId,
    });

    if (error) {
      const msg = error.message || 'Failed to record milk collection';
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
