import type { Queryable } from '../db.ts';

export interface HitResult {
  count: number;
  blocked: boolean;
  lockedUntil?: Date;
}

/** Fixed-window counter. Atomic, so it is safe across serverless instances. */
export async function hit(q: Queryable, key: string, limit: number, windowSec: number): Promise<HitResult> {
  const { rows } = await q.query<{ count: number; locked_until: Date | null }>(
    `INSERT INTO throttles (key, count, window_start) VALUES ($1, 1, now())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN throttles.window_start < now() - make_interval(secs => $2) THEN 1 ELSE throttles.count + 1 END,
       window_start = CASE WHEN throttles.window_start < now() - make_interval(secs => $2) THEN now() ELSE throttles.window_start END
     RETURNING count, locked_until`,
    [key, windowSec]
  );
  const { count, locked_until } = rows[0];
  const locked = locked_until && locked_until.getTime() > Date.now();
  return { count, blocked: count > limit || Boolean(locked), lockedUntil: locked ? locked_until! : undefined };
}

export async function lock(q: Queryable, key: string, seconds: number): Promise<void> {
  await q.query(
    `INSERT INTO throttles (key, count, window_start, locked_until)
     VALUES ($1, 0, now(), now() + make_interval(secs => $2))
     ON CONFLICT (key) DO UPDATE SET locked_until = now() + make_interval(secs => $2)`,
    [key, seconds]
  );
}

export async function lockedUntil(q: Queryable, key: string): Promise<Date | null> {
  const { rows } = await q.query<{ locked_until: Date | null }>(
    'SELECT locked_until FROM throttles WHERE key = $1 AND locked_until > now()',
    [key]
  );
  return rows[0]?.locked_until ?? null;
}

export async function clear(q: Queryable, key: string): Promise<void> {
  await q.query('DELETE FROM throttles WHERE key = $1', [key]);
}
