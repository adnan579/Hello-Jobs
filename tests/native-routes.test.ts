import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { makeEnv, registerEmployer, registerWorker, loginAdmin, type TestEnv } from './helpers/app.ts';
import { JOB } from './helpers/scenario.ts';
import { API_SECURITY_HEADERS } from '../server/lib/security-headers.ts';
import { apiLimitKey } from '../server/lib/api-limit.ts';
import { GET as bootstrapGET } from '../app/api/bootstrap/route.ts';
import { POST as jobsPOST } from '../app/api/jobs/route.ts';
import { PUT as jobPUT } from '../app/api/jobs/[id]/route.ts';
import { GET as healthGET } from '../app/api/health/route.ts';

/**
 * Parity tests for routes that have moved from Express to native Next.js route handlers (Phase 5).
 * Every case sends the same request to both implementations and expects the same status, error text,
 * response shape and security headers. Add a block here each time another route is ported.
 */

let env: TestEnv;
const ORIGIN = 'http://localhost';

beforeAll(() => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.SESSION_SECRET = 'x'.repeat(40);
  env = makeEnv();
});
beforeEach(() => env.reset());
afterAll(() => env.close());

/** Structure of a JSON value with the values removed, so two responses can be compared field by field. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.length ? [shape(value[0])] : [];
  if (value === null) return 'null';
  if (typeof value === 'object') return Object.fromEntries(Object.keys(value as object).sort().map((k) => [k, shape((value as Record<string, unknown>)[k])]));
  return typeof value;
}

const cookieOf = (res: { headers: Record<string, unknown> }) => String(((res.headers['set-cookie'] as string[]) ?? [])[0]).split(';')[0]!;

async function verifiedEmployerCookie(): Promise<string> {
  const a = env.agent();
  const { res } = await registerEmployer(a);
  const cookie = cookieOf(res);
  const admin = env.agent();
  await loginAdmin(env, admin, 'Trust & Safety');
  const rec = (await env.db.query(`SELECT id FROM verification_records WHERE kind = 'FACTORY_GSTIN_KYB' ORDER BY created_at DESC LIMIT 1`)).rows[0];
  await admin.post('/api/admin/verify').send({ recordId: rec.id, status: 'VERIFIED' });
  return cookie;
}

interface Call { method: string; path: string; cookie?: string; body?: unknown; rawBody?: string; origin?: string | null }

async function viaExpress(c: Call) {
  const req = env.agent()[c.method.toLowerCase() as 'get' | 'post' | 'put'](c.path);
  if (c.cookie) req.set('Cookie', c.cookie);
  if (c.origin !== null) req.set('Origin', c.origin ?? ORIGIN);
  req.set('Host', 'localhost');
  if (c.rawBody !== undefined) req.set('Content-Type', 'application/json').send(c.rawBody);
  else if (c.body !== undefined) req.send(c.body as object);
  const res = await req;
  return { status: res.status, body: res.body as any, headers: res.headers as Record<string, string> };
}

type NativeHandler = (request: Request, route?: { params?: Promise<Record<string, string>> }) => Promise<Response>;
async function viaNative(handler: NativeHandler, c: Call, params: Record<string, string> = {}) {
  const headers = new Headers({ host: 'localhost' });
  if (c.cookie) headers.set('cookie', c.cookie);
  if (c.origin !== null) headers.set('origin', c.origin ?? ORIGIN);
  let body: string | undefined;
  if (c.rawBody !== undefined) body = c.rawBody;
  else if (c.body !== undefined) body = JSON.stringify(c.body);
  if (body !== undefined) headers.set('content-type', 'application/json');
  const res = await handler(new Request(`${ORIGIN}${c.path}`, { method: c.method, headers, body }), { params: Promise.resolve(params) });
  return { status: res.status, body: await res.json().catch(() => undefined), headers: Object.fromEntries(res.headers) as Record<string, string> };
}

async function both(handler: NativeHandler, c: Call, params?: Record<string, string>) {
  const [express, native] = [await viaExpress(c), await viaNative(handler, c, params)];
  expect(native.status, JSON.stringify({ express: express.body, native: native.body })).toBe(express.status);
  return { express, native };
}

function expectSameError(r: { express: { body: any }; native: { body: any } }) {
  expect(r.native.body).toEqual(r.express.body);
}

describe('GET /api/health', () => {
  it('answers like Express', async () => {
    const native = await healthGET();
    expect(native.status).toBe(200);
    expect(await native.json()).toEqual({ ok: true });
    expect((await viaExpress({ method: 'GET', path: '/api/health' })).body).toEqual({ ok: true });
  });
});

describe('GET /api/bootstrap', () => {
  it('matches for a visitor', async () => {
    const r = await both(bootstrapGET, { method: 'GET', path: '/api/bootstrap' });
    expect(shape(r.native.body)).toEqual(shape(r.express.body));
    expect(r.native.headers['cache-control']).toBe(r.express.headers['cache-control']);
    expect(r.native.headers['cache-control']).toBe('no-store');
  });

  it('matches for a signed-in factory and a worker', async () => {
    const cookie = await verifiedEmployerCookie();
    const emp = await both(bootstrapGET, { method: 'GET', path: '/api/bootstrap', cookie });
    expect(emp.native.body).toEqual(emp.express.body);
    expect(emp.native.body.session?.role).toBe('employer');

    const { res } = await registerWorker(env.agent());
    const wk = await both(bootstrapGET, { method: 'GET', path: '/api/bootstrap', cookie: cookieOf(res) });
    expect(wk.native.body).toEqual(wk.express.body);
    expect(wk.native.body.session?.role).toBe('worker');
  });

  it('ignores a forged or expired session cookie like Express', async () => {
    const r = await both(bootstrapGET, { method: 'GET', path: '/api/bootstrap', cookie: 'hj_session=not-a-real-token-not-a-real-token' });
    expect(r.native.body.session).toBeFalsy();
    expect(shape(r.native.body)).toEqual(shape(r.express.body));
  });
});

describe('POST /api/jobs', () => {
  const post = (extra: Partial<Call> = {}): Call => ({ method: 'POST', path: '/api/jobs', body: JOB, ...extra });

  it('requires a session, an employer role and a valid body', async () => {
    expectSameError(await both(jobsPOST, post()));
    const wk = await registerWorker(env.agent());
    const forbidden = await both(jobsPOST, post({ cookie: cookieOf(wk.res) }));
    expect(forbidden.native.status).toBe(403);
    expectSameError(forbidden);

    const cookie = await verifiedEmployerCookie();
    const invalid = await both(jobsPOST, post({ cookie, body: { ...JOB, title: '' } }));
    expect(invalid.native.status).toBe(400);
    expectSameError(invalid);
  });

  it('creates a job with the same response shape and security headers', async () => {
    const cookie = await verifiedEmployerCookie();
    const r = await both(jobsPOST, post({ cookie }));
    expect(r.native.status).toBe(201);
    expect(shape(r.native.body)).toEqual(shape(r.express.body));
    expect(r.native.body.job.title).toBe(JOB.title);
    for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) {
      expect(r.native.headers[name.toLowerCase()], name).toBe(value);
      expect(r.express.headers[name.toLowerCase()], name).toBe(value);
    }
  });

  it('blocks cross-site writes and bad bodies before anything else', async () => {
    const cookie = await verifiedEmployerCookie();
    const cross = await both(jobsPOST, post({ cookie, origin: 'https://evil.example' }));
    expect(cross.native.status).toBe(403);
    expectSameError(cross);

    const malformed = await both(jobsPOST, { method: 'POST', path: '/api/jobs', cookie, rawBody: '{"title": ' });
    expect(malformed.native.status).toBe(400);
    expectSameError(malformed);

    const tooBig = await both(jobsPOST, { method: 'POST', path: '/api/jobs', cookie, rawBody: `{"x":"${'x'.repeat(201 * 1024)}"}` });
    expect(tooBig.native.status).toBe(413);
    expectSameError(tooBig);
  });
});

describe('PUT /api/jobs/:id', () => {
  it('updates an own job and rejects unknown ones the same way', async () => {
    const cookie = await verifiedEmployerCookie();
    const created = await viaExpress({ method: 'POST', path: '/api/jobs', cookie, body: JOB });
    const id = created.body.job.id as string;
    const put = (jobId: string, body: unknown = { ...JOB, title: 'Fitter - Night Shift' }): Call => ({ method: 'PUT', path: `/api/jobs/${jobId}`, cookie, body });

    const ok = await both(jobPUT, put(id), { id });
    expect(ok.native.status).toBe(200);
    expect(shape(ok.native.body)).toEqual(shape(ok.express.body));
    expect(ok.native.body.job.title).toBe('Fitter - Night Shift');

    const missing = await both(jobPUT, put('job-does-not-exist'), { id: 'job-does-not-exist' });
    expect(missing.native.status).toBe(404);
    expectSameError(missing);

    const anon = await both(jobPUT, { method: 'PUT', path: `/api/jobs/${id}`, body: JOB }, { id });
    expect(anon.native.status).toBe(401);
    expectSameError(anon);

    const other = await verifiedEmployerCookie();
    const foreign = await both(jobPUT, { method: 'PUT', path: `/api/jobs/${id}`, cookie: other, body: JOB }, { id });
    expect(foreign.native.status).toBe(404);
  });
});

describe('API rate limit', () => {
  const write: Call = { method: 'POST', path: '/api/jobs', body: JOB };

  it('answers 429 to a write once the caller is over the limit, from both implementations', async () => {
    await env.db.query(`INSERT INTO throttles (key, count, window_start) VALUES ($1, 600, now())`, [apiLimitKey('127.0.0.1')]);
    const r = await both(jobsPOST, write);
    expect(r.native.status).toBe(429);
    expectSameError(r);
  });

  it('counts writes in the database, shared between callers', async () => {
    await viaExpress(write);
    await viaNative(jobsPOST, write);
    const { rows } = await env.db.query(`SELECT count FROM throttles WHERE key = $1`, [apiLimitKey('127.0.0.1')]);
    expect(rows[0].count).toBe(2);
  });

  it('counts reads in memory and never writes to the database for them', async () => {
    await viaExpress({ method: 'GET', path: '/api/bootstrap' });
    await viaNative(bootstrapGET, { method: 'GET', path: '/api/bootstrap' });
    const { rows } = await env.db.query(`SELECT count FROM throttles WHERE key = $1`, [apiLimitKey('127.0.0.1')]);
    expect(rows).toHaveLength(0);
  });
});
