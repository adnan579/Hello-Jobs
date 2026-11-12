import type { IncomingMessage, ServerResponse } from 'node:http';
import { setServerContextForTests } from '../../server/runtime.ts';
import type { AppContext } from '../../server/types.ts';

/**
 * Serves the native route handlers in app/api to supertest, the way Next.js does: it reads the same
 * route files, matches the path (static before dynamic), and calls the handler with a web Request.
 * Anything with no route file answers 404 like the catch-all does.
 */
type Handler = (request: Request, route?: { params?: Promise<Record<string, string | string[]>> }) => Promise<Response>;
type Loader = () => Promise<Record<string, unknown>>;

interface Route {
  segments: string[];
  load: Loader;
}

const files = import.meta.glob('../../app/api/**/route.ts') as Record<string, Loader>;

const routes: Route[] = Object.entries(files)
  .map(([file, load]) => ({
    segments: file.replace('../../app/api/', 'api/').replace(/\/route\.ts$/, '').split('/'),
    load,
  }))
  .filter((r) => !r.segments.some((s) => s.startsWith('[...')))
  .sort((a, b) => weight(b.segments) - weight(a.segments));

/** More static segments sort first, so /api/jobs/mine wins over /api/jobs/[id]. */
function weight(segments: string[]): number {
  return segments.reduce((n, s) => n * 3 + (s.startsWith('[') ? 1 : 2), 0) + segments.length * 1000;
}

function match(pathname: string): { route: Route; params: Record<string, string> } | undefined {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  for (const route of routes) {
    if (route.segments.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    route.segments.forEach((seg, i) => {
      if (seg.startsWith('[')) params[seg.slice(1, -1)] = decodeURIComponent(parts[i]!);
      else if (seg !== parts[i]) ok = false;
    });
    if (ok) return { route, params };
  }
  return undefined;
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function send(res: ServerResponse, status: number, headers: Headers, body: Buffer | string | null) {
  const out: Record<string, string | string[]> = {};
  headers.forEach((value, key) => {
    if (key !== 'set-cookie') out[key] = value;
  });
  const cookies = headers.getSetCookie();
  if (cookies.length) out['set-cookie'] = cookies;
  res.writeHead(status, out);
  res.end(body ?? undefined);
}

/** A node request listener supertest can drive. */
export function nativeApp(ctx: AppContext, fallback?: (req: IncomingMessage, res: ServerResponse) => unknown): (req: IncomingMessage, res: ServerResponse) => void {
  return async (req, res) => {
    // Several test environments can be alive in one file; each request runs against the one it was made for.
    setServerContextForTests(ctx);
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const found = match(url.pathname);
    if (!found && fallback) return void fallback(req, res);
    if (!found) {
      return send(res, 404, new Headers({ 'content-type': 'application/json; charset=utf-8' }), JSON.stringify({ error: 'Not found.' }));
    }
    const method = (req.method ?? 'GET').toUpperCase();
    const mod = await found!.route.load();
    const handler = mod[method] as Handler | undefined;
    if (!handler) {
      return send(res, 405, new Headers(), null);
    }
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) for (const item of v) headers.append(k, item);
      else if (v !== undefined) headers.set(k, v);
    }
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const body = hasBody ? await readBody(req) : undefined;
    const response = await handler(
      new Request(url, { method, headers, body: body && body.length ? new Uint8Array(body) : undefined }),
      { params: Promise.resolve(found!.params) }
    );
    send(res, response.status, response.headers, Buffer.from(await response.arrayBuffer()));
  };
}
