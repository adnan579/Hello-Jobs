import { forbidden, unauthorized } from '../../../../server/lib/errors';
import { snapshotWith } from '../../../../server/lib/respond';
import { apiNotFound, nativeRoute } from '../../../../server/next/native';
import { updateJob } from '../../../../server/services/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = nativeRoute(async ({ ctx, auth, body, params }) => {
  if (!auth) throw unauthorized();
  if (auth.role !== 'employer') throw forbidden();
  const job = await updateJob(ctx, auth, params.id, body);
  return { body: await snapshotWith(ctx, auth, { job }) };
});
export const GET = apiNotFound;
export const POST = apiNotFound;
export const PATCH = apiNotFound;
export const DELETE = apiNotFound;
