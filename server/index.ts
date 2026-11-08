import express from 'express';
import { createApp } from './app.ts';
import { ensureBootstrapAdmin } from './services/adminAccounts.ts';
import { describeStartupFailure, getServerContext } from './runtime.ts';
import { reportError, reporterFromEnv } from './lib/monitoring.ts';

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

  const explain = (err: any) => describeStartupFailure(err, stage);

  outer.get('/api/health', (req, res, next) => {
    inner ??= init().catch((e) => { failure = explain(e); throw e; });
    inner.then((app) => app(req, res, next), () => { inner = undefined; res.status(503).json({ ok: false, ...failure }); });
  });

  outer.use((req, res, next) => {
    inner ??= init().catch((e) => { failure = explain(e); throw e; });
    inner.then(
      (app) => app(req, res, next),
      async (err) => {
        inner = undefined; // retry on the next request
        await reportError(reporterFromEnv(), err, { where: 'startup', method: req.method, path: req.path, status: 503, tags: { stage: String(failure?.stage ?? 'unknown') } });
        if (req.path.startsWith('/api')) return res.status(503).json({ error: 'The service is starting up or misconfigured. Please try again shortly.', stage: failure?.stage });
        next();
      }
    );
  });
  return outer;
}
