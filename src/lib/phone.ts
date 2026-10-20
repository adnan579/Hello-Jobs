/**
 * Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX).
 * Accepts "98765 43210", "+91 98765-43210", "09876543210", "919876543210".
 * Returns null when the input is not a valid 10-digit Indian mobile
 * (which must start with 6, 7, 8 or 9).
 */
export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
  else if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}

/** "+919876543210" -> "+91 98765 43210" */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}
