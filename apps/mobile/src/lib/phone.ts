/**
 * Convert an Israeli local phone number to E.164 format for Supabase Auth.
 * e.g. "054-1234567" → "+972541234567"
 *      "0541234567"  → "+972541234567"
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  return `+972${digits}`;
}

/** Basic Israeli phone validation */
export function isValidIsraeliPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^0(5[0-9]|7[2-9])\d{7}$/.test(digits);
}
