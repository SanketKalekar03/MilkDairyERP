export const APP_NAME = 'Dairy Milk Collection & Sales';

export const COLORS = {
  navy: '#2F4156',
  teal: '#567C8D',
  sky: '#C8D9E6',
  beige: '#F5EFEB',
  white: '#FFFFFF',
} as const;

export const MILK_TYPES = [
  { value: 'cow', label: 'Cow Milk' },
  { value: 'buffalo', label: 'Buffalo Milk' },
] as const;

export const QUANTITY_UNITS = [
  { value: 'litre', label: 'Litre (L)' },
  { value: 'kg', label: 'Kilogram (kg)' },
] as const;

export const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
] as const;
