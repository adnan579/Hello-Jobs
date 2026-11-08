import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { makeEnv } from './helpers/app.ts';
import { JOB, postJob, verifiedEmployer } from './helpers/scenario.ts';
import { cached, invalidate } from '../server/lib/ttl-cache.ts';
import { API_LIMIT, overReadLimit, resetReadLimit } from '../server/lib/api-limit.ts';

describe('ttl cache', () => {
  it('runs one load for concurrent callers, then serves from memory until it expires or is invalidated', async () => {
    const owner = {};
    let loads = 0;
    const load = async () => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 10));
      return loads;
    };
    const [a, b, c] = await Promise.all([cached(owner, 30, 'k', load), cached(owner, 30, 'k', load), cached(owner, 30, 'k', load)]);
    expect([a, b, c]).toEqual([1, 1, 1]);
    expect(await cached(owner, 30, 'k', load)).toBe(1);
    invalidate(owner);
    expect(await cached(owner, 30, 'k', load)).toBe(2);
  });

  it('is off when ttl is 0 and keeps owners apart', async () => {
    const owner = {};
    let n = 0;
    expect(await cached(owner, 0, 'k', async () => ++n)).toBe(1);
    expect(await cached(owner, 0, 'k', async () => ++n)).toBe(2);
    expect(await cached({}, 30, 'k', async () => 'x')).toBe('x');
    expect(await cached({}, 30, 'k', async () => 'y')).toBe('y');
  });

  it('does not keep a failed load', async () => {
    const owner = {};
    await expect(cached(owner, 30, 'k', async () => { throw new Error('db down'); })).rejects.toThrow('db down');
    expect(await cached(owner, 30, 'k', async () => 'ok')).toBe('ok');
  });
});

describe('read rate limit (in memory)', () => {
  beforeEach(resetReadLimit);
  it('blocks the 601st read in a minute and starts again after the window', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < API_LIMIT.limit; i++) expect(overReadLimit('1.2.3.4', t0)).toBe(false);
    expect(overReadLimit('1.2.3.4', t0)).toBe(true);
    expect(overReadLimit('5.6.7.8', t0)).toBe(false);
    expect(overReadLimit('1.2.3.4', t0 + API_LIMIT.windowSec * 1000 + 1)).toBe(false);
  });
});

describe('public bootstrap cache', () => {
  const env = makeEnv({ PUBLIC_CACHE_SEC: '30' });
  const fresh = makeEnv();
  beforeEach(async () => {
    await env.reset();
    resetReadLimit();
  });
  afterAll(async () => {
    await env.close();
    await fresh.close();
  });

  const queryCount = (target: typeof env) => {
    let n = 0;
    const original = target.db.query.bind(target.db);
    (target.db as any).query = (...args: unknown[]) => {
      n += 1;
      return (original as any)(...args);
    };
    return { get: () => n, restore: () => ((target.db as any).query = original) };
  };

  it('serves the visitor job list from memory and refreshes after a write', async () => {
    const { agent } = await verifiedEmployer(env);
    const job = await postJob(agent);

    const first = await env.agent().get('/api/bootstrap');
    expect(first.body.jobs.map((j: any) => j.id)).toContain(job.id);

    const counter = queryCount(env);
    const second = await env.agent().get('/api/bootstrap');
    expect(second.status).toBe(200);
    expect(counter.get(), 'second visitor load runs no queries').toBe(0);
    counter.restore();

    // A change made behind the API's back is not seen until the cache expires or a write goes through.
    await env.db.query(`UPDATE jobs SET title = 'Changed in the database' WHERE id = $1`, [job.id]);
    expect((await env.agent().get('/api/bootstrap')).body.jobs.find((j: any) => j.id === job.id).title).toBe(JOB.title);

    const edited = await agent.put(`/api/jobs/${job.id}`).send({ ...JOB, title: 'Fitter - Night Shift' });
    expect(edited.status).toBe(200);
    expect((await env.agent().get('/api/bootstrap')).body.jobs.find((j: any) => j.id === job.id).title).toBe('Fitter - Night Shift');
  });

  it('never gives visitors HR contacts from the cache, and still gives them to signed-in workers', async () => {
    const { agent } = await verifiedEmployer(env);
    const job = await postJob(agent);
    const visitor = await env.agent().get('/api/bootstrap');
    expect(JSON.stringify(visitor.body)).not.toContain(JOB.hrContactPhone);

    const { worker } = await import('./helpers/scenario.ts');
    const w = await worker(env);
    const asWorker = await w.agent.get('/api/bootstrap');
    expect(asWorker.body.jobs.find((j: any) => j.id === job.id).hrContactPhone).toBe(JOB.hrContactPhone);
    const again = await env.agent().get('/api/bootstrap');
    expect(JSON.stringify(again.body)).not.toContain(JOB.hrContactPhone);
  });

  it('is exact (uncached) unless PUBLIC_CACHE_SEC is set', async () => {
    await fresh.reset();
    const { agent } = await verifiedEmployer(fresh);
    const job = await postJob(agent);
    await fresh.agent().get('/api/bootstrap');
    await fresh.db.query(`UPDATE jobs SET title = 'Changed in the database' WHERE id = $1`, [job.id]);
    expect((await fresh.agent().get('/api/bootstrap')).body.jobs.find((j: any) => j.id === job.id).title).toBe('Changed in the database');
  });
});
