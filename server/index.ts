import express from 'express';
import { loadConfig } from './config.ts';
import { formatFindings, reviewConfig } from './lib/doctor.ts';
import { createDb, migrate, type Db } from './db.ts';
import { createApp } from './app.ts';
import { ensureBootstrapAdmin } from './services/adminAccounts.ts';
import type { AppContext } from './types.ts';

/**
 * Builds the real app lazily: configuration errors and database problems become a clear
 * 503 for /api (and a log line) instead of crashing a serverless cold start.
 */
export function createServerApp(): express.Express {
  const outer = express();
  let inner: Promise<express.Express> | undefined;
  let db: Db | undefined;
  let stage = 'config';
  let failure: { stage: string; code?: string; detail?: string } | undefined;

  const init = async () => {
    stage = 'config';
    const config = loadConfig();
    if (config.isProd) {
      const notes = reviewConfig(config).filter((x) => x.level !== 'ok');
      if (notes.length) console.warn('[config]\n' + formatFindings(notes));
    }
    stage = 'config';
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not set. Add your Postgres connection string to the environment variables.');
    stage = 'database';
    db = createDb(config.databaseUrl);
    await db.query('SELECT 1');
    stage = 'migrations';
    if (process.env.AUTO_MIGRATE !== 'false') {
      const applied = await migrate(db);
      if (applied.length) console.log(`[db] applied migrations: ${applied.join(', ')}`);
    }
    stage = 'admin-bootstrap';
    await ensureBootstrapAdmin(db, config);
    failure = undefined;
    const ctx: AppContext = { db, config, deps: { fetch: globalThis.fetch, now: () => new Date() } };
    return createApp(ctx);
  };

  // Which step failed (never secrets). Open /api/health to read it.
  const describe = (err: any) => ({
    stage,
    code: typeof err?.code === 'string' ? err.code : undefined,
    // Only schema/migration problems carry a readable detail; connection errors may name the database user.
    detail: stage === 'migrations' || stage === 'config' ? String(err?.message ?? '').replace(/postgres(ql)?:\/\/\S+/gi, '[url]').slice(0, 240) : undefined,
  });

  outer.get('/api/health', (req, res, next) => {
    inner ??= init().catch((e) => { failure = describe(e); throw e; });
    inner.then((app) => app(req, res, next), () => { inner = undefined; res.status(503).json({ ok: false, ...failure }); });
  });

  outer.use((req, res, next) => {
    inner ??= init().catch((e) => { failure = describe(e); throw e; });
    inner.then(
      (app) => app(req, res, next),
      (err) => {
        inner = undefined; // retry on the next request
        console.error('[startup] ', err?.message ?? err);
        if (req.path.startsWith('/api')) return res.status(503).json({ error: 'The service is starting up or misconfigured. Please try again shortly.', stage: failure?.stage });
        next();
      }
    );
  });
  return outer;
}
