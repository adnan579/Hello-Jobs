import { healthRoute } from '../../../server/next/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = healthRoute();
