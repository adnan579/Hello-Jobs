import { expect, it, vi } from 'vitest';
import type { AppContext } from '../server/types.ts';
import { listPublicJobs, publicJobById } from '../server/services/publicJobs.ts';
import { languageForCookie, roleForPath, workerTabForPath } from '../src/utils/routes.ts';

it('uses the existing public job serializer to omit HR contact fields', async () => {
  const row = {
    id: 'job_public_1',
    title: 'CNC Operator',
    trade: 'CNC / VMC Operator',
    company_name: 'Verified Factory',
    gstin: '27AAPFU0939F1ZV',
    kyb_status: 'VERIFIED',
    state: 'Maharashtra',
    industrial_hub: 'Pune',
    take_home_salary: 22000,
    vacancies_left: 2,
    is_active: true,
    moderation_status: 'Approved',
    created_at: new Date(),
    expires_at: new Date(Date.now() + 86_400_000),
    data: {
      hrContactName: 'Private HR',
      hrContactPhone: '+919999999999',
      whatsappApplyNumber: '+918888888888',
    },
  };
  const query = vi.fn(async () => ({ rows: [row] }));
  const ctx = { db: { query } } as unknown as AppContext;

  const job = await publicJobById(ctx, row.id);

  expect(query).toHaveBeenCalledWith(expect.stringContaining('e.kyb_status = \'VERIFIED\''), [row.id]);
  expect(job?.companyName).toBe('Verified Factory');
  expect(job).not.toHaveProperty('hrContactName');
  expect(job).not.toHaveProperty('hrContactPhone');
  expect(job).not.toHaveProperty('whatsappApplyNumber');
});

it('keeps hub and ITI filters in parameterized public-job SQL', async () => {
  const query = vi.fn(async () => ({ rows: [] }));
  const ctx = { db: { query } } as unknown as AppContext;

  await listPublicJobs(ctx, 'Pune', true);

  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("j.data->>'noCertificateRequired' IS DISTINCT FROM 'true'"),
    ['%Pune%']
  );
  expect(query).toHaveBeenCalledWith(expect.stringContaining('j.industrial_hub ILIKE $1'), ['%Pune%']);
});

it('maps public and signed-in screens to stable URL paths', () => {
  expect(roleForPath('/about')).toBe('about');
  expect(roleForPath('/jobs/job_1')).toBe('worker');
  expect(roleForPath('/me/applications')).toBe('worker-profile');
  expect(workerTabForPath('/me/applications')).toBe('inbox');
  expect(workerTabForPath('/me/id-card')).toBe('idcard');
  expect(roleForPath('/employers/talent')).toBe('employer');
  expect(roleForPath('/employers/dashboard')).toBe('employer-profile');
  expect(roleForPath('/', '#/about')).toBe('about');
  expect(languageForCookie('mr')).toBe('mr');
  expect(languageForCookie('unknown')).toBe('en');
});