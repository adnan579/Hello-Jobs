import request from 'supertest';
import { createApp } from '../../server/app.ts';
import { loadConfig } from '../../server/config.ts';
import { createDb, type Db } from '../../server/db.ts';
import type { AppContext } from '../../server/types.ts';
import { createAdminAccount } from '../../server/services/adminAccounts.ts';
import { totpAt } from '../../server/lib/totp.ts';
import type { AdminRole } from '../../server/lib/permissions.ts';

export interface TestEnv {
  ctx: AppContext;
  db: Db;
  app: ReturnType<typeof createApp>;
  agent: () => ReturnType<typeof request.agent>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
  fetchCalls: { url: string; init?: RequestInit }[];
}

export function makeEnv(envOverrides: Record<string, string | undefined> = {}): TestEnv {
  const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: process.env.TEST_DATABASE_URL, SESSION_SECRET: 'x'.repeat(40), ...envOverrides });
  const db = createDb(process.env.TEST_DATABASE_URL!);
  const fetchCalls: TestEnv['fetchCalls'] = [];
  const ctx: AppContext = {
    db,
    config,
    deps: {
      now: () => new Date(),
      fetch: (async (url: any, init?: any) => {
        fetchCalls.push({ url: String(url), init });
        return new Response(JSON.stringify({ messages: [{ id: 'wamid.test' }] }), { status: 200 });
      }) as typeof fetch,
    },
  };
  const app = createApp(ctx);
  return {
    ctx, db, app, fetchCalls,
    agent: () => request.agent(app),
    reset: async () => {
      await db.query(`TRUNCATE accounts, otp_challenges, throttles, sessions, workers, employers, jobs, applications, offers, shortlists,
        contact_unlocks, credit_ledger, payment_orders, notifications, verification_records, reports, grievances, hiring_drives,
        drive_registrations, retention_checkins, consent_records, nominees, audit_logs, employer_members RESTART IDENTITY CASCADE`);
    },
    close: () => db.close(),
  };
}

type Agent = ReturnType<typeof request.agent>;

let phoneCounter = 0;
export function nextPhone(): string {
  phoneCounter += 1;
  return `9${String(100000000 + phoneCounter * 7919).slice(-9)}`;
}

export const VALID_GSTIN = '27AAPFU0939F1ZV';

export async function otpFor(agent: Agent, phone: string, role: 'worker' | 'employer' | 'admin'): Promise<string> {
  const res = await agent.post('/api/otp/send').send({ phone, role });
  if (res.status !== 200) throw new Error(`otp send failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.demoCode as string;
}

export async function registerWorker(agent: Agent, overrides: Record<string, unknown> = {}, phone = nextPhone()) {
  const code = await otpFor(agent, phone, 'worker');
  const res = await agent.post('/api/auth/verify').send({
    role: 'worker', phone, code, mode: 'register', adultConfirmed: true, termsAccepted: true,
    consent: { directoryDiscovery: true, whatsappJobAlerts: true },
    registration: { name: 'Ramesh Kumar', trade: 'Fitter (Assembly & Bench)', currentCity: 'Pune', homeState: 'Bihar', expectedSalary: 22000 },
    ...overrides,
  });
  return { res, phone };
}

export async function registerEmployer(agent: Agent, overrides: Record<string, unknown> = {}, phone = nextPhone()) {
  const code = await otpFor(agent, phone, 'employer');
  const res = await agent.post('/api/auth/verify').send({
    role: 'employer', phone, code, mode: 'register', adultConfirmed: true, termsAccepted: true,
    registration: { companyName: 'Precision Auto Components Pvt Ltd', gstin: VALID_GSTIN, hrManagerName: 'Sunita Rao', industrialHub: 'Chakan MIDC, Pune', state: 'Maharashtra' },
    ...overrides,
  });
  return { res, phone };
}

export const ADMIN_TEST_PASSWORD = 'Correct-Horse-Battery-42';
let adminSeq = 0;

/** Creates a staff account in the DB, then signs in through the real password + authenticator flow. */
export async function loginAdmin(env: TestEnv, agent: Agent, adminRole: AdminRole = 'Trust & Safety', opts: { email?: string } = {}) {
  const email = opts.email ?? `staff${Date.now()}${++adminSeq}@hellojobs.test`;
  await env.db.tx((q) => createAdminAccount(q, { email, name: 'Test Staff', role: adminRole, password: ADMIN_TEST_PASSWORD }));
  await env.db.query('UPDATE admin_credentials SET must_change_password = false WHERE lower(email) = $1', [email]);
  const first = await agent.post('/api/admin-auth/login').send({ email, password: ADMIN_TEST_PASSWORD });
  if (first.status !== 200) throw new Error(`admin login failed ${first.status} ${JSON.stringify(first.body)}`);
  let challenge = first.body.challenge as string;
  let secret = first.body.secret as string | undefined;
  if (first.body.next === 'enroll') {
    const v = await agent.post('/api/admin-auth/verify').send({ challenge, code: totpAt(secret!, Math.floor(Date.now() / 30_000)) });
    if (v.status !== 200) throw new Error(`admin enroll failed ${v.status} ${JSON.stringify(v.body)}`);
    return { email, secret: secret! };
  }
  throw new Error('unexpected admin login step');
}

/** A later sign-in for an already enrolled staff account (waits for a fresh 30s step if needed). */
export async function reloginAdmin(agent: Agent, email: string, secret: string, password = ADMIN_TEST_PASSWORD, step = 1) {
  const first = await agent.post('/api/admin-auth/login').send({ email, password });
  if (first.status !== 200) return first;
  return agent.post('/api/admin-auth/verify').send({ challenge: first.body.challenge, code: totpAt(secret, Math.floor(Date.now() / 30_000) + step) });
}
