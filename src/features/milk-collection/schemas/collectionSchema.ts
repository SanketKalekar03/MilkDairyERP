import { z } from 'zod';

export const milkCollectionSchema = z.object({
  farmer_id: z.string().min(1, 'Please select a farmer'),
  milk_type: z.enum(['cow', 'buffalo'], {
    required_error: 'Milk type is required',
  }),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a valid number' })
    .positive('Quantity must be greater than 0')
    .max(9999.999, 'Quantity exceeds maximum allowed'),
  quantity_unit: z.enum(['litre']).default('litre'),
  fat_percent: z
    .number({ invalid_type_error: 'Fat percentage must be a number' })
    .min(0, 'Fat percentage cannot be negative')
    .max(20, 'Fat percentage cannot exceed 20%'),
});

export type MilkCollectionFormData = z.infer<typeof milkCollectionSchema>;
