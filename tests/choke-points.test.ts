import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeEnv, nextPhone } from './helpers/app.ts';
import { JOB, postJob, verifiedEmployer, worker } from './helpers/scenario.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

describe('choke-point fixes', () => {
  it('a paused factory cannot write, whatever the route', async () => {
    const e = await verifiedEmployer(env);
    await env.db.query('UPDATE employers SET paused = true WHERE id = $1', [e.employerId]);
    const r = await e.agent.post('/api/jobs').send(JOB);
    expect(r.status).toBe(403);
    expect((await e.agent.get('/api/bootstrap')).status).toBe(200);
  });

  it('login codes stop at the global hourly ceiling', async () => {
    await env.db.query(`INSERT INTO throttles (key, count, window_start) VALUES ('otp-send-all', 3000, now())`);
    const r = await request(env.app).post('/api/otp/send').send({ phone: nextPhone(), role: 'worker' });
    expect(r.status).toBe(503);
  });

  it('gross pay below in-hand pay is refused for jobs, and bad contact numbers too', async () => {
    const e = await verifiedEmployer(env);
    expect((await e.agent.post('/api/jobs').send({ ...JOB, takeHomeSalary: 30000, grossSalary: 20000 })).status).toBe(400);
    expect((await e.agent.post('/api/jobs').send({ ...JOB, hrContactPhone: '12345' })).status).toBe(400);
    expect((await e.agent.post('/api/jobs').send({ ...JOB, grossSalary: 0, hrContactPhone: '', whatsappApplyNumber: '' })).status).toBe(201);
  });

  it('a typed 10-digit WhatsApp number is stored with the country code', async () => {
    const e = await verifiedEmployer(env);
    const job = await postJob(e.agent, { whatsappApplyNumber: '9823011490' });
    const row = (await env.db.query('SELECT data FROM jobs WHERE id = $1', [job.id])).rows[0];
    expect(row.data.whatsappApplyNumber).toBe('919823011490');
  });

  it('erasing a worker blanks their name in every earlier audit row', async () => {
    const w = await worker(env);
    await w.agent.put(`/api/dpdp/consent/${w.workerId}`).send({ withdrawn: false });
    expect((await w.agent.delete(`/api/dpdp/erase/${w.workerId}`)).status).toBe(200);
    const rows = (await env.db.query('SELECT principal_name, details FROM audit_logs WHERE principal_id = $1', [w.workerId])).rows;
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.principal_name).toBe('Erased');
    expect(rows.some((r: { details: string }) => r.details === '[erased]')).toBe(true);
  });

  it('changing the trade or college on a certificate queues a fresh review', async () => {
    const w = await worker(env);
    const body = (tradeName: string) => ({
      name: 'Ramesh Kumar', trade: 'Fitter (Assembly & Bench)', category: 'skilled', currentCity: 'Pune', homeState: 'Bihar',
      ncvtCertificate: { certificateNumber: 'NCVT-123', rollNumber: 'R1', tradeName, itiCollege: 'ITI Pune' },
    });
    expect((await w.agent.put(`/api/candidates/${w.workerId}`).send(body('Fitter'))).status).toBe(200);
    expect((await w.agent.put(`/api/candidates/${w.workerId}`).send(body('Fitter'))).status).toBe(200);
    const n = async () => (await env.db.query(`SELECT count(*)::int AS n FROM verification_records WHERE kind='WORKER_NCVT_CERT'`)).rows[0].n;
    expect(await n()).toBe(1);
    expect((await w.agent.put(`/api/candidates/${w.workerId}`).send(body('Welder'))).status).toBe(200);
    expect(await n()).toBe(2);
  });
});
