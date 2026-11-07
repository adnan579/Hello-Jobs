import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeEnv } from './helpers/app.ts';
import { JOB, postJob, verifiedEmployer, worker } from './helpers/scenario.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

const CONTACT = ['hrContactName', 'hrContactPhone', 'whatsappApplyNumber'];

describe('what a visitor can see and do', () => {
  it('sees real jobs but never the HR name, phone or WhatsApp number', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent);

    const res = await request(env.app).get('/api/bootstrap');
    expect(res.status).toBe(200);
    const seen = res.body.jobs.find((j: any) => j.id === job.id);
    expect(seen?.title).toBe(JOB.title);
    for (const k of CONTACT) expect(seen).not.toHaveProperty(k);
    expect(JSON.stringify(res.body)).not.toContain(JOB.hrContactPhone);
    expect(res.body.candidates).toEqual([]);
  });

  it('a signed-in worker gets the contact details so Call HR works', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent);
    const w = await worker(env);
    const seen = (await w.agent.get('/api/bootstrap')).body.jobs.find((j: any) => j.id === job.id);
    expect(seen.hrContactPhone).toBe(JOB.hrContactPhone);
    expect(seen.hrContactName).toBe(JOB.hrContactName);
  });

  it('the posting factory keeps its own contact details', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent);
    const own = (await f.agent.get('/api/bootstrap')).body.jobs.find((j: any) => j.id === job.id);
    expect(own.hrContactPhone).toBe(JOB.hrContactPhone);
  });

  it('another factory does not get a competitor\'s HR number', async () => {
    const a = await verifiedEmployer(env);
    const job = await postJob(a.agent);
    const b = await verifiedEmployer(env, {
      registration: { companyName: 'Other Works', gstin: '29AAGCB7383J1Z4', hrManagerName: 'B', industrialHub: 'Sanand' },
    });
    const seen = (await b.agent.get('/api/bootstrap')).body.jobs.find((j: any) => j.id === job.id);
    expect(seen).toBeDefined();
    expect(seen).not.toHaveProperty('hrContactPhone');
  });

  it('cannot post a job or apply without logging in', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent);
    expect((await request(env.app).post('/api/jobs').send(JOB)).status).toBe(401);
    expect((await request(env.app).post('/api/applications').send({ jobId: job.id })).status).toBe(401);
  });

  it('an unverified factory\'s job is not shown to visitors', async () => {
    const a = env.agent();
    const { registerEmployer } = await import('./helpers/app.ts');
    await registerEmployer(a);
    const posted = await a.post('/api/jobs').send(JOB);
    expect(posted.status).toBe(201);
    const res = await request(env.app).get('/api/bootstrap');
    expect(res.body.jobs.find((j: any) => j.id === posted.body.job.id)).toBeUndefined();
  });
});
