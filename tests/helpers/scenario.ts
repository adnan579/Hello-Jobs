import request from 'supertest';
import type { TestEnv } from './app.ts';
import { loginAdmin, registerEmployer, registerWorker } from './app.ts';

type Agent = ReturnType<typeof request.agent>;

export const JOB = {
  title: 'Fitter - Assembly Line', trade: 'Fitter (Assembly & Bench)', category: 'skilled',
  plantLocation: 'Plot 12, Chakan MIDC', industrialHub: 'Chakan MIDC, Pune', state: 'Maharashtra',
  takeHomeSalary: 21500, grossSalary: 25000, overtimeHourlyRate: 120, shiftPattern: '8 hr, 2 shifts',
  facilities: { hasHostel: true, hasSubsidizedMess: true, hasBusPickup: false, esiPfCovered: true, safetyGearProvided: true },
  openingsCount: 5, hrContactName: 'Sunita Rao', hrContactPhone: '9823011490', whatsappApplyNumber: '9823011490',
  experienceRequired: '1+ years', minQualification: 'ITI Fitter',
};

/** A factory that an admin has verified, ready to post jobs and unlock phones. */
export async function verifiedEmployer(env: TestEnv, overrides: Record<string, unknown> = {}) {
  const a = env.agent();
  const { res } = await registerEmployer(a, overrides);
  expectOk(res.status);
  const admin = env.agent();
  await loginAdmin(env, admin, 'Trust & Safety');
  const rec = (await env.db.query(`SELECT id FROM verification_records WHERE kind = 'FACTORY_GSTIN_KYB' ORDER BY created_at DESC LIMIT 1`)).rows[0];
  const v = await admin.post('/api/admin/verify').send({ recordId: rec.id, status: 'VERIFIED' });
  expectOk(v.status);
  const me = (await a.get('/api/auth/me')).body.session;
  return { agent: a, employerId: me.employerId as string, admin };
}

export async function worker(env: TestEnv, overrides: Record<string, unknown> = {}) {
  const a = env.agent();
  const { res, phone } = await registerWorker(a, overrides);
  expectOk(res.status);
  const me = (await a.get('/api/auth/me')).body.session;
  return { agent: a, workerId: me.workerId as string, phone };
}

export async function postJob(agent: Agent, overrides: Record<string, unknown> = {}) {
  const r = await agent.post('/api/jobs').send({ ...JOB, ...overrides });
  expectOk(r.status);
  return r.body.job as { id: string };
}

function expectOk(status: number) {
  if (status >= 400) throw new Error(`setup step failed with status ${status}`);
}
