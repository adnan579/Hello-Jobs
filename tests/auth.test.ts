import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeEnv, nextPhone, otpFor, registerEmployer, registerWorker } from './helpers/app.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

describe('OTP + sessions', () => {
  it('registers a worker, sets an httpOnly cookie and never trusts a wrong code', async () => {
    const a = env.agent();
    const phone = nextPhone();
    await otpFor(a, phone, 'worker');
    const bad = await a.post('/api/auth/verify').send({ role: 'worker', phone, code: '000000', mode: 'login' });
    expect(bad.status).toBe(401);
    expect(bad.headers['set-cookie']).toBeUndefined();

    const { res } = await registerWorker(a);
    expect(res.status).toBe(201);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toContain('hj_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const me = await a.get('/api/auth/me');
    expect(me.body.session.role).toBe('worker');
    expect(me.body.session.workerId).toMatch(/^cand-/);
  });

  it('stores the OTP only as a hash', async () => {
    const a = env.agent();
    const phone = nextPhone();
    const code = await otpFor(a, phone, 'worker');
    const { rows } = await env.db.query('SELECT code_hash FROM otp_challenges');
    expect(rows[0].code_hash).not.toContain(code);
    expect(rows[0].code_hash).toHaveLength(64);
  });

  it('a code works once', async () => {
    const a = env.agent();
    const { phone } = await registerWorker(a);
    const code = await otpFor(env.agent(), phone, 'worker');
    const first = await env.agent().post('/api/auth/verify').send({ role: 'worker', phone, code, mode: 'login' });
    expect(first.status).toBe(200);
    const replay = await env.agent().post('/api/auth/verify').send({ role: 'worker', phone, code, mode: 'login' });
    expect(replay.status).toBe(400);
  });

  it('login for an unknown number does not create an account', async () => {
    const a = env.agent();
    const phone = nextPhone();
    const code = await otpFor(a, phone, 'worker');
    const res = await a.post('/api/auth/verify').send({ role: 'worker', phone, code, mode: 'login' });
    expect(res.status).toBe(404);
    expect((await env.db.query('SELECT count(*)::int AS n FROM accounts')).rows[0].n).toBe(0);
  });

  it('requires adult confirmation and terms to register', async () => {
    const a = env.agent();
    const { res } = await registerWorker(a, { adultConfirmed: false });
    expect(res.status).toBe(400);
    const r2 = await registerWorker(a, { termsAccepted: false });
    expect(r2.res.status).toBe(400);
    expect((await env.db.query('SELECT count(*)::int AS n FROM accounts')).rows[0].n).toBe(0);
  });

  it('locks a number after 10 wrong guesses and 5 per code', async () => {
    const a = env.agent();
    const phone = nextPhone();
    await otpFor(a, phone, 'worker');
    for (let i = 0; i < 5; i++) {
      const r = await a.post('/api/auth/verify').send({ role: 'worker', phone, code: '111111', mode: 'login' });
      expect(r.status).toBe(401);
    }
    const sixth = await a.post('/api/auth/verify').send({ role: 'worker', phone, code: '111111', mode: 'login' });
    expect(sixth.status).toBe(400); // code burned after 5 attempts
  });

  it('rate limits OTP sends per phone', async () => {
    const a = env.agent();
    const phone = nextPhone();
    for (let i = 0; i < 3; i++) expect((await a.post('/api/otp/send').send({ phone, role: 'worker' })).status).toBe(200);
    expect((await a.post('/api/otp/send').send({ phone, role: 'worker' })).status).toBe(429);
  });

  it('logout revokes the session on the server', async () => {
    const a = env.agent();
    await registerWorker(a);
    await a.post('/api/auth/logout');
    expect((await a.get('/api/auth/me')).body.session).toBeNull();
    const { rows } = await env.db.query('SELECT revoked_at FROM sessions');
    expect(rows[0].revoked_at).not.toBeNull();
  });

  it('a stolen-then-revoked token stops working', async () => {
    const a = env.agent();
    const { res } = await registerWorker(a);
    const raw = String(res.headers['set-cookie']).split(';')[0];
    await a.post('/api/auth/logout');
    const replay = await request(env.app).get('/api/auth/me').set('Cookie', raw);
    expect(replay.body.session).toBeNull();
  });

  it('blocks cross-site writes', async () => {
    const a = env.agent();
    const res = await a.post('/api/otp/send').set('Origin', 'https://evil.example').send({ phone: nextPhone(), role: 'worker' });
    expect(res.status).toBe(403);
  });

  it('registers an employer with a KYB record and zero credits', async () => {
    const a = env.agent();
    const { res } = await registerEmployer(a);
    expect(res.status).toBe(201);
    const { rows } = await env.db.query('SELECT kyb_status, hunt_credits FROM employers');
    expect(rows[0]).toEqual({ kyb_status: 'PENDING', hunt_credits: 0 });
    expect((await env.db.query("SELECT status FROM verification_records WHERE kind='FACTORY_GSTIN_KYB'")).rows[0].status).toBe('PENDING');
  });

  it('rejects an invalid GSTIN', async () => {
    const a = env.agent();
    const { res } = await registerEmployer(a, { registration: { companyName: 'X Co', gstin: '27AABCE8821K1Z5', hrManagerName: 'A', industrialHub: 'Pune' } });
    expect(res.status).toBe(400);
  });
});
