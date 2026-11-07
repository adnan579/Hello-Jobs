import type { Queryable } from '../db.ts';
import { hit } from '../auth/throttle.ts';

/** Per-IP ceiling for the whole API. Sensitive routes (OTP, login) keep their own, much lower limits. */
export const API_LIMIT = { limit: 600, windowSec: 60 } as const;

export const apiLimitKey = (ip: string) => `api:${ip}`;

/**
 * True when this caller is over the limit. The counter lives in the database (the `throttles` table),
 * so every serverless instance sees the same count. If the database cannot be reached the request is
 * let through: the route will fail on its own with a clear error, and a limiter outage must not become an API outage.
 */
export async function overApiLimit(db: Queryable, ip: string): Promise<boolean> {
  try {
    return (await hit(db, apiLimitKey(ip), API_LIMIT.limit, API_LIMIT.windowSec)).blocked;
  } catch (error) {
    console.error('[api-limit] throttle check failed, allowing request', (error as Error).message);
    return false;
  }
}

export const TOO_MANY = { error: 'Too many requests. Please slow down.' };
