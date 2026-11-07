/**
 * Headers for API (JSON) responses. They replace the `helmet` middleware: an API response never
 * renders, so the policy is "load nothing". Page headers (the nonce-based CSP) live in proxy.ts.
 * next.config.ts repeats this list for /api/*, and tests/security-headers.test.ts keeps both in step.
 */
export const API_SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

export const HSTS = 'max-age=31536000; includeSubDomains';

export function apiHeaders(isProd: boolean): Record<string, string> {
  return isProd ? { ...API_SECURITY_HEADERS, 'Strict-Transport-Security': HSTS } : { ...API_SECURITY_HEADERS };
}

/** The Origin check for browser writes: same site as APP_URL or as the Host the request came to. */
export function isSameOrigin(origin: string | null | undefined, host: string | null | undefined, appUrl?: string): boolean {
  if (!origin) return true; // non-browser clients and same-origin navigations send no Origin
  try {
    const o = new URL(origin);
    if (appUrl && o.origin === new URL(appUrl).origin) return true;
    return o.host === host;
  } catch {
    return false;
  }
}

export const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
