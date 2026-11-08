/**
 * Error reporting without a heavy SDK.
 *
 * Every server error is written as ONE JSON line (so a Vercel log drain, Axiom, Datadog or Better Stack can alert on
 * `"level":"error"`), and, when SENTRY_DSN is set, also posted to Sentry as an event.
 *
 * Only this is sent: the error's type, message and stack, the HTTP method, the path without query string, the status,
 * and the app release/environment. Never request bodies, headers, cookies, phone numbers or query strings.
 * Reporting never throws and never waits more than a couple of seconds, so it cannot make a failing request worse.
 */
import type { AppContext } from '../types.ts';

export interface ReportOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface ErrorInfo {
  method?: string;
  /** Path only. A query string, if present, is dropped. */
  path?: string;
  status?: number;
  /** Which part of the app, e.g. "api", "startup", "render". */
  where?: string;
  tags?: Record<string, string>;
}

interface ParsedDsn {
  endpoint: string;
}

export function parseDsn(dsn: string | undefined): ParsedDsn | undefined {
  if (!dsn) return undefined;
  try {
    const url = new URL(dsn.trim());
    const key = decodeURIComponent(url.username);
    const parts = url.pathname.split('/').filter(Boolean);
    const project = parts.pop();
    if (!/^https?:$/.test(url.protocol) || !key || !project || !/^\d+$/.test(project)) return undefined;
    const prefix = parts.length ? `/${parts.join('/')}` : '';
    return { endpoint: `${url.protocol}//${url.host}${prefix}/api/${project}/envelope/?sentry_key=${encodeURIComponent(key)}&sentry_version=7` };
  } catch {
    return undefined;
  }
}

/** Removes things that must not leave the server: connection strings, long numbers (phones), query strings. */
export function scrub(text: string): string {
  return text
    .replace(/postgres(ql)?:\/\/\S+/gi, '[url]')
    .replace(/\b\d{10,}\b/g, '[number]')
    .replace(/(Bearer\s+)[\w.~+/=-]+/gi, '$1[token]');
}

export function cleanPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return (path.split(/[?#]/, 1)[0] ?? '').replace(/\/\d{10,}(?=\/|$)/g, '/:n');
}

interface Frame {
  function?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

/** V8 stack text to Sentry frames (oldest call first). */
export function framesOf(stack: string | undefined): Frame[] {
  if (!stack) return [];
  const frames: Frame[] = [];
  for (const line of stack.split('\n')) {
    const m = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?\s*$/.exec(line);
    if (m) frames.push({ function: m[1], filename: m[2]!.replace(/^file:\/\//, ''), lineno: Number(m[3]), colno: Number(m[4]) });
  }
  return frames.reverse();
}

function asError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) return { name: error.name || 'Error', message: error.message, stack: error.stack };
  return { name: 'NonError', message: typeof error === 'string' ? error : (() => { try { return JSON.stringify(error) ?? String(error); } catch { return String(error); } })() };
}

/** The single JSON log line for an error. */
export function errorLine(error: unknown, info: ErrorInfo = {}, now = new Date()): string {
  const e = asError(error);
  return JSON.stringify({
    level: 'error',
    t: now.toISOString(),
    where: info.where ?? 'api',
    m: info.method,
    p: cleanPath(info.path),
    s: info.status,
    ...info.tags,
    name: e.name,
    msg: scrub(e.message).slice(0, 500),
    stack: e.stack ? scrub(e.stack).split('\n').slice(0, 12).join('\n') : undefined,
  });
}

/** Builds the Sentry envelope for one error. Exported for tests. */
export function sentryEnvelope(opts: ReportOptions, error: unknown, info: ErrorInfo = {}, now = new Date(), eventId: string = globalThis.crypto.randomUUID().replace(/-/g, '')): string {
  const e = asError(error);
  const event = {
    event_id: eventId,
    timestamp: now.getTime() / 1000,
    platform: 'node',
    level: 'error',
    environment: opts.environment,
    release: opts.release,
    server_name: undefined,
    tags: { where: info.where ?? 'api', ...(info.status ? { status: String(info.status) } : {}), ...info.tags },
    request: info.path || info.method ? { method: info.method, url: cleanPath(info.path) } : undefined,
    exception: { values: [{ type: e.name, value: scrub(e.message).slice(0, 500), stacktrace: { frames: framesOf(e.stack ? scrub(e.stack) : undefined) } }] },
  };
  return [JSON.stringify({ event_id: eventId, sent_at: now.toISOString() }), JSON.stringify({ type: 'event' }), JSON.stringify(event)].join('\n');
}

// A crash loop must not flood Sentry (quota) or slow every request: send each distinct error at most once a minute,
// and at most 20 events a minute per instance. The JSON log line is always written.
const seen = new Map<string, number>();
let windowStart = 0;
let sentInWindow = 0;
const MAX_PER_MINUTE = 20;

export function resetReportLimits() {
  seen.clear();
  windowStart = 0;
  sentInWindow = 0;
}

function allowed(key: string, now: number): boolean {
  if (now - windowStart > 60_000) {
    windowStart = now;
    sentInWindow = 0;
    for (const [k, t] of seen) if (now - t > 60_000) seen.delete(k);
  }
  const last = seen.get(key);
  if (last !== undefined && now - last < 60_000) return false;
  if (sentInWindow >= MAX_PER_MINUTE) return false;
  seen.set(key, now);
  sentInWindow += 1;
  return true;
}

/** Writes the log line and, if configured, sends the event to Sentry. Never throws. */
export async function reportError(opts: ReportOptions, error: unknown, info: ErrorInfo = {}): Promise<void> {
  try {
    console.error(errorLine(error, info));
  } catch {
    /* logging must not fail the request */
  }
  const target = parseDsn(opts.dsn);
  if (!target) return;
  const e = asError(error);
  if (!allowed(`${e.name}|${e.message}|${cleanPath(info.path)}`, Date.now())) return;
  const doFetch = opts.fetch ?? globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 2000);
  try {
    const res = await doFetch(target.endpoint, { method: 'POST', headers: { 'content-type': 'application/x-sentry-envelope' }, body: sentryEnvelope(opts, error, info), signal: controller.signal });
    if (!res.ok) console.error(JSON.stringify({ level: 'warn', where: 'monitoring', msg: `Sentry answered ${res.status}` }));
  } catch (failure) {
    console.error(JSON.stringify({ level: 'warn', where: 'monitoring', msg: `Could not reach Sentry: ${(failure as Error)?.message ?? failure}` }));
  } finally {
    clearTimeout(timer);
  }
}

/** Reporter settings for a request that has an app context (uses the context's fetch, so tests can observe it). */
export function reporterOf(ctx: AppContext): ReportOptions {
  const m = ctx.config.monitoring;
  return { dsn: m.sentryDsn, environment: m.environment, release: m.release, fetch: ctx.deps.fetch };
}

/** Reporter settings from plain environment variables, for code that has no app context (start-up, instrumentation). */
export function reporterFromEnv(env: Record<string, string | undefined> = process.env): ReportOptions {
  return {
    dsn: env.SENTRY_DSN?.trim() || undefined,
    environment: env.VERCEL_ENV || env.NODE_ENV || 'development',
    release: env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || undefined,
  };
}

/**
 * Pings a heartbeat / dead-man's-switch URL (Healthchecks.io, Better Stack, Sentry Cron…). Called when a scheduled job
 * succeeds, so a job that fails OR never runs is noticed because the ping is missing. Never throws.
 */
export async function pingHeartbeat(url: string | undefined, doFetch: typeof fetch = globalThis.fetch, timeoutMs = 3000): Promise<boolean> {
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await doFetch(url, { method: 'GET', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
