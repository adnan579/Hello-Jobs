/** Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX), or null if invalid. */
export function normalizeIndianPhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let local = input.replace(/\D/g, '');
  if (local.length === 12 && local.startsWith('91')) local = local.slice(2);
  else if (local.length === 11 && local.startsWith('0')) local = local.slice(1);
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}

/** "+919876543210" -> "+91 98765 43210" (the format the UI shows) */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** "+919876543210" -> "+91 ••••• ••210" */
export function maskPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ••••• ••${m[2].slice(2)}` : '••••••••••';
}
