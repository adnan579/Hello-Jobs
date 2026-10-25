import express, { type ErrorRequestHandler, type Request } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import type { AppContext } from './types.ts';
import { HttpError } from './lib/errors.ts';
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
import { communityRouter } from './routes/community.ts';
import { dpdpRouter } from './routes/dpdp.ts';
import { cronRouter } from './routes/cron.ts';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function sameOrigin(req: Request, appUrl?: string): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients, same-origin GET navigations
  try {
    const o = new URL(origin);
    if (appUrl && o.origin === new URL(appUrl).origin) return true;
    return o.host === req.headers.host;
  } catch {
    return false;
  }
}

/** Small in-process limiter: a cheap first line of defence. Sensitive routes also use DB-backed throttles. */
function apiLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const cur = hits.get(key);
    if (!cur || cur.reset < now) hits.set(key, { n: 1, reset: now + windowMs });
    else if (++cur.n > limit) return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    next();
  };
}

export function createApp(ctx: AppContext): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // The dev server (Vite) needs inline scripts and websockets; production keeps the strict policy.
      contentSecurityPolicy: !ctx.config.isProd ? false : {
        useDefaults: false,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", 'https://checkout.razorpay.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:'],
          'connect-src': ["'self'", 'https://lumberjack.razorpay.com'],
          'frame-src': ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          ...(ctx.config.isProd ? { 'upgrade-insecure-requests': [] } : {}),
        },
      },
      strictTransportSecurity: ctx.config.isProd ? { maxAge: 31_536_000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
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

  app.use('/api', apiLimiter(600, 60_000));
  app.use('/api', (req, res, next) => {
    if (MUTATING.has(req.method) && !sameOrigin(req, ctx.config.appUrl)) {
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

  for (const r of [authRouter, bootstrapRouter, workersRouter, employersRouter, jobsRouter, applicationsRouter, offersRouter, creditsRouter, webhookRouter, adminRouter, communityRouter, dpdpRouter, cronRouter]) {
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
