import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ADMIN_TEST_PASSWORD, loginAdmin, makeEnv, reloginAdmin } from './helpers/app.ts';
import { postJob, verifiedEmployer, worker } from './helpers/scenario.ts';
import { createAdminAccount } from '../server/services/adminAccounts.ts';
import { totpAt } from '../server/lib/totp.ts';
import { ensureBootstrapAdmin } from '../server/services/adminAccounts.ts';
import { loadConfig } from '../server/config.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

describe('admin sign-in', () => {
  it('needs password then authenticator, and the code works once', async () => {
    const a = env.agent();
    const { email, secret } = await loginAdmin(env, a);
    expect((await a.get('/api/admin-auth/me')).body.me.email).toBe(email);
    expect((await a.get('/api/admin/overview')).status).toBe(200);
    const b = env.agent();
    const first = await b.post('/api/admin-auth/login').send({ email, password: ADMIN_TEST_PASSWORD });
    expect(first.body.next).toBe('totp');
    const used = totpAt(secret, Math.floor(Date.now() / 30_000));
    const replay = await b.post('/api/admin-auth/verify').send({ challenge: first.body.challenge, code: used });
    expect(replay.status).toBe(401);
    expect((await reloginAdmin(env.agent(), email, secret)).status).toBe(200);
  });

  it('gives the same message for a wrong password and an unknown email', async () => {
    const a = env.agent();
    const { email } = await loginAdmin(env, a);
    const wrong = await request(env.app).post('/api/admin-auth/login').send({ email, password: 'Nope-nope-nope-1' });
    const unknown = await request(env.app).post('/api/admin-auth/login').send({ email: 'ghost@hellojobs.test', password: 'Nope-nope-nope-1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it('locks the account after five wrong passwords', async () => {
    const a = env.agent();
    const { email } = await loginAdmin(env, a);
    for (let i = 0; i < 5; i++) await request(env.app).post('/api/admin-auth/login').send({ email, password: 'Wrong-wrong-1234' });
    const res = await request(env.app).post('/api/admin-auth/login').send({ email, password: ADMIN_TEST_PASSWORD });
    expect(res.status).toBe(429);
  });

  it('forces a password change before anything else', async () => {
    const email = 'new.staff@hellojobs.test';
    await env.db.tx((q) => createAdminAccount(q, { email, name: 'New', role: 'Support', password: ADMIN_TEST_PASSWORD }));
    const a = env.agent();
    const first = await a.post('/api/admin-auth/login').send({ email, password: ADMIN_TEST_PASSWORD });
    expect(first.body.next).toBe('enroll');
    const v = await a.post('/api/admin-auth/verify').send({ challenge: first.body.challenge, code: totpAt(first.body.secret, Math.floor(Date.now() / 30_000)) });
    expect(v.body.me.mustChangePassword).toBe(true);
    const blocked = await a.get('/api/admin/overview');
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect((await a.post('/api/admin-auth/change-password').send({ current: ADMIN_TEST_PASSWORD, next: 'A-Much-Longer-Pass-77' })).status).toBe(200);
    expect((await a.get('/api/admin/overview')).status).toBe(200);
  });

  it('keeps public and staff sessions apart', async () => {
    const w = await worker(env);
    expect((await w.agent.get('/api/admin/overview')).status).toBe(401);
    expect((await w.agent.post('/api/otp/send').send({ role: 'admin', phone: '9999999999' })).status).toBe(400);
    const a = env.agent();
    await loginAdmin(env, a);
    expect((await a.get('/api/auth/me')).body.session).toBeNull();
  });

  it('ends a session after 30 idle minutes', async () => {
    const a = env.agent();
    await loginAdmin(env, a);
    await env.db.query(`UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE kind='admin'`);
    expect((await a.get('/api/admin/overview')).status).toBe(401);
  });
});

describe('admin permissions', () => {
  it('limits each role to its own modules', async () => {
    const v = env.agent();
    await loginAdmin(env, v, 'Verifier');
    expect((await v.get('/api/admin/verifications')).status).toBe(200);
    expect((await v.get('/api/admin/orders')).status).toBe(403);
    expect((await v.get('/api/admin/staff')).status).toBe(403);
    const f = env.agent();
    await loginAdmin(env, f, 'Finance');
    expect((await f.get('/api/admin/orders')).status).toBe(200);
    expect((await f.get('/api/admin/audit')).status).toBe(403);
  });

  it('protects the last Super Admin and yourself', async () => {
    const a = env.agent();
    await loginAdmin(env, a, 'Super Admin');
    const me = (await a.get('/api/admin/staff')).body.rows[0];
    expect((await a.patch(`/api/admin/staff/${me.id}`).send({ disabled: true })).status).toBe(403);
    expect((await a.patch(`/api/admin/staff/${me.id}`).send({ role: 'Support' })).status).toBe(403);
  });
});

describe('admin actions', () => {
  it('suspends a worker with a reason, ends their session and audits it', async () => {
    const w = await worker(env);
    const a = env.agent();
    await loginAdmin(env, a, 'Trust & Safety');
    expect((await a.post(`/api/admin/workers/${w.workerId}/suspend`).send({ suspend: true, reason: '' })).status).toBe(400);
    expect((await a.post(`/api/admin/workers/${w.workerId}/suspend`).send({ suspend: true, reason: 'Fake documents reported' })).status).toBe(200);
    expect((await w.agent.get('/api/auth/me')).body.session).toBeNull();
    const log = (await a.get('/api/admin/audit?action=ACCOUNT_SUSPENDED')).body;
    expect(log.rows[0].details).toContain('Fake documents reported');
  });

  it('adjusts credits with a ledger entry and never below zero', async () => {
    const { employerId } = await verifiedEmployer(env);
    const a = env.agent();
    await loginAdmin(env, a, 'Finance');
    const before = (await env.db.query('SELECT hunt_credits FROM employers WHERE id=$1', [employerId])).rows[0].hunt_credits;
    expect((await a.post(`/api/admin/employers/${employerId}/credits`).send({ change: 5, reason: 'Goodwill credit' })).body.balance).toBe(before + 5);
    expect((await a.post(`/api/admin/employers/${employerId}/credits`).send({ change: -9999, reason: 'Too much' })).status).toBe(409);
    const led = await env.db.query(`SELECT * FROM credit_ledger WHERE reason='ADMIN_ADJUSTMENT'`);
    expect(led.rowCount).toBe(1);
  });

  it('hides a job from the public and restores it', async () => {
    const { agent, employerId } = await verifiedEmployer(env);
    const job = await postJob(agent);
    const a = env.agent();
    await loginAdmin(env, a, 'Trust & Safety');
    const id = job.id;
    await a.post(`/api/admin/jobs/${id}/moderate`).send({ action: 'hide', reason: 'Asks for a fee' });
    expect((await request(env.app).get('/api/bootstrap')).body.jobs.find((j: any) => j.id === id)).toBeUndefined();
    await a.post(`/api/admin/jobs/${id}/moderate`).send({ action: 'restore', reason: 'Checked, fine' });
    expect((await request(env.app).get('/api/bootstrap')).body.jobs.find((j: any) => j.id === id)).toBeDefined();
    expect(employerId).toBeTruthy();
  });

  it('exports the audit log without formula injection', async () => {
    const a = env.agent();
    await loginAdmin(env, a, 'Super Admin');
    await env.db.query(`INSERT INTO audit_logs (principal_id, principal_name, action, details) VALUES ('x','=HYPERLINK("evil")','TEST','+cmd')`);
    const csv = (await a.get('/api/admin/audit.csv')).text;
    expect(csv).toContain(`"'=HYPERLINK`);
    expect(csv).toContain(`"'+cmd"`);
  });
});

describe('first admin from server settings', () => {
  const cfg = (extra: Record<string, string>) => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'x', SESSION_SECRET: 'x'.repeat(40), APP_URL: 'https://x.test', ...extra });

  it('accepts a simple temporary password, never throws, and still forces a change', async () => {
    await ensureBootstrapAdmin(env.db, cfg({ ADMIN_BOOTSTRAP_EMAIL: 'adnan@gmail.com', ADMIN_BOOTSTRAP_PASSWORD: 'Adnan@123' }));
    const a = env.agent();
    const first = await a.post('/api/admin-auth/login').send({ email: 'adnan@gmail.com', password: 'Adnan@123' });
    expect(first.status).toBe(200);
    expect(first.body.next).toBe('enroll');
  });

  it('a bad bootstrap setting does not break the site', async () => {
    await expect(ensureBootstrapAdmin(env.db, cfg({ ADMIN_BOOTSTRAP_EMAIL: 'not-an-email', ADMIN_BOOTSTRAP_PASSWORD: 'longenough1' }))).resolves.toBeUndefined();
    await expect(ensureBootstrapAdmin(env.db, cfg({ ADMIN_BOOTSTRAP_EMAIL: 'a@b.co', ADMIN_BOOTSTRAP_PASSWORD: 'short' }))).resolves.toBeUndefined();
  });
});
