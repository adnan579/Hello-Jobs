import type { AppContext } from '../types.ts';
import { apiHeaders } from '../lib/security-headers.ts';
import { describeStartupFailure, getServerContext } from '../runtime.ts';

/** GET /api/health: 200 when the database answers, otherwise 503 naming the start-up step that failed. */
export function healthRoute(getContext: () => Promise<AppContext> = getServerContext) {
  return async (): Promise<Response> => {
    const json = (status: number, body: unknown, isProd = false) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...apiHeaders(isProd) } });
    let ctx: AppContext;
    try {
      ctx = await getContext();
    } catch (error) {
      return json(503, { ok: false, ...describeStartupFailure(error) });
    }
    try {
      await ctx.db.query('SELECT 1');
      return json(200, { ok: true }, ctx.config.isProd);
    } catch {
      return json(503, { ok: false }, ctx.config.isProd);
    }
  };
}
