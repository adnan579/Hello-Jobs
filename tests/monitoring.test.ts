import { afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { makeEnv } from './helpers/app.ts';
import { errorLine, framesOf, parseDsn, pingHeartbeat, reportError, resetReportLimits, scrub, sentryEnvelope } from '../server/lib/monitoring.ts';
import { nativeRoute } from '../server/next/native.ts';
import { onRequestError } from '../instrumentation.ts';

const DSN = 'https://abc123@o99.ingest.sentry.io/42';

describe('sentry address', () => {
  it('turns a DSN into the envelope endpoint', () => {
    expect(parseDsn(DSN)?.endpoint).toBe('https://o99.ingest.sentry.io/api/42/envelope/?sentry_key=abc123&sentry_version=7');
    expect(parseDsn('https://k@errors.example.com/relay/7')?.endpoint).toBe('https://errors.example.com/relay/api/7/envelope/?sentry_key=k&sentry_version=7');
  });
  it('rejects anything that is not a DSN', () => {
    for (const bad of [undefined, '', 'not a url', 'https://sentry.io/42', 'https://k@sentry.io/', 'https://k@sentry.io/abc', 'ftp://k@sentry.io/1']) expect(parseDsn(bad)).toBeUndefined();
  });
});

describe('what leaves the server', () => {
  it('removes connection strings, long numbers and tokens', () => {
    const text = scrub('connect failed postgres://user:pw@db.example.com/app for 9876543210 with Bearer abc.def-123');
    expect(text).not.toMatch(/user:pw|9876543210|abc\.def/);
    expect(text).toContain('[url]');
  });
  it('drops the query string and phone numbers from the path', () => {
    const line = JSON.parse(errorLine(new Error('x'), { method: 'GET', path: '/api/workers/9876543210/x?otp=123456', status: 500 }));
    expect(line.p).toBe('/api/workers/:n/x');
    expect(line).toMatchObject({ level: 'error', m: 'GET', s: 500, name: 'Error', msg: 'x' });
  });
  it('parses stack frames oldest first', () => {
    const frames = framesOf('Error: x\n    at inner (/app/a.js:10:5)\n    at /app/b.js:20:7\n    at async outer (file:///app/c.js:3:1)');
    expect(frames.map((f) => [f.filename, f.lineno])).toEqual([['/app/c.js', 3], ['/app/b.js', 20], ['/app/a.js', 10]]);
  });
  it('builds a three-line envelope with the exception and no request data beyond method and path', () => {
    const lines = sentryEnvelope({ environment: 'production', release: 'abc' }, new TypeError('bad thing'), { method: 'POST', path: '/api/jobs?x=1', status: 500 }, new Date('2026-11-08T00:00:00Z'), 'e'.repeat(32)).split('\n');
    expect(lines).toHaveLength(3);
    const event = JSON.parse(lines[2]!);
    expect(event).toMatchObject({ environment: 'production', release: 'abc', level: 'error', request: { method: 'POST', url: '/api/jobs' }, exception: { values: [{ type: 'TypeError', value: 'bad thing' }] } });
    expect(JSON.stringify(event)).not.toMatch(/cookie|authorization|headers/i);
  });
});

describe('reportError', () => {
  let logged: string[];
  beforeEach(() => {
    resetReportLimits();
    logged = [];
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void logged.push(a.join(' ')));
  });
  afterEach(() => vi.restoreAllMocks());

  it('always logs one JSON line, and sends to Sentry only when a DSN is set', async () => {
    const calls: string[] = [];
    const fetcher = (async (url: any) => {
      calls.push(String(url));
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    await reportError({ fetch: fetcher }, new Error('no dsn'), { path: '/api/x' });
    expect(calls).toEqual([]);
    expect(JSON.parse(logged[0]!).msg).toBe('no dsn');
    await reportError({ dsn: DSN, fetch: fetcher }, new Error('with dsn'), { path: '/api/x' });
    expect(calls).toEqual(['https://o99.ingest.sentry.io/api/42/envelope/?sentry_key=abc123&sentry_version=7']);
  });

  it('sends the same error once a minute and caps a flood', async () => {
    let n = 0;
    const fetcher = (async () => {
      n++;
      return new Response('{}');
    }) as typeof fetch;
    for (let i = 0; i < 5; i++) await reportError({ dsn: DSN, fetch: fetcher }, new Error('same'), { path: '/api/x' });
    expect(n).toBe(1);
    for (let i = 0; i < 40; i++) await reportError({ dsn: DSN, fetch: fetcher }, new Error(`different ${i}`), { path: '/api/x' });
    expect(n).toBe(20);
    expect(logged.filter((l) => l.includes('different')).length).toBe(40); // logs are never dropped
  });

  it('never throws when Sentry is down or slow', async () => {
    await expect(reportError({ dsn: DSN, fetch: (async () => { throw new Error('offline'); }) as typeof fetch }, new Error('a'))).resolves.toBeUndefined();
    const slow = ((_u: any, init: any) => new Promise((_r, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))))) as typeof fetch;
    const t0 = Date.now();
    await expect(reportError({ dsn: DSN, fetch: slow, timeoutMs: 50 }, new Error('b'))).resolves.toBeUndefined();
    expect(Date.now() - t0).toBeLessThan(1000);
    await expect(reportError({ dsn: DSN, fetch: (async () => new Response('no', { status: 429 })) as typeof fetch }, new Error('c'))).resolves.toBeUndefined();
  });

  it('reports a Next.js render error but ignores redirects and not-found', async () => {
    await onRequestError(Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;/x' }), { path: '/a', method: 'GET' }, {});
    expect(logged).toHaveLength(0);
    await onRequestError(new Error('render failed'), { path: '/jobs?x=1', method: 'GET' }, { routePath: '/jobs', routeType: 'render' });
    expect(JSON.parse(logged[0]!)).toMatchObject({ where: 'next', p: '/jobs', route: '/jobs', msg: 'render failed' });
  });
});

describe('heartbeat', () => {
  it('pings the URL, reports failure as false and does nothing without a URL', async () => {
    const urls: string[] = [];
    const ok = (async (u: any) => {
      urls.push(String(u));
      return new Response('OK');
    }) as typeof fetch;
    expect(await pingHeartbeat('https://hc-ping.com/abc', ok)).toBe(true);
    expect(urls).toEqual(['https://hc-ping.com/abc']);
    expect(await pingHeartbeat('https://hc-ping.com/abc', (async () => new Response('', { status: 500 })) as typeof fetch)).toBe(false);
    expect(await pingHeartbeat('https://hc-ping.com/abc', (async () => { throw new Error('x'); }) as typeof fetch)).toBe(false);
    expect(await pingHeartbeat(undefined, ok)).toBe(false);
    expect(urls).toHaveLength(1);
  });
});

describe('wired into the API', () => {
  const HEARTBEAT = 'https://hc-ping.com/test-uuid';
  const env = makeEnv({ SENTRY_DSN: DSN, CRON_SECRET: 'cron-secret-for-tests', CRON_HEARTBEAT_URL: HEARTBEAT, PUBLIC_CACHE_SEC: '0' });
  const sentry = () => env.fetchCalls.filter((c) => c.url.includes('/envelope/'));
  const beats = () => env.fetchCalls.filter((c) => c.url === HEARTBEAT);
  const realQuery = env.db.query.bind(env.db);
  let logged: string[];

  beforeEach(async () => {
    resetReportLimits();
    env.fetchCalls.length = 0;
    logged = [];
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void logged.push(a.join(' ')));
  });
  afterEach(() => {
    (env.db as any).query = realQuery;
    vi.restoreAllMocks();
  });
  afterAll(() => env.close());

  const breakQueries = (match: RegExp) => {
    (env.db as any).query = (sql: string, ...rest: unknown[]) => (match.test(String(sql)) ? Promise.reject(new Error('boom postgres://hj:secret@db.internal/app')) : (realQuery as any)(sql, ...rest));
  };

  it('reports a 500 from the Express API once, hides the details from the caller, and keeps secrets out of the report', async () => {
    breakQueries(/FROM jobs|COUNT|count/);
    const res = await request(env.app).get('/api/bootstrap?token=abc');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/boom|secret/);
    expect(sentry()).toHaveLength(1);
    const body = String(sentry()[0]!.init?.body);
    expect(body).toContain('boom');
    expect(body).not.toMatch(/hj:secret|token=abc|db\.internal/);
    expect(JSON.parse(logged[0]!)).toMatchObject({ level: 'error', m: 'GET', p: '/api/bootstrap', s: 500 });
  });

  it('does not report client mistakes (4xx)', async () => {
    const res = await request(env.app).post('/api/jobs').set('Origin', 'http://localhost').set('Host', 'localhost').send({});
    expect(res.status).toBeLessThan(500);
    expect(sentry()).toHaveLength(0);
  });

  it('reports a 500 from a native route handler', async () => {
    const route = nativeRoute(async () => { throw new Error('native boom'); }, { getContext: async () => env.ctx, skipAuth: true });
    const res = await route(new Request('http://localhost/api/x?y=1', { method: 'GET', headers: { host: 'localhost' } }));
    expect(res.status).toBe(500);
    expect(sentry()).toHaveLength(1);
    expect(String(sentry()[0]!.init?.body)).toContain('native boom');
  });

  it('pings the heartbeat after a successful cleanup, and not for a refused call', async () => {
    expect((await request(env.app).get('/api/cron/cleanup')).status).toBe(401);
    expect(beats()).toHaveLength(0);
    const ok = await request(env.app).get('/api/cron/cleanup').set('Authorization', 'Bearer cron-secret-for-tests');
    expect(ok.status).toBe(200);
    expect(ok.body.heartbeat).toBe(true);
    expect(beats()).toHaveLength(1);
  });

  it('alerts when the cleanup fails: an error report, a 500 for Vercel, and no heartbeat', async () => {
    breakQueries(/DELETE FROM otp_challenges/);
    const res = await request(env.app).get('/api/cron/cleanup').set('Authorization', 'Bearer cron-secret-for-tests');
    expect(res.status).toBe(500);
    expect(beats()).toHaveLength(0);
    expect(sentry()).toHaveLength(1);
    expect(JSON.parse(logged[0]!)).toMatchObject({ level: 'error', p: '/api/cron/cleanup' });
  });

  it('still cleans up when the heartbeat service is down', async () => {
    (env.ctx.deps as any).fetch = async () => { throw new Error('offline'); };
    const ok = await request(env.app).get('/api/cron/cleanup').set('Authorization', 'Bearer cron-secret-for-tests');
    expect(ok.status).toBe(200);
    expect(ok.body.heartbeat).toBe(false);
  });
});
