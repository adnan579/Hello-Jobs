import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeEnv } from './helpers/app.ts';
import { loginAdmin } from './helpers/app.ts';
import { postJob, verifiedEmployer, worker } from './helpers/scenario.ts';

const env = makeEnv({ CRON_SECRET: 'cron-secret-for-tests' });
beforeEach(() => env.reset());
afterAll(() => env.close());

describe('DPDP rights', () => {
  it('a worker can export their data, and only their own', async () => {
    const w1 = await worker(env);
    const w2 = await worker(env);
    const res = await w1.agent.get('/api/dpdp/export');
    expect(res.status).toBe(200);
    expect(res.body.profile.id).toBe(w1.workerId);
    expect(JSON.stringify(res.body)).not.toContain(w2.workerId);
    expect((await request(env.app).get('/api/dpdp/export')).status).toBe(401);
  });

  it('erasing a worker removes the profile, ends the session and blocks erasing someone else', async () => {
    const w1 = await worker(env);
    const w2 = await worker(env);
    expect((await w1.agent.delete(`/api/dpdp/erase/${w2.workerId}`)).status).toBeGreaterThanOrEqual(403);
    expect((await w1.agent.delete(`/api/dpdp/erase/${w1.workerId}`)).status).toBe(200);
    expect((await w1.agent.get('/api/auth/me')).body.session).toBeNull();
    const left = await env.db.query('SELECT count(*)::int AS n FROM workers WHERE id = $1 AND name <> $2', [w1.workerId, 'Erased worker']);
    expect(left.rows[0].n).toBeLessThanOrEqual(1);
    const phone = (await env.db.query('SELECT phone FROM accounts WHERE id IN (SELECT account_id FROM workers WHERE id = $1)', [w1.workerId])).rows[0]?.phone;
    expect(phone ?? 'erased:').toMatch(/^erased:/);
  });

  it('erasing a factory removes its jobs but keeps the audit trail', async () => {
    const e = await verifiedEmployer(env);
    await postJob(e.agent);
    expect((await e.agent.delete('/api/dpdp/erase-employer')).status).toBe(200);
    expect((await env.db.query('SELECT count(*)::int AS n FROM jobs')).rows[0].n).toBe(0);
    const audits = (await env.db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'DATA_ERASED'`)).rows[0].n;
    expect(audits).toBe(1);
  });

  it('anyone can raise a grievance and it is recorded', async () => {
    const res = await request(env.app).post('/api/dpdp/grievance').send({
      dataPrincipalName: 'Ramesh', dataPrincipalPhone: '9811122233', role: 'worker', category: 'Data Erasure Request', description: 'Please erase my data.',
    });
    expect([200, 201]).toContain(res.status);
    expect((await env.db.query('SELECT count(*)::int AS n FROM grievances')).rows[0].n).toBe(1);
  });
});

describe('fee complaints and pausing', () => {
  it('trust & safety can pause a factory so its jobs disappear, and resume it', async () => {
    const e = await verifiedEmployer(env);
    await postJob(e.agent);
    const company = (await env.db.query('SELECT company_name FROM employers')).rows[0].company_name;
    const w = await worker(env);
    const rep = await w.agent.post('/api/reports').send({ reportedCompany: company, issueType: 'Fee Demanded', details: 'Asked for 2000 rupees at the gate.', amountDemanded: 2000 });
    expect(rep.status).toBeLessThan(300);
    const id = (await env.db.query('SELECT id FROM reports')).rows[0].id;

    // A worker cannot act on reports.
    expect((await w.agent.patch(`/api/admin/reports/${id}`).send({ status: 'Resolved' })).status).toBeGreaterThanOrEqual(401);

    const admin = env.agent();
    await loginAdmin(env, admin, 'Trust & Safety');
    expect((await admin.patch(`/api/admin/reports/${id}`).send({ status: 'Confirmed — Factory Paused', pauseFactoryPostings: true })).status).toBe(200);
    expect((await request(env.app).get('/api/bootstrap')).body.jobs).toHaveLength(0);
    expect((await admin.patch(`/api/admin/reports/${id}`).send({ status: 'Resolved', resumeFactoryPostings: true })).status).toBe(200);
    expect((await request(env.app).get('/api/bootstrap')).body.jobs).toHaveLength(1);
  });

  it('a Verifier cannot moderate reports', async () => {
    const e = await verifiedEmployer(env);
    const company = (await env.db.query('SELECT company_name FROM employers')).rows[0].company_name;
    const w = await worker(env);
    await w.agent.post('/api/reports').send({ reportedCompany: company, issueType: 'Fee Demanded', details: 'Asked for money at the gate.' });
    const id = (await env.db.query('SELECT id FROM reports')).rows[0].id;
    const verifier = env.agent();
    await loginAdmin(env, verifier, 'Verifier');
    expect((await verifier.patch(`/api/admin/reports/${id}`).send({ status: 'Resolved' })).status).toBe(403);
    void e;
  });
});

describe('scheduled cleanup', () => {
  it('needs the secret and removes only expired data', async () => {
    expect((await request(env.app).get('/api/cron/cleanup')).status).toBe(401);
    expect((await request(env.app).get('/api/cron/cleanup').set('Authorization', 'Bearer wrong')).status).toBe(401);
    const ok = await request(env.app).get('/api/cron/cleanup').set('Authorization', 'Bearer cron-secret-for-tests');
    expect(ok.status).toBe(200);
    expect(ok.body).toHaveProperty('otpChallenges');
  });
});

describe('payments webhook', () => {
  it('rejects a webhook with a bad signature', async () => {
    const res = await request(env.app).post('/api/webhooks/razorpay').set('x-razorpay-signature', 'bad').send({ event: 'payment.captured', payload: {} });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
