import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { makeEnv } from './helpers/app.ts';
import { postJob, verifiedEmployer, worker } from './helpers/scenario.ts';

const env = makeEnv();
beforeEach(() => env.reset());
afterAll(() => env.close());

describe('saved jobs', () => {
  it('start empty, persist through the profile endpoint and come back in bootstrap', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent);
    const w = await worker(env);

    const before = (await w.agent.get('/api/bootstrap')).body;
    const me = before.candidates.find((c: any) => c.id === w.workerId);
    expect(me.savedJobIds ?? []).toEqual([]);

    const put = await w.agent.put(`/api/candidates/${w.workerId}`).send({ ...me, savedJobIds: [job.id] });
    expect(put.status).toBe(200);

    const after = (await w.agent.get('/api/bootstrap')).body;
    expect(after.candidates.find((c: any) => c.id === w.workerId).savedJobIds).toEqual([job.id]);
  });

  it('are private: a factory never sees a worker\'s saved list', async () => {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent);
    const w = await worker(env);
    const me = (await w.agent.get('/api/bootstrap')).body.candidates.find((c: any) => c.id === w.workerId);
    await w.agent.put(`/api/candidates/${w.workerId}`).send({ ...me, savedJobIds: [job.id] });

    const seen = (await f.agent.get('/api/bootstrap')).body.candidates.find((c: any) => c.id === w.workerId);
    if (seen) expect(seen.savedJobIds).toBeUndefined();
  });
});
