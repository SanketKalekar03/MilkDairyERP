import { z } from 'zod';

export const milkSalesSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  milk_type: z.enum(['cow', 'buffalo'], {
    required_error: 'Milk type is required',
  }),
  quantity_litres: z
    .number({ invalid_type_error: 'Quantity in litres must be a valid number' })
    .positive('Quantity must be greater than 0')
    .max(9999.999, 'Quantity exceeds maximum allowed'),
});

export type MilkSalesFormData = z.infer<typeof milkSalesSchema>;
