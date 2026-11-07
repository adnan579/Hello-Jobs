import { apiNotFound, nativeRoute } from '../../../server/next/native';
import { buildBootstrap } from '../../../server/services/bootstrap';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = nativeRoute(async ({ ctx, auth }) => ({
  headers: { 'Cache-Control': 'no-store' },
  body: await buildBootstrap(ctx, auth),
}));
export const POST = apiNotFound;
export const PUT = apiNotFound;
export const PATCH = apiNotFound;
export const DELETE = apiNotFound;
