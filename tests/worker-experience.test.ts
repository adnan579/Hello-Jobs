import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { makeEnv } from './helpers/app.ts';
import { JOB, postJob, verifiedEmployer, worker } from './helpers/scenario.ts';
import { workerStatus, nextStepFor, WORKER_STEPS } from '../src/modules/workerHome.ts';
import { calculateProfileCompleteness } from '../src/modules/domain.ts';
import type { CandidateProfile, JobApplication, OfferLetter, PipelineStage } from '../src/types/index.ts';

const env = makeEnv({
  WHATSAPP_TOKEN: 'tok',
  WHATSAPP_PHONE_NUMBER_ID: '123',
  WHATSAPP_OTP_TEMPLATE: 'otp_code',
  WHATSAPP_ALERT_TEMPLATE_PREFIX: 'shramkart',
});
beforeEach(() => env.reset());
afterAll(() => env.close());

const OFFER = { monthlyInHand: 22000, monthlyGross: 25000, overtimeHourlyRate: 120, joiningDate: '2026-12-01', shiftPattern: 'General', accommodationProvided: true, esiPfIncluded: true };

describe('four-step application status', () => {
  it('shows four steps and keeps the ten internal stages out of sight', () => {
    expect(WORKER_STEPS).toEqual(['applied', 'shortlisted', 'interview', 'offer']);
    const reached: Record<string, number> = { Applied: 1, Shortlisted: 2, Interview: 3, 'Offer Issued': 4, Accepted: 4, Joined: 4 };
    for (const [stage, n] of Object.entries(reached)) {
      const s = workerStatus(stage as PipelineStage);
      expect(s.reached).toBe(n);
      expect(s.closed).toBeNull();
    }
    expect(workerStatus('Joined').joined).toBe(true);
    expect(workerStatus('Accepted').offerAccepted).toBe(true);
  });

  it('turns every ended outcome into one plain line, and never blames the factory for a worker choice', () => {
    expect(workerStatus('Rejected').closed).toBe('notSelected');
    expect(workerStatus('No-show').closed).toBe('notSelected');
    expect(workerStatus('Declined').closed).toBe('closedByYou');
    expect(workerStatus('Withdrawn').closed).toBe('closedByYou');
    expect(workerStatus('Rejected').reached).toBe(0);
  });
});

const baseWorker = (over: Partial<CandidateProfile> = {}): CandidateProfile =>
  ({
    id: 'w1', name: 'Ramesh Kumar', phone: '', avatarSeed: 'x', trade: 'Fitter (Assembly & Bench)', category: 'skilled',
    currentCity: 'Pune', homeState: 'Bihar', experienceYears: 3, machinesOperated: [], languagesSpoken: [], pastEmployments: [],
    readinessBadges: [], ncvtCertificate: { isVerified: false }, hasVideoDemo: false, expectedPayMin: 0, expectedPayMax: 0, ...over,
  }) as unknown as CandidateProfile;

describe('profile completeness and the next step', () => {
  it('asks for the video last and does not count it against the percentage', () => {
    const full = baseWorker({
      machinesOperated: ['Lathe', 'Drill'], pastEmployments: [{ companyName: 'A' } as never], readinessBadges: ['A', 'B', 'C'] as never,
      expectedPayMin: 18000, expectedPayMax: 22000, hasVideoDemo: false,
    });
    const c = calculateProfileCompleteness(full);
    expect(c.percentage).toBe(100);
    expect(c.missingStepsCount).toBe(0);
    expect(c.nextStepKey).toBe('video');
    expect(c.missingKeys).toEqual(['video']);
    const empty = calculateProfileCompleteness(baseWorker());
    expect(empty.missingKeys[empty.missingKeys.length - 1]).toBe('video');
    expect(empty.percentage).toBeLessThan(100);
  });

  it('puts an unanswered offer first, then the interview, then the profile, then the video', () => {
    const w = baseWorker();
    const app = (status: PipelineStage): JobApplication => ({ id: 'a1', candidateId: 'w1', jobTitle: 'Fitter', status } as JobApplication);
    const offer = { candidateId: 'w1', status: 'Issued' } as OfferLetter;
    expect(nextStepFor(w, [app('Interview')], [offer]).kind).toBe('respondOffer');
    expect(nextStepFor(w, [app('Interview')], []).kind).toBe('interview');
    expect(nextStepFor(w, [app('Applied')], []).kind).toBe('profile');
    const done = baseWorker({
      machinesOperated: ['Lathe', 'Drill'], pastEmployments: [{ companyName: 'A' } as never], readinessBadges: ['A', 'B', 'C'] as never,
      expectedPayMin: 18000, expectedPayMax: 22000,
    });
    expect(nextStepFor(done, [], []).kind).toBe('browse');
    expect(nextStepFor(done, [app('Applied')], []).kind).toBe('video');
    expect(nextStepFor({ ...done, hasVideoDemo: true }, [app('Applied')], []).kind).toBe('waiting');
  });
});

describe('shared-phone safety', () => {
  it('keeps the first sign-in from a new device short and a repeat device long', async () => {
    const w = await worker(env);
    const first = (await env.db.query(`SELECT extract(epoch FROM expires_at - created_at) AS s FROM sessions ORDER BY created_at DESC LIMIT 1`)).rows[0];
    expect(Number(first.s)).toBeLessThanOrEqual(24 * 3600 + 5);
    // Same device signs in again.
    const agent = env.agent();
    const { otpFor } = await import('./helpers/app.ts');
    const code = await otpFor(agent, w.phone, 'worker');
    await agent.post('/api/auth/verify').send({ role: 'worker', phone: w.phone, code, mode: 'login' });
    const rows = (await env.db.query(`SELECT extract(epoch FROM expires_at - created_at) AS s FROM sessions ORDER BY created_at`)).rows;
    expect(Number(rows[rows.length - 1].s)).toBeGreaterThan(20 * 24 * 3600);
  });
});

describe('WhatsApp stage alerts', () => {
  const alerts = () => env.fetchCalls.filter((c) => String(c.init?.body).includes('shramkart_'));
  const names = () => alerts().map((c) => JSON.parse(String(c.init?.body)).template.name);

  async function applied() {
    const f = await verifiedEmployer(env);
    const job = await postJob(f.agent, JOB);
    const w = await worker(env);
    await w.agent.post('/api/applications').send({ jobId: job.id });
    const appId = (await env.db.query('SELECT id FROM applications')).rows[0].id as string;
    return { f, w, appId };
  }

  it('sends shortlist, interview and offer alerts in the worker\'s language', async () => {
    const { f, w, appId } = await applied();
    await env.db.query(`UPDATE consent_records SET notice_language = 'ta' WHERE worker_id = $1`, [w.workerId]);
    env.fetchCalls.length = 0;
    expect((await f.agent.patch(`/api/applications/${appId}`).send({ status: 'Shortlisted' })).status).toBe(200);
    expect((await f.agent.patch(`/api/applications/${appId}`).send({ status: 'Interview' })).status).toBe(200);
    expect((await f.agent.post('/api/offers').send({ ...OFFER, applicationId: appId })).status).toBe(201);
    expect(names()).toEqual(['shramkart_shortlisted', 'shramkart_interview', 'shramkart_offer']);
    const first = JSON.parse(String(alerts()[0]!.init!.body));
    expect(first.template.language.code).toBe('ta');
    expect(first.template.components[0].parameters).toHaveLength(2);
    expect(first.to).toBe(`91${w.phone}`);
  });

  it('stays silent without consent, after consent is withdrawn, and never breaks the action', async () => {
    const { f, w, appId } = await applied();
    await env.db.query(`UPDATE consent_records SET whatsapp_job_alerts = false WHERE worker_id = $1`, [w.workerId]);
    env.fetchCalls.length = 0;
    expect((await f.agent.patch(`/api/applications/${appId}`).send({ status: 'Shortlisted' })).status).toBe(200);
    expect(alerts()).toHaveLength(0);

    await env.db.query(`UPDATE consent_records SET whatsapp_job_alerts = true, is_withdrawn = true WHERE worker_id = $1`, [w.workerId]);
    expect((await f.agent.patch(`/api/applications/${appId}`).send({ status: 'Interview' })).status).toBe(200);
    expect(alerts()).toHaveLength(0);

    await env.db.query(`UPDATE consent_records SET is_withdrawn = false WHERE worker_id = $1`, [w.workerId]);
    env.ctx.deps.fetch = (async () => new Response('nope', { status: 500 })) as typeof fetch;
    expect((await f.agent.post('/api/offers').send({ ...OFFER, applicationId: appId })).status).toBe(201);
  });
});
