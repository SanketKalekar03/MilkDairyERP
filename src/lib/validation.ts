/**
 * Common validation utilities for Gokul Dairy ERP
 */

export function validateIndianMobileNumber(phone?: string | null): {
  isValid: boolean;
  cleaned: string;
  error?: string;
} {
  if (!phone || phone.trim() === '') {
    return { isValid: true, cleaned: '' };
  }

  // Extract only numeric digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) {
    return { isValid: true, cleaned: '' };
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      cleaned: digits,
      error: `Mobile number must be exactly 10 digits (currently ${digits.length}).`,
    };
  }

  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      cleaned: digits,
      error: 'Mobile number must start with 6, 7, 8, or 9.',
    };
  }

  return { isValid: true, cleaned: digits };
}
