import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeEnv } from './helpers/app.ts';
import { postJob, verifiedEmployer, worker } from './helpers/scenario.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

const OFFER = { monthlyInHand: 22000, monthlyGross: 25000, overtimeHourlyRate: 120, joiningDate: '2026-12-01', shiftPattern: 'General', accommodationProvided: true, esiPfIncluded: true };

async function applied() {
  const f = await verifiedEmployer(env);
  const job = await postJob(f.agent);
  const w = await worker(env);
  await w.agent.post('/api/applications').send({ jobId: job.id });
  const app = (await env.db.query('SELECT id FROM applications')).rows[0];
  return { f, w, job, appId: app.id as string };
}

describe('offer and job lifecycle', () => {
  it('lets a factory send a new offer after the first one expired unanswered', async () => {
    const { f, w, appId } = await applied();
    expect((await f.agent.post('/api/offers').send({ ...OFFER, applicationId: appId })).status).toBe(201);
    expect((await f.agent.post('/api/offers').send({ ...OFFER, applicationId: appId })).status).toBe(400); // still live
    await env.db.query(`UPDATE offers SET data = jsonb_set(data, '{expiresAtIso}', to_jsonb((now() - interval '1 day')::text))`);
    const offerId = (await env.db.query('SELECT id FROM offers')).rows[0].id;
    expect((await w.agent.patch(`/api/offers/${offerId}/status`).send({ status: 'Accepted' })).status).toBe(400); // expired
    expect((await f.agent.post('/api/offers').send({ ...OFFER, applicationId: appId })).status).toBe(201);
    expect((await env.db.query(`SELECT count(*)::int n FROM offers WHERE status = 'Issued'`)).rows[0].n).toBe(1);
  });

  it('hides a fully filled job and stops new applications', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent, { openingsCount: 1 });
    const w = await worker(env);
    await env.db.query('UPDATE jobs SET vacancies_left = 0');
    expect((await request(env.app).get('/api/bootstrap')).body.jobs).toHaveLength(0);
    expect((await w.agent.post('/api/applications').send({ jobId: job.id })).status).toBe(404);
  });

  it('closes a live offer when the worker withdraws', async () => {
    const { f, w, appId } = await applied();
    await f.agent.post('/api/offers').send({ ...OFFER, applicationId: appId });
    expect((await w.agent.patch(`/api/applications/${appId}`).send({ status: 'Withdrawn' })).status).toBe(200);
    expect((await env.db.query('SELECT status FROM offers')).rows[0].status).toBe('Declined');
  });
});
