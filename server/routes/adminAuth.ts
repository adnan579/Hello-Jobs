import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { wrap, parse, clientIp } from '../lib/http.ts';
import { HttpError, badRequest, forbidden, tooMany, unauthorized } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';
import { hashPassword, verifyPassword, burnPasswordTime, passwordProblem } from '../lib/password.ts';
import { decryptSecret, encryptSecret, newTotpSecret, otpauthUrl, verifyTotp } from '../lib/totp.ts';
import { ROLE_PERMISSIONS } from '../lib/permissions.ts';
import { hit } from '../auth/throttle.ts';
import { ADMIN_COOKIE, clearAdminCookie, createAdminSession, parseCookies, requireAdmin, setAdminCookie } from '../auth/session.ts';
import { sha256 } from '../lib/ids.ts';
import type { AppContext, AuthContext } from '../types.ts';
import type { Queryable } from '../db.ts';

export const adminAuthRouter = Router();

const GENERIC = 'Wrong email or password.';
const MAX_FAILS = 5;

const loginInput = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });
const verifyInput = z.object({ challenge: z.string().min(10).max(500), code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app.') });
const changeInput = z.object({ current: z.string().min(1).max(200), next: z.string().min(1).max(200) });

// A short-lived proof that the password step succeeded. Signed, so it cannot be forged or edited.
function signChallenge(ctx: AppContext, accountId: string): string {
  const body = Buffer.from(JSON.stringify({ a: accountId, e: Date.now() + 5 * 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', ctx.config.sessionSecret).update('admin-challenge:' + body).digest('base64url');
  return `${body}.${sig}`;
}
function readChallenge(ctx: AppContext, token: string): string {
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', ctx.config.sessionSecret).update('admin-challenge:' + (body ?? '')).digest('base64url');
  const ok = sig && sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) throw unauthorized('Please sign in again.');
  const { a, e } = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (typeof a !== 'string' || Date.now() > e) throw unauthorized('That sign-in took too long. Please start again.');
  return a;
}

interface Cred {
  account_id: string; email: string; display_name: string; password_hash: string; must_change_password: boolean;
  totp_secret_enc: string | null; totp_enabled: boolean; totp_last_step: string; failed_attempts: number; lock_count: number;
  locked_until: Date | null; admin_role: AuthContext['adminRole']; status: string;
}

const CRED_SELECT = `SELECT c.*, a.admin_role, a.status FROM admin_credentials c JOIN accounts a ON a.id = c.account_id AND a.role = 'admin'`;

function assertNotLocked(c: Cred) {
  if (c.locked_until && c.locked_until.getTime() > Date.now()) {
    const mins = Math.max(1, Math.ceil((c.locked_until.getTime() - Date.now()) / 60_000));
    throw tooMany(`Too many wrong attempts. This account is locked for about ${mins} more minute(s).`);
  }
}

/** Counts a wrong password or code. After 5 in a row the account locks: 15 min, then 30, then 60. */
async function registerFailure(q: Queryable, c: Cred, ip: string): Promise<void> {
  const fails = c.failed_attempts + 1;
  if (fails >= MAX_FAILS) {
    const lockCount = c.lock_count + 1;
    const minutes = Math.min(15 * 2 ** (lockCount - 1), 60);
    await q.query(`UPDATE admin_credentials SET failed_attempts = 0, lock_count = $2, locked_until = now() + make_interval(mins => $3) WHERE account_id = $1`, [c.account_id, lockCount, minutes]);
    await audit(q, { actorAccountId: c.account_id, principalId: c.account_id, principalName: c.email, action: 'ADMIN_LOCKED', details: `Locked for ${minutes} minutes after ${MAX_FAILS} wrong attempts.`, ip });
  } else {
    await q.query('UPDATE admin_credentials SET failed_attempts = $2 WHERE account_id = $1', [c.account_id, fails]);
  }
}

async function loadCred(q: Queryable, where: string, value: string): Promise<Cred | undefined> {
  return (await q.query<Cred>(`${CRED_SELECT} WHERE ${where}`, [value])).rows[0];
}

function mePayload(a: AuthContext) {
  return {
    email: a.email, displayName: a.displayName, adminRole: a.adminRole,
    mustChangePassword: Boolean(a.mustChangePassword),
    permissions: a.adminRole ? ROLE_PERMISSIONS[a.adminRole] : [],
  };
}

adminAuthRouter.post(
  '/admin-auth/login',
  wrap(async (req, res) => {
    const { email, password } = parse(loginInput, req.body);
    const ip = clientIp(req);
    const db = req.ctx.db;
    if ((await hit(db, `adminlogin:ip:${ip}`, 20, 900)).blocked) throw tooMany('Too many sign-in attempts from this network. Try again in 15 minutes.');

    const c = await loadCred(db, 'lower(c.email) = $1', email);
    if (!c || c.status !== 'active') {
      await burnPasswordTime(password);
      throw unauthorized(GENERIC);
    }
    assertNotLocked(c);
    if (!(await verifyPassword(password, c.password_hash))) {
      await registerFailure(db, c, ip);
      throw unauthorized(GENERIC);
    }

    const challenge = signChallenge(req.ctx, c.account_id);
    if (c.totp_enabled) return void res.json({ next: 'totp', challenge });

    // First sign-in: show the authenticator setup. The same secret is shown until it is confirmed.
    let secret = c.totp_secret_enc ? decryptSecret(c.totp_secret_enc, req.ctx.config.admin.totpKey) : null;
    if (!secret) {
      secret = newTotpSecret();
      await db.query('UPDATE admin_credentials SET totp_secret_enc = $2 WHERE account_id = $1', [c.account_id, encryptSecret(secret, req.ctx.config.admin.totpKey)]);
    }
    const url = otpauthUrl(secret, c.email);
    res.json({ next: 'enroll', challenge, secret, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) });
  })
);

adminAuthRouter.post(
  '/admin-auth/verify',
  wrap(async (req, res) => {
    const { challenge, code } = parse(verifyInput, req.body);
    const ip = clientIp(req);
    const db = req.ctx.db;
    if ((await hit(db, `adminlogin:ip:${ip}`, 40, 900)).blocked) throw tooMany('Too many attempts from this network. Try again in 15 minutes.');
    const accountId = readChallenge(req.ctx, challenge);
    const c = await loadCred(db, 'c.account_id = $1', accountId);
    if (!c || c.status !== 'active') throw unauthorized('Please sign in again.');
    assertNotLocked(c);
    if (!c.totp_secret_enc) throw badRequest('Authenticator is not set up. Please sign in again.');
    const secret = decryptSecret(c.totp_secret_enc, req.ctx.config.admin.totpKey);
    if (!secret) throw new HttpError(500, 'Your authenticator data cannot be read. Ask a Super Admin to reset your authenticator.');

    const step = verifyTotp(secret, code, Number(c.totp_last_step));
    if (step === null) {
      await registerFailure(db, c, ip);
      throw unauthorized('That code is not right. Check your phone clock and try the newest code.');
    }

    const token = await db.tx(async (q) => {
      // A code can be used once only (blocks someone who watched it being typed).
      const used = await q.query('UPDATE admin_credentials SET totp_last_step = $2, totp_enabled = true, failed_attempts = 0, lock_count = 0, locked_until = NULL WHERE account_id = $1 AND totp_last_step < $2', [c.account_id, step]);
      if (!used.rowCount) throw unauthorized('That code was already used. Wait for the next one.');
      const s = await createAdminSession(q, { accountId: c.account_id, ip, device: String(req.headers['user-agent'] ?? 'Browser') });
      await audit(q, { actorAccountId: c.account_id, principalId: c.account_id, principalName: c.email, action: 'ADMIN_LOGIN', details: `Signed in as ${c.admin_role}${c.totp_enabled ? '' : ' (authenticator set up)'}.`, ip });
      return s.token;
    });
    setAdminCookie(res, token, req.ctx.config.isProd);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, me: { email: c.email, displayName: c.display_name, adminRole: c.admin_role, mustChangePassword: c.must_change_password, permissions: c.admin_role ? ROLE_PERMISSIONS[c.admin_role] : [] } });
  })
);

adminAuthRouter.get('/admin-auth/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ me: req.admin ? mePayload(req.admin) : null });
});

adminAuthRouter.post(
  '/admin-auth/logout',
  wrap(async (req, res) => {
    const token = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
    if (token) await req.ctx.db.query('UPDATE sessions SET revoked_at = now() WHERE token_hash = $1', [sha256(token)]);
    clearAdminCookie(res, req.ctx.config.isProd);
    res.json({ ok: true });
  })
);

adminAuthRouter.post(
  '/admin-auth/change-password',
  wrap(async (req, res) => {
    if (!req.admin) throw unauthorized();
    const { current, next } = parse(changeInput, req.body);
    const c = await loadCred(req.ctx.db, 'c.account_id = $1', req.admin.accountId);
    if (!c) throw unauthorized();
    assertNotLocked(c);
    if (!(await verifyPassword(current, c.password_hash))) {
      await registerFailure(req.ctx.db, c, clientIp(req));
      throw forbidden('Your current password is not right.');
    }
    const problem = passwordProblem(next, c.email);
    if (problem) throw badRequest(problem);
    if (await verifyPassword(next, c.password_hash)) throw badRequest('Choose a password you have not used just now.');
    const hash = await hashPassword(next);
    await req.ctx.db.tx(async (q) => {
      await q.query('UPDATE admin_credentials SET password_hash = $2, must_change_password = false, password_changed_at = now() WHERE account_id = $1', [c.account_id, hash]);
      await q.query(`UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND kind = 'admin' AND id <> $2 AND revoked_at IS NULL`, [c.account_id, req.admin!.sessionId]);
      await audit(q, { actorAccountId: c.account_id, principalId: c.account_id, principalName: c.email, action: 'ADMIN_PASSWORD_CHANGED', details: 'Password changed. Other sessions ended.', ip: clientIp(req) });
    });
    res.json({ ok: true });
  })
);

adminAuthRouter.get(
  '/admin-auth/sessions',
  requireAdmin(),
  wrap(async (req, res) => {
    const { rows } = await req.ctx.db.query(
      `SELECT id, device_label, ip, created_at, last_seen_at, expires_at FROM sessions
        WHERE account_id = $1 AND kind = 'admin' AND revoked_at IS NULL AND expires_at > now() AND absolute_expires_at > now() ORDER BY created_at DESC`,
      [req.admin!.accountId]
    );
    res.json({ sessions: rows.map((r: any) => ({ id: r.id, device: r.device_label, ip: r.ip, startedAt: r.created_at, lastSeenAt: r.last_seen_at, current: r.id === req.admin!.sessionId })) });
  })
);

adminAuthRouter.post(
  '/admin-auth/sessions/revoke-others',
  requireAdmin(),
  wrap(async (req, res) => {
    await req.ctx.db.query(`UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND kind = 'admin' AND id <> $2 AND revoked_at IS NULL`, [req.admin!.accountId, req.admin!.sessionId]);
    res.json({ ok: true });
  })
);
