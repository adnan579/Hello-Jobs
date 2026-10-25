import type { Request, Response, NextFunction } from 'express';
import type { Queryable } from '../db.ts';
import type { AppContext, AuthContext } from '../types.ts';
import { newToken, sha256 } from '../lib/ids.ts';
import { forbidden, unauthorized } from '../lib/errors.ts';

export const COOKIE_NAME = 'hj_session';
export const SESSION_TTL_SEC = 60 * 60 * 24 * 30;

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* ignore malformed cookie */
    }
  }
  return out;
}

export async function createSession(
  q: Queryable,
  input: { accountId: string; deviceLabel: string; ip: string }
): Promise<{ token: string; id: string }> {
  const token = newToken(32);
  const { rows } = await q.query<{ id: string }>(
    `INSERT INTO sessions (account_id, token_hash, device_label, ip, expires_at)
     VALUES ($1, $2, $3, $4, now() + make_interval(secs => $5)) RETURNING id`,
    [input.accountId, sha256(token), input.deviceLabel.slice(0, 120), input.ip, SESSION_TTL_SEC]
  );
  await q.query('UPDATE accounts SET last_login_at = now() WHERE id = $1', [input.accountId]);
  return { token, id: rows[0].id };
}

export function setSessionCookie(res: Response, token: string, secure: boolean): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_TTL_SEC * 1000,
  });
}

export function clearSessionCookie(res: Response, secure: boolean): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
}

export async function loadAuth(ctx: AppContext, token: string | undefined): Promise<AuthContext | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  const { rows } = await ctx.db.query<{
    session_id: string;
    account_id: string;
    role: AuthContext['role'];
    admin_role: AuthContext['adminRole'] | null;
    phone: string;
    last_seen_at: Date;
    worker_id: string | null;
    employer_id: string | null;
    member_role: AuthContext['memberRole'] | null;
  }>(
    `SELECT s.id AS session_id, a.id AS account_id, a.role, a.admin_role, a.phone, s.last_seen_at,
            w.id AS worker_id, m.employer_id, m.member_role
       FROM sessions s
       JOIN accounts a ON a.id = s.account_id
       LEFT JOIN workers w ON w.account_id = a.id
       LEFT JOIN employer_members m ON m.account_id = a.id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND a.status = 'active'`,
    [sha256(token)]
  );
  const r = rows[0];
  if (!r) return null;
  // Sliding "last seen" without a write on every request.
  if (Date.now() - r.last_seen_at.getTime() > 5 * 60_000) {
    ctx.db.query('UPDATE sessions SET last_seen_at = now() WHERE id = $1', [r.session_id]).catch(() => {});
  }
  return {
    sessionId: r.session_id,
    accountId: r.account_id,
    role: r.role,
    adminRole: r.admin_role ?? undefined,
    phone: r.phone,
    workerId: r.worker_id ?? undefined,
    employerId: r.employer_id ?? undefined,
    memberRole: r.member_role ?? undefined,
  };
}

export function attachAuth(ctx: AppContext) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    req.ctx = ctx;
    try {
      const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
      req.auth = (await loadAuth(ctx, token)) ?? undefined;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(unauthorized());
  next();
}

export function requireRole(...roles: AuthContext['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden());
    next();
  };
}

export function requireAdminRole(...adminRoles: NonNullable<AuthContext['adminRole']>[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (req.auth.role !== 'admin' || !req.auth.adminRole || !adminRoles.includes(req.auth.adminRole)) {
      return next(forbidden());
    }
    next();
  };
}
