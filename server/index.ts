import express from 'express';
import { loadConfig } from './config.ts';
import { createDb, migrate, type Db } from './db.ts';
import { createApp } from './app.ts';
import { normalizeIndianPhone } from './lib/phone.ts';
import type { AppContext } from './types.ts';

/**
 * Builds the real app lazily: configuration errors and database problems become a clear
 * 503 for /api (and a log line) instead of crashing a serverless cold start.
 */
export function createServerApp(): express.Express {
  const outer = express();
  let inner: Promise<express.Express> | undefined;
  let db: Db | undefined;

  const init = async () => {
    const config = loadConfig();
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not set. Add your Postgres connection string to the environment variables.');
    db = createDb(config.databaseUrl);
    if (process.env.AUTO_MIGRATE !== 'false') {
      const applied = await migrate(db);
      if (applied.length) console.log(`[db] applied migrations: ${applied.join(', ')}`);
    }
    // Browser-only way to create the first admin(s): list their mobile numbers in ADMIN_BOOTSTRAP_PHONES.
    for (const raw of (process.env.ADMIN_BOOTSTRAP_PHONES ?? '').split(/[,;\s]+/).filter(Boolean)) {
      const phone = normalizeIndianPhone(raw);
      if (phone) {
        await db.query(
          `INSERT INTO accounts (phone, role, admin_role) VALUES ($1, 'admin', 'Trust & Safety') ON CONFLICT (phone, role) DO NOTHING`,
          [phone]
        );
      }
    }
    const ctx: AppContext = { db, config, deps: { fetch: globalThis.fetch, now: () => new Date() } };
    return createApp(ctx);
  };

  outer.use((req, res, next) => {
    inner ??= init();
    inner.then(
      (app) => app(req, res, next),
      (err) => {
        inner = undefined; // retry on the next request
        console.error('[startup] ', err?.message ?? err);
        if (req.path.startsWith('/api')) return res.status(503).json({ error: 'The service is starting up or misconfigured. Please try again shortly.' });
        next();
      }
    );
  });
  return outer;
}
