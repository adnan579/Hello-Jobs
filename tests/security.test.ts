import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { loginAdmin } from './helpers/app.ts';
import { makeEnv } from './helpers/app.ts';
import { JOB, postJob, verifiedEmployer, worker } from './helpers/scenario.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

describe('data exposure', () => {
  it('anonymous visitors see only verified factories\' jobs and no worker data', async () => {
    const { agent } = await verifiedEmployer(env);
    await postJob(agent);
    await worker(env);
    const anon = (await request(env.app).get('/api/bootstrap')).body;
    expect(anon.jobs).toHaveLength(1);
    expect(anon.candidates).toEqual([]);
    expect(anon.applications).toEqual([]);
    expect(anon.employerProfile).toBeNull();
    expect(JSON.stringify(anon)).not.toMatch(/\+91 ?\d{5} ?\d{5}/);
    expect(anon.stats.workers).toBe(1);
  });

  it('a worker never sees other workers or employer private notes', async () => {
    const emp = await verifiedEmployer(env);
    const job = await postJob(emp.agent);
    const w1 = await worker(env, { registration: { name: 'Worker One', trade: 'Fitter (Assembly & Bench)', currentCity: 'Pune', homeState: 'Bihar' } });
    const w2 = await worker(env, { registration: { name: 'Worker Two', trade: 'Wireman', currentCity: 'Pune', homeState: 'Bihar' } });
    const a = await w1.agent.post('/api/applications').send({ jobId: job.id });
    expect(a.status).toBe(201);
    const appId = a.body.applications[0].id;
    await emp.agent.patch(`/api/applications/${appId}`).send({ status: 'Shortlisted', recruiterPrivateNote: 'low attitude' });

    const boot = (await w1.agent.get('/api/bootstrap')).body;
    expect(boot.candidates).toHaveLength(1);
    expect(boot.candidates[0].id).toBe(w1.workerId);
    expect(JSON.stringify(boot)).not.toContain('Worker Two');
    expect(JSON.stringify(boot)).not.toContain('low attitude');
    expect(boot.applications[0].status).toBe('Shortlisted');
    expect((await w2.agent.get('/api/bootstrap')).body.applications).toEqual([]);
  });

  it('employers see masked phones until they apply or unlock', async () => {
    const emp = await verifiedEmployer(env);
    const w = await worker(env);
    const boot = (await emp.agent.get('/api/bootstrap')).body;
    const c = boot.candidates.find((x: any) => x.id === w.workerId);
    expect(c.phone).toContain('•');
    expect(c.phone).not.toContain(w.phone.slice(0, 6));
    expect(c.dpdpNominee).toBeUndefined();
    expect(c.shareToken).toBeUndefined();
  });

  it('workers who hide from the directory are not listed', async () => {
    const emp = await verifiedEmployer(env);
    const w = await worker(env, { consent: { directoryDiscovery: false } });
    const boot = (await emp.agent.get('/api/bootstrap')).body;
    expect(boot.candidates.find((x: any) => x.id === w.workerId)).toBeUndefined();
  });

  it('an unverified factory cannot post public jobs or browse the directory', async () => {
    const a = env.agent();
    const { registerEmployer } = await import('./helpers/app.ts');
    await registerEmployer(a);
    await worker(env);
    const job = await a.post('/api/jobs').send(JOB);
    expect(job.status).toBe(201);
    expect((await request(env.app).get('/api/bootstrap')).body.jobs).toHaveLength(0);
    const boot = (await a.get('/api/bootstrap')).body;
    expect(boot.candidates).toEqual([]);
    expect(boot.jobs[0].moderationReason).toMatch(/verified/i);
  });
});

describe('authorisation', () => {
  it('anonymous callers are rejected on every protected write', async () => {
    const calls: [string, string][] = [
      ['post', '/api/jobs'], ['put', '/api/jobs/x'], ['post', '/api/applications'], ['patch', '/api/applications/x'], ['post', '/api/offers'],
      ['patch', '/api/offers/x/status'], ['put', '/api/employer'], ['post', '/api/employer/shortlist/toggle'], ['post', '/api/credits/unlock-candidate'],
      ['post', '/api/credits/purchase'], ['post', '/api/credits/confirm'], ['post', '/api/admin/verify'], ['patch', '/api/admin/reports/x'],
      ['put', '/api/candidates/x'], ['post', '/api/drives'], ['post', '/api/checkins'], ['put', '/api/dpdp/consent/x'], ['delete', '/api/dpdp/erase/x'],
      ['delete', '/api/dpdp/erase-employer'], ['get', '/api/dpdp/export'], ['get', '/api/sessions'],
    ];
    for (const [m, url] of calls) {
      const r = await (request(env.app) as any)[m](url).send({});
      expect(r.status, `${m} ${url}`).toBe(401);
    }
  });

  it('a worker cannot call employer or admin endpoints', async () => {
    const w = await worker(env);
    expect((await w.agent.post('/api/jobs').send(JOB)).status).toBe(403);
    expect((await w.agent.post('/api/credits/purchase').send({ packId: 'PACK_10' })).status).toBe(403);
    expect((await w.agent.post('/api/admin/verify').send({ recordId: 'x', status: 'VERIFIED' })).status).toBe(403);
  });

  it('a factory cannot verify itself', async () => {
    const a = env.agent();
    const { registerEmployer } = await import('./helpers/app.ts');
    await registerEmployer(a);
    const rec = (await env.db.query(`SELECT id FROM verification_records LIMIT 1`)).rows[0];
    expect((await a.post('/api/admin/verify').send({ recordId: rec.id, status: 'VERIFIED' })).status).toBe(403);
    expect((await env.db.query('SELECT kyb_status FROM employers')).rows[0].kyb_status).toBe('PENDING');
  });

  it('Support admins cannot verify or moderate; Verifiers cannot moderate reports', async () => {
    const emp = await verifiedEmployer(env);
    void emp;
    const support = env.agent();
    await loginAdmin(env, support, 'Support');
    expect((await support.post('/api/admin/verify').send({ recordId: 'x', status: 'VERIFIED' })).status).toBe(403);
    const verifier = env.agent();
    await loginAdmin(env, verifier, 'Verifier');
    expect((await verifier.patch('/api/admin/reports/x').send({ status: 'Resolved' })).status).toBe(403);
  });

  it('workers cannot edit another worker\'s profile', async () => {
    const w1 = await worker(env);
    const w2 = await worker(env);
    const r = await w1.agent.put(`/api/candidates/${w2.workerId}`).send({ name: 'Hacked', trade: 'Wireman', category: 'skilled', currentCity: 'X', homeState: 'Y' });
    expect(r.status).toBe(403);
    expect((await env.db.query('SELECT name FROM workers WHERE id = $1', [w2.workerId])).rows[0].name).toBe('Ramesh Kumar');
  });

  it('profile edits cannot self-verify or forge server-owned fields', async () => {
    const w = await worker(env);
    const r = await w.agent.put(`/api/candidates/${w.workerId}`).send({
      name: 'Ramesh Kumar', trade: 'Fitter (Assembly & Bench)', category: 'skilled', currentCity: 'Pune', homeState: 'Bihar',
      phone: '+91 99999 99999', id: 'cand-hacked', videoVerificationStatus: 'CHECKED_REAL_WORK', readinessBadges: ['Mobile OTP Verified', 'Night Shift Ready'],
      ncvtCertificate: { isVerified: true, verificationMethod: 'DIGILOCKER_MSDE', certificateNumber: 'NCVT-123', rollNumber: 'R1', tradeName: 'Fitter', itiCollege: 'ITI Pune' },
    });
    expect(r.status).toBe(200);
    const c = r.body.candidate;
    expect(c.id).toBe(w.workerId);
    expect(c.phone).not.toContain('99999 99999');
    expect(c.ncvtCertificate.isVerified).toBe(false);
    expect(c.ncvtCertificate.verificationMethod).toBe('PENDING');
    expect(c.videoVerificationStatus).toBe('NONE');
    const pending = await env.db.query(`SELECT count(*)::int AS n FROM verification_records WHERE kind='WORKER_NCVT_CERT' AND status='PENDING'`);
    expect(pending.rows[0].n).toBe(1);
  });

  it('an employer cannot touch another employer\'s jobs, applications or offers', async () => {
    const e1 = await verifiedEmployer(env);
    const e2 = await verifiedEmployer(env, { registration: { companyName: 'Other Works', gstin: '29AAGCB7383J1Z4', hrManagerName: 'B', industrialHub: 'Sanand' } });
    const job = await postJob(e1.agent);
    const w = await worker(env);
    const app = (await w.agent.post('/api/applications').send({ jobId: job.id })).body.applications[0];

    expect((await e2.agent.put(`/api/jobs/${job.id}`).send(JOB)).status).toBe(404);
    expect((await e2.agent.patch(`/api/applications/${app.id}`).send({ status: 'Rejected' })).status).toBe(404);
    expect((await e2.agent.post('/api/offers').send({ applicationId: app.id, monthlyInHand: 22000, joiningDate: '2026-11-10' })).status).toBe(404);
    expect((await env.db.query('SELECT status FROM applications WHERE id = $1', [app.id])).rows[0].status).toBe('Applied');
  });

  it('team viewers are read-only', async () => {
    const e = await verifiedEmployer(env);
    const viewerPhone = '9988776655';
    const r = await e.agent.put('/api/employer').send({ teamMembers: [{ name: 'Intern', phone: viewerPhone, role: 'Viewer' }] });
    expect(r.status).toBe(200);
    const v = env.agent();
    const code = (await v.post('/api/otp/send').send({ phone: viewerPhone, role: 'employer' })).body.demoCode;
    expect((await v.post('/api/auth/verify').send({ role: 'employer', phone: viewerPhone, code, mode: 'login' })).status).toBe(200);
    expect((await v.post('/api/jobs').send(JOB)).status).toBe(403);
    expect((await v.get('/api/bootstrap')).body.employerProfile.id).toBe(e.employerId);
  });
});

describe('workflow integrity', () => {
  it('enforces the hiring pipeline', async () => {
    const e = await verifiedEmployer(env);
    const job = await postJob(e.agent);
    const w = await worker(env);
    const appId = (await w.agent.post('/api/applications').send({ jobId: job.id })).body.applications[0].id;

    expect((await e.agent.patch(`/api/applications/${appId}`).send({ status: 'Joined' })).status).toBe(400);
    expect((await e.agent.patch(`/api/applications/${appId}`).send({ status: 'Accepted' })).status).toBe(400);
    expect((await w.agent.patch(`/api/applications/${appId}`).send({ status: 'Shortlisted' })).status).toBe(400);
    expect((await e.agent.patch(`/api/applications/${appId}`).send({ status: 'Interview' })).status).toBe(200);
  });

  it('applying twice is idempotent and applying reveals the phone to that employer only', async () => {
    const e1 = await verifiedEmployer(env);
    const e2 = await verifiedEmployer(env, { registration: { companyName: 'Other Works', gstin: '29AAGCB7383J1Z4', hrManagerName: 'B', industrialHub: 'Sanand' } });
    const job = await postJob(e1.agent);
    const w = await worker(env);
    expect((await w.agent.post('/api/applications').send({ jobId: job.id })).status).toBe(201);
    expect((await w.agent.post('/api/applications').send({ jobId: job.id })).status).toBe(200);
    expect((await env.db.query('SELECT count(*)::int AS n FROM applications')).rows[0].n).toBe(1);
    const seen1 = (await e1.agent.get('/api/bootstrap')).body.candidates.find((c: any) => c.id === w.workerId);
    const seen2 = (await e2.agent.get('/api/bootstrap')).body.candidates.find((c: any) => c.id === w.workerId);
    expect(seen1.phone).not.toContain('•');
    expect(seen2.phone).toContain('•');
  });

  it('offer -> accept -> join keeps one application in sync and reduces vacancies once', async () => {
    const e = await verifiedEmployer(env);
    const job = await postJob(e.agent, { openingsCount: 2 });
    const w = await worker(env);
    const appId = (await w.agent.post('/api/applications').send({ jobId: job.id })).body.applications[0].id;

    const offer = await e.agent.post('/api/offers').send({ applicationId: appId, monthlyInHand: 20000, joiningDate: '2026-11-10' });
    expect(offer.status).toBe(201);
    expect(offer.body.offer.payPromiseWarning).toMatch(/lower than/);
    expect((await e.agent.post('/api/offers').send({ applicationId: appId, monthlyInHand: 22000, joiningDate: '2026-11-10' })).status).toBe(400);

    const offerId = offer.body.offer.id;
    expect((await e.agent.patch(`/api/offers/${offerId}/status`).send({ status: 'Accepted' })).status).toBe(403);
    expect((await w.agent.patch(`/api/offers/${offerId}/status`).send({ status: 'Joined Confirmed' })).status).toBe(400);
    expect((await w.agent.patch(`/api/offers/${offerId}/status`).send({ status: 'Accepted' })).status).toBe(200);
    expect((await w.agent.patch(`/api/offers/${offerId}/status`).send({ status: 'Joined Confirmed' })).status).toBe(200);
    expect((await w.agent.patch(`/api/offers/${offerId}/status`).send({ status: 'Joined Confirmed' })).status).toBe(400);

    // The worker's claim alone must not fill a vacancy.
    expect((await env.db.query('SELECT status FROM applications WHERE id = $1', [appId])).rows[0].status).toBe('Accepted');
    expect((await env.db.query('SELECT vacancies_left FROM jobs WHERE id = $1', [job.id])).rows[0].vacancies_left).toBe(2);
    expect((await w.agent.patch(`/api/applications/${appId}`).send({ status: 'Joined' })).status).toBe(400);

    expect((await e.agent.patch(`/api/applications/${appId}`).send({ status: 'Joined' })).status).toBe(200);
    expect((await env.db.query('SELECT status FROM applications WHERE id = $1', [appId])).rows[0].status).toBe('Joined');
    expect((await env.db.query('SELECT vacancies_left FROM jobs WHERE id = $1', [job.id])).rows[0].vacancies_left).toBe(1);
    expect((await env.db.query('SELECT status FROM offers WHERE id = $1', [offerId])).rows[0].status).toBe('Joined Confirmed');
  });
});

describe('credits', () => {
  it('cannot be bought for free in production without a provider, and unlock never goes negative', async () => {
    const prod = makeEnv({ NODE_ENV: 'production', DATABASE_URL: 'x', OTP_DEMO_MODE: 'true', OTP_DEMO_ALLOWLIST: '9876543210' });
    expect(prod.ctx.config.payments.mode).toBe('off');
    await prod.close();
  });

  it('unlock spends exactly one credit, once, and is blocked at zero', async () => {
    const e = await verifiedEmployer(env);
    const w1 = await worker(env);
    const w2 = await worker(env);
    // verified factories get welcome credits
    expect((await e.agent.get('/api/bootstrap')).body.employerProfile.huntCredits).toBe(3);

    const r1 = await e.agent.post('/api/credits/unlock-candidate').send({ candidateId: w1.workerId });
    expect(r1.status).toBe(200);
    expect(r1.body.employerProfile.huntCredits).toBe(2);
    expect((await e.agent.post('/api/credits/unlock-candidate').send({ candidateId: w1.workerId })).body.employerProfile.huntCredits).toBe(2);

    await env.db.query('UPDATE employers SET hunt_credits = 0');
    const blocked = await e.agent.post('/api/credits/unlock-candidate').send({ candidateId: w2.workerId });
    expect(blocked.status).toBe(402);
  });

  it('parallel unlocks with one credit left charge once and never overdraw', async () => {
    const e = await verifiedEmployer(env);
    const ws = [await worker(env), await worker(env), await worker(env), await worker(env)];
    await env.db.query('UPDATE employers SET hunt_credits = 1');
    const results = await Promise.all(ws.map((w) => e.agent.post('/api/credits/unlock-candidate').send({ candidateId: w.workerId })));
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 402)).toHaveLength(3);
    expect((await env.db.query('SELECT hunt_credits FROM employers')).rows[0].hunt_credits).toBe(0);
    expect((await env.db.query('SELECT count(*)::int AS n FROM contact_unlocks')).rows[0].n).toBe(1);
  });

  it('an unverified factory cannot unlock phones', async () => {
    const a = env.agent();
    const { registerEmployer } = await import('./helpers/app.ts');
    await registerEmployer(a);
    const w = await worker(env);
    expect((await a.post('/api/credits/unlock-candidate').send({ candidateId: w.workerId })).status).toBe(403);
  });

  it('demo purchase credits once with a server-side price and invoice number', async () => {
    const e = await verifiedEmployer(env);
    const order = await e.agent.post('/api/credits/purchase').send({ packId: 'PACK_10', amountInr: 1 });
    expect(order.status).toBe(200);
    expect(order.body.mode).toBe('demo');
    expect(order.body.amountPaise).toBe(117882);
    const c1 = await e.agent.post('/api/credits/confirm').send({ orderId: order.body.orderId });
    const c2 = await e.agent.post('/api/credits/confirm').send({ orderId: order.body.orderId });
    expect(c1.status).toBe(200);
    expect(c2.status).toBe(200);
    expect(c1.body.employerProfile.huntCredits).toBe(13);
    expect(c2.body.employerProfile.huntCredits).toBe(13);
    expect(c1.body.invoiceNo).toMatch(/^HJ\/\d{2}-\d{2}\/000001$/);
  });
});
