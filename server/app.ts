import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { AppContext } from './types.ts';
import { HttpError } from './lib/errors.ts';
import { apiHeaders, isSameOrigin, MUTATING_METHODS } from './lib/security-headers.ts';
import { overApiLimit, TOO_MANY } from './lib/api-limit.ts';
import { clientIp } from './lib/http.ts';
import { attachAuth } from './auth/session.ts';
import { authRouter } from './routes/auth.ts';
import { bootstrapRouter } from './routes/bootstrap.ts';
import { workersRouter } from './routes/workers.ts';
import { employersRouter } from './routes/employers.ts';
import { jobsRouter } from './routes/jobs.ts';
import { applicationsRouter } from './routes/applications.ts';
import { offersRouter } from './routes/offers.ts';
import { creditsRouter, webhookRouter } from './routes/credits.ts';
import { adminRouter } from './routes/admin.ts';
import { adminAuthRouter } from './routes/adminAuth.ts';
import { communityRouter } from './routes/community.ts';
import { dpdpRouter } from './routes/dpdp.ts';
import { cronRouter } from './routes/cron.ts';

export function createApp(ctx: AppContext): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // API responses never render, so they get the "load nothing" headers (pages get theirs from proxy.ts).
  const securityHeaders = apiHeaders(ctx.config.isProd);
  app.use((_req, res, next) => {
    for (const [name, value] of Object.entries(securityHeaders)) res.setHeader(name, value);
    next();
  });

  app.use(
    express.json({
      limit: '200kb',
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    })
  );

  // One log line per API call in production: no bodies, no phone numbers, no cookies.
  if (ctx.config.isProd) {
    app.use('/api', (req, res, next) => {
      const t0 = Date.now();
      res.on('finish', () => {
        if (req.path === '/health') return;
        console.log(JSON.stringify({ t: new Date().toISOString(), m: req.method, p: req.path, s: res.statusCode, ms: Date.now() - t0 }));
      });
      next();
    });
  }

  app.use('/api', (req, res, next) => {
    overApiLimit(ctx.db, clientIp(req)).then((blocked) => (blocked ? res.status(429).json(TOO_MANY) : next()), next);
  });
  app.use('/api', (req, res, next) => {
    if (MUTATING_METHODS.has(req.method) && !isSameOrigin(req.headers.origin, req.headers.host, ctx.config.appUrl)) {
      return res.status(403).json({ error: 'Cross-site request blocked.' });
    }
    next();
  });
  app.use('/api', attachAuth(ctx));

  app.get('/api/health', async (req, res) => {
    try {
      await ctx.db.query('SELECT 1');
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  for (const r of [authRouter, bootstrapRouter, workersRouter, employersRouter, jobsRouter, applicationsRouter, offersRouter, creditsRouter, webhookRouter, adminAuthRouter, adminRouter, communityRouter, dpdpRouter, cronRouter]) {
    app.use('/api', r);
  }

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  const onError: ErrorRequestHandler = (err, req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.extra ?? {}) });
    if (err instanceof ZodError) return res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid request.' });
    if ((err as any)?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Malformed JSON.' });
    console.error(`[api] ${req.method} ${req.path}`, err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  };
  app.use(onError);

  return app;
}
