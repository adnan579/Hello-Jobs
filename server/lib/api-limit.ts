import type { Queryable } from '../db.ts';
import { hit } from '../auth/throttle.ts';

/**
 * Per-IP ceiling for the API, 600 calls a minute, counted in two places:
 *  - Writes (POST/PUT/PATCH/DELETE, which includes every login and OTP route) are counted in the database
 *    (the `throttles` table), so all serverless instances share one count. That costs one small write.
 *  - Reads (GET/HEAD) are counted in memory, per instance, at no database cost. Pages and the public job
 *    list are reads; they are also served from a short cache, so they are cheap for the server anyway.
 * Sensitive routes (OTP, login, password) keep their own much lower limits on top of this.
 */
export const API_LIMIT = { limit: 600, windowSec: 60 } as const;

export const apiLimitKey = (ip: string) => `api:${ip}`;

export const isRead = (method: string) => method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

const memory = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACKED = 20_000;

/** Count one read in memory; true when this caller is over the limit. `now` is injectable for tests. */
export function overReadLimit(ip: string, now = Date.now()): boolean {
  if (memory.size > MAX_TRACKED) {
    for (const [key, v] of memory) if (v.resetAt <= now) memory.delete(key);
    if (memory.size > MAX_TRACKED) memory.clear(); // under attack from many addresses: forget rather than grow
  }
  const entry = memory.get(ip);
  if (!entry || entry.resetAt <= now) {
    memory.set(ip, { count: 1, resetAt: now + API_LIMIT.windowSec * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > API_LIMIT.limit;
}

export function resetReadLimit() {
  memory.clear();
}

/**
 * True when this request is over the limit. If the database cannot be reached the write is let through:
 * the route will fail on its own with a clear error, and a limiter outage must not become an API outage.
 */
export async function overApiLimit(db: Queryable, ip: string, method: string): Promise<boolean> {
  if (isRead(method)) return overReadLimit(ip);
  try {
    return (await hit(db, apiLimitKey(ip), API_LIMIT.limit, API_LIMIT.windowSec)).blocked;
  } catch (error) {
    console.error('[api-limit] throttle check failed, allowing request', (error as Error).message);
    return false;
  }
}

export const TOO_MANY = { error: 'Too many requests. Please slow down.' };
