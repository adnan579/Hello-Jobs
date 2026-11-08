import { ZodError } from 'zod';
import type { AppContext, AuthContext } from '../types.ts';
import { HttpError } from '../lib/errors.ts';
import { apiHeaders, isSameOrigin, MUTATING_METHODS } from '../lib/security-headers.ts';
import { overApiLimit, TOO_MANY } from '../lib/api-limit.ts';
import { invalidate } from '../lib/ttl-cache.ts';
import { reportError, reporterFromEnv, reporterOf } from '../lib/monitoring.ts';
import { ADMIN_COOKIE, COOKIE_NAME, loadAdminAuth, loadAuth, parseCookies } from '../auth/session.ts';
import { ensureBootstrapAdmin } from '../services/adminAccounts.ts';
import { getServerContext } from '../runtime.ts';

/**
 * Native Next.js API routes (Phase 5). A route written with `nativeRoute` behaves exactly like its Express
 * twin: same order of checks (body limit, rate limit, same-origin, session), same error bodies, same headers.
 * Next serves a specific route file before the catch-all adapter, so routes move across one at a time.
 */

export const JSON_BODY_LIMIT = 200 * 1024;

export interface NativeContext {
  ctx: AppContext;
  request: Request;
  params: Record<string, string>;
  /** The signed-in worker or factory member, if any. */
  auth?: AuthContext;
  /** The signed-in staff member (admin console cookie), if any. */
  admin?: AuthContext;
  ip: string;
  /** The parsed JSON body (undefined when there is none). Resolves lazily so GETs never read a body. */
  body: unknown;
}

export interface NativeResult {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  cookies?: string[];
}

type Handler = (c: NativeContext) => Promise<NativeResult | unknown>;
type RouteContext = { params?: Promise<Record<string, string | string[]>> };
type NextHandler = (request: Request, route?: RouteContext) => Promise<Response>;

export interface NativeOptions {
  /** Tests inject a context; production uses the shared one from server/runtime.ts. */
  getContext?: () => Promise<AppContext>;
  /** Public GETs that do not need the session can skip loading it. */
  skipAuth?: boolean;
}

let adminReady: Promise<void> | undefined;
async function defaultContext(): Promise<AppContext> {
  const ctx = await getServerContext();
  adminReady ??= ensureBootstrapAdmin(ctx.db, ctx.config).catch((error) => {
    adminReady = undefined;
    throw error;
  });
  await adminReady;
  return ctx;
}

function clientIpOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (forwarded || '127.0.0.1').replace(/^::ffff:/, '');
}

function reply(ctx: AppContext | undefined, result: NativeResult): Response {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', ...apiHeaders(Boolean(ctx?.config.isProd)), ...result.headers });
  for (const cookie of result.cookies ?? []) headers.append('set-cookie', cookie);
  const status = result.status ?? 200;
  const empty = status === 204 || status === 304;
  return new Response(empty ? null : JSON.stringify(result.body ?? {}), { status, headers });
}

export const errorBody = (message: string, extra?: Record<string, unknown>) => ({ error: message, ...(extra ?? {}) });

async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  if (!(type === 'application/json' || type.endsWith('+json'))) return undefined;
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > JSON_BODY_LIMIT) throw new HttpError(413, 'Request too large.');
  const reader = request.body?.getReader();
  if (!reader) return undefined;
  const chunks: Buffer[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > JSON_BODY_LIMIT) {
      await reader.cancel();
      throw new HttpError(413, 'Request too large.');
    }
    chunks.push(Buffer.from(value));
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Malformed JSON.');
  }
}

/** Same mapping as the Express error handler in server/app.ts. */
export function errorResult(error: unknown, request: Request): NativeResult {
  if (error instanceof HttpError) return { status: error.status, body: errorBody(error.message, error.extra) };
  if (error instanceof ZodError) return { status: 400, body: errorBody(error.issues[0]?.message ?? 'Invalid request.') };
  return { status: 500, body: errorBody('Something went wrong on our side. Please try again.') };
}

export function nativeRoute(handler: Handler, options: NativeOptions = {}): NextHandler {
  return async (request, route) => {
    let ctx: AppContext | undefined;
    try {
      ctx = await (options.getContext ?? defaultContext)();
    } catch (error) {
      await reportError(reporterFromEnv(), error, { where: 'startup', method: request.method, path: new URL(request.url).pathname, status: 503, tags: { stage: String((error as { startupStage?: string })?.startupStage ?? 'unknown') } });
      return reply(undefined, { status: 503, body: errorBody('The service is starting up or misconfigured. Please try again shortly.', { stage: (error as { startupStage?: string })?.startupStage }) });
    }

    const t0 = Date.now();
    const pathname = new URL(request.url).pathname;
    let result: NativeResult;
    try {
      // 1. Body (Express parses it before anything else, so a bad body wins over a missing session).
      const body = await readJson(request);
      // 2. Rate limit.
      const ip = clientIpOf(request);
      if (await overApiLimit(ctx.db, ip, request.method)) {
        result = { status: 429, body: TOO_MANY };
      } else if (MUTATING_METHODS.has(request.method) && !isSameOrigin(request.headers.get('origin'), request.headers.get('host'), ctx.config.appUrl)) {
        // 3. Browser writes must come from this site.
        result = { status: 403, body: errorBody('Cross-site request blocked.') };
      } else {
        // 4. Session.
        const cookies = parseCookies(request.headers.get('cookie') ?? undefined);
        const auth = options.skipAuth ? undefined : (await loadAuth(ctx, cookies[COOKIE_NAME])) ?? undefined;
        const admin = !options.skipAuth && cookies[ADMIN_COOKIE] ? (await loadAdminAuth(ctx, cookies[ADMIN_COOKIE])) ?? undefined : undefined;
        const raw = (await route?.params) ?? {};
        const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : v]));
        const out = await handler({ ctx, request, params, auth, admin, ip, body });
        result = out && typeof out === 'object' && ('body' in out || 'status' in out || 'cookies' in out || 'headers' in out) ? (out as NativeResult) : { body: out };
      }
    } catch (error) {
      result = errorResult(error, request);
      if (result.status === 500) await reportError(reporterOf(ctx), error, { where: 'api', method: request.method, path: pathname, status: 500 });
    }
    if (MUTATING_METHODS.has(request.method) && (result.status ?? 200) < 400) invalidate(ctx);
    if (ctx.config.isProd && pathname !== '/api/health') {
      console.log(JSON.stringify({ t: new Date().toISOString(), m: request.method, p: pathname.replace(/^\/api/, ''), s: result.status ?? 200, ms: Date.now() - t0 }));
    }
    return reply(ctx, result);
  };
}

/** What Express answers for an unknown path or method, for route files that only handle some methods. */
export const apiNotFound: NextHandler = async () => reply(undefined, { status: 404, body: errorBody('Not found.') });
