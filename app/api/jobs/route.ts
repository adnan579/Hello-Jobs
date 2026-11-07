import { forbidden, unauthorized } from '../../../server/lib/errors';
import { snapshotWith } from '../../../server/lib/respond';
import { apiNotFound, nativeRoute } from '../../../server/next/native';
import { createJob } from '../../../server/services/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = nativeRoute(async ({ ctx, auth, body }) => {
  if (!auth) throw unauthorized();
  if (auth.role !== 'employer') throw forbidden();
  const job = await createJob(ctx, auth, body);
  return { status: 201, body: await snapshotWith(ctx, auth, { job }) };
});
export const GET = apiNotFound;
export const PUT = apiNotFound;
export const PATCH = apiNotFound;
export const DELETE = apiNotFound;
