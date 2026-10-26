import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// bigint (count(*), bigserial) -> number. Safe for our volumes.
pg.types.setTypeParser(20, (v) => Number(v));

export type Queryable = {
  query: <T extends pg.QueryResultRow = any>(text: string, params?: unknown[]) => Promise<pg.QueryResult<T>>;
};

export interface Db extends Queryable {
  tx: <T>(fn: (q: Queryable) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
  pool: pg.Pool;
}

export function createDb(databaseUrl: string): Db {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on('error', (err) => console.error('[db] idle client error', err.message));

  return {
    pool,
    query: (text, params) => pool.query(text, params as any[]),
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({ query: (t, p) => client.query(t, p as any[]) });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          /* connection already gone */
        }
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

/** Applies server/migrations/*.sql in order, once each. Safe to run concurrently. */
export async function migrate(db: Db, dir?: string): Promise<string[]> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = dir ?? path.join(here, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];

  const client = await db.pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(727001)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'
    );
    const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(727001)');
    } finally {
      client.release();
    }
  }
  return applied;
}
