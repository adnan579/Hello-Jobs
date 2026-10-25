const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SHAPE = /^(0[1-9]|[1-2]\d|3[0-8])[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Format + checksum validation. This does NOT prove the GSTIN is active; that needs the GST portal. */
export function isValidGstin(raw: string): boolean {
  const g = raw.trim().toUpperCase();
  if (!SHAPE.test(g)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = CHARS.indexOf(g[i]);
    const p = v * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  const check = CHARS[(36 - (sum % 36)) % 36];
  return check === g[14];
}
