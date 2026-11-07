import express from 'express';
import { createApp } from './app.ts';
import { ensureBootstrapAdmin } from './services/adminAccounts.ts';
import { getServerContext } from './runtime.ts';

/**
 * Builds the real app lazily: configuration errors and database problems become a clear
 * 503 for /api (and a log line) instead of crashing a serverless cold start.
 */
export function createServerApp(): express.Express {
  const outer = express();
  let inner: Promise<express.Express> | undefined;
  let stage = 'config';
  let failure: { stage: string; code?: string; detail?: string } | undefined;

  const init = async () => {
    const ctx = await getServerContext();
    stage = 'admin-bootstrap';
    await ensureBootstrapAdmin(ctx.db, ctx.config);
    failure = undefined;
    return createApp(ctx);
  };

  // Which step failed (never secrets). Open /api/health to read it.
  const describe = (err: any) => ({
    stage: err?.startupStage ?? stage,
    code: typeof err?.code === 'string' ? err.code : undefined,
    // Only schema/migration problems carry a readable detail; connection errors may name the database user.
    detail: (err?.startupStage ?? stage) === 'migrations' || (err?.startupStage ?? stage) === 'config' ? String(err?.message ?? '').replace(/postgres(ql)?:\/\/\S+/gi, '[url]').slice(0, 240) : undefined,
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
