import { expect, it } from 'vitest';
import { authRouter } from '../server/routes/auth.ts';
import { bootstrapRouter } from '../server/routes/bootstrap.ts';
import { workersRouter } from '../server/routes/workers.ts';
import { employersRouter } from '../server/routes/employers.ts';
import { jobsRouter } from '../server/routes/jobs.ts';
import { applicationsRouter } from '../server/routes/applications.ts';
import { offersRouter } from '../server/routes/offers.ts';
import { creditsRouter, webhookRouter } from '../server/routes/credits.ts';
import { adminRouter } from '../server/routes/admin.ts';
import { adminAuthRouter } from '../server/routes/adminAuth.ts';
import { communityRouter } from '../server/routes/community.ts';
import { dpdpRouter } from '../server/routes/dpdp.ts';
import { cronRouter } from '../server/routes/cron.ts';

const routers = [
  authRouter, bootstrapRouter, workersRouter, employersRouter, jobsRouter,
  applicationsRouter, offersRouter, creditsRouter, webhookRouter,
  adminAuthRouter, adminRouter, communityRouter, dpdpRouter, cronRouter,
];

const baseline = [
  'ALL /api/cron/cleanup',
  'DELETE /api/dpdp/erase-employer',
  'DELETE /api/dpdp/erase/:workerId',
  'GET /api/admin-auth/me',
  'GET /api/admin-auth/sessions',
  'GET /api/admin/audit',
  'GET /api/admin/audit.csv',
  'GET /api/admin/employers',
  'GET /api/admin/employers/:id',
  'GET /api/admin/grievances',
  'GET /api/admin/jobs',
  'GET /api/admin/ledger',
  'GET /api/admin/notifications',
  'GET /api/admin/orders',
  'GET /api/admin/overview',
  'GET /api/admin/reports',
  'GET /api/admin/staff',
  'GET /api/admin/system',
  'GET /api/admin/verifications',
  'GET /api/admin/workers',
  'GET /api/admin/workers/:id',
  'GET /api/auth/me',
  'GET /api/bootstrap',
  'GET /api/dpdp/export',
  'GET /api/health',
  'GET /api/sessions',
  'PATCH /api/admin/grievances/:id',
  'PATCH /api/admin/reports/:id',
  'PATCH /api/admin/staff/:id',
  'PATCH /api/applications/:id',
  'PATCH /api/offers/:id/status',
  'POST /api/admin-auth/change-password',
  'POST /api/admin-auth/login',
  'POST /api/admin-auth/logout',
  'POST /api/admin-auth/sessions/revoke-others',
  'POST /api/admin-auth/verify',
  'POST /api/admin/employers/:id/credits',
  'POST /api/admin/employers/:id/pause',
  'POST /api/admin/employers/:id/reopen-verification',
  'POST /api/admin/employers/:id/suspend',
  'POST /api/admin/jobs/:id/moderate',
  'POST /api/admin/staff',
  'POST /api/admin/staff/:id/reset-authenticator',
  'POST /api/admin/staff/:id/reset-password',
  'POST /api/admin/staff/:id/unlock',
  'POST /api/admin/verify',
  'POST /api/admin/workers/:id/suspend',
  'POST /api/applications',
  'POST /api/auth/logout',
  'POST /api/auth/verify',
  'POST /api/candidates',
  'POST /api/checkins',
  'POST /api/credits/confirm',
  'POST /api/credits/purchase',
  'POST /api/credits/unlock-candidate',
  'POST /api/dpdp/grievance',
  'POST /api/drives',
  'POST /api/drives/:id/checkin',
  'POST /api/drives/:id/register',
  'POST /api/employer/shortlist/toggle',
  'POST /api/jobs',
  'POST /api/offers',
  'POST /api/otp/send',
  'POST /api/reports',
  'POST /api/sessions/revoke',
  'POST /api/webhooks/razorpay',
  'PUT /api/candidates/:id',
  'PUT /api/dpdp/consent/:workerId',
  'PUT /api/dpdp/nominee/:workerId',
  'PUT /api/employer',
  'PUT /api/jobs/:id',
];

it('keeps the Phase 0 API method and path inventory stable', () => {
  type RouteLayer = { route?: { path: string; methods: Record<string, boolean> } };
  const actual = routers.flatMap((router) => (router as unknown as { stack: RouteLayer[] }).stack.flatMap((layer) => {
    const route = layer.route;
    if (!route) return [];
    return Object.keys(route.methods)
      .filter((method) => route.methods[method])
      .map((method) => `${method === '_all' ? 'ALL' : method.toUpperCase()} /api${route.path}`);
  })).concat(['GET /api/health']).sort();

  expect(actual).toEqual(baseline);
});
