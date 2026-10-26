import crypto from 'node:crypto';
import type { AppContext } from '../types.ts';
import { getOtpPolicy } from './otpPolicy.ts';
import { sendWhatsAppOtp } from './otpDelivery.ts';
import { clear, hit, lock, lockedUntil } from './throttle.ts';

export const OTP_TTL_SEC = 300;
export const OTP_RESEND_AFTER_SEC = 30;
const MAX_ATTEMPTS_PER_CODE = 5;
const MAX_FAILS_BEFORE_LOCK = 10;
const LOCK_SEC = 3600;

export type OtpRole = 'worker' | 'employer';

export function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCode(secret: string, phone: string, role: string, code: string): string {
  return crypto.createHmac('sha256', secret).update(`${phone}:${role}:${code}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export type SendOtpResult =
  | { ok: true; channel: 'whatsapp' | 'on-screen'; devCode?: string; expiresInSec: number; resendAfterSec: number }
  | { ok: false; status: number; error: string };

export async function sendOtp(
  ctx: AppContext,
  input: { phone: string; role: OtpRole; ip: string }
): Promise<SendOtpResult> {
  const { db, config } = ctx;
  const { phone, role, ip } = input;

  const policy = getOtpPolicy(phone, config);
  if (policy.kind === 'blocked') {
    if (policy.reason === 'demo-not-invited') {
      return { ok: false, status: 403, error: 'This is a private test site and your number is not on the invite list yet.' };
    }
    console.error('[otp] No OTP provider configured. Set WHATSAPP_* variables, or OTP_DEMO_MODE=true with OTP_DEMO_ALLOWLIST for a private test.');
    return { ok: false, status: 503, error: 'Login codes cannot be sent right now. Please try again later.' };
  }

  const locked = await lockedUntil(db, `otp-lock:${phone}`);
  if (locked) return { ok: false, status: 429, error: 'Too many wrong codes. This number is locked for a while. Please try again later.' };

  const perIp = await hit(db, `otp-send-ip:${ip}`, 20, 3600);
  if (perIp.blocked) return { ok: false, status: 429, error: 'Too many requests from this network. Please try again later.' };
  const perPhone = await hit(db, `otp-send-phone:${phone}`, 3, 600);
  if (perPhone.blocked) return { ok: false, status: 429, error: 'Too many codes requested. Please wait a few minutes and try again.' };

  const code = generateCode();
  const codeHash = hashCode(config.sessionSecret, phone, role, code);
  await db.tx(async (q) => {
    await q.query('UPDATE otp_challenges SET consumed_at = now() WHERE phone = $1 AND role = $2 AND consumed_at IS NULL', [phone, role]);
    await q.query(
      `INSERT INTO otp_challenges (phone, role, code_hash, channel, ip, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + make_interval(secs => $6))`,
      [phone, role, codeHash, policy.kind, ip, OTP_TTL_SEC]
    );
  });

  if (policy.kind === 'whatsapp') {
    try {
      await sendWhatsAppOtp(phone, code, config, ctx.deps);
    } catch (err) {
      console.error('[otp] delivery failed:', (err as Error).message);
      await db.query('UPDATE otp_challenges SET consumed_at = now() WHERE phone = $1 AND role = $2 AND consumed_at IS NULL', [phone, role]);
      return { ok: false, status: 502, error: 'We could not send the code right now. Please try again.' };
    }
    return { ok: true, channel: 'whatsapp', expiresInSec: OTP_TTL_SEC, resendAfterSec: OTP_RESEND_AFTER_SEC };
  }
  return { ok: true, channel: 'on-screen', devCode: code, expiresInSec: OTP_TTL_SEC, resendAfterSec: OTP_RESEND_AFTER_SEC };
}

export type VerifyOtpResult = { ok: true } | { ok: false; status: number; error: string };

export async function verifyOtp(
  ctx: AppContext,
  input: { phone: string; role: OtpRole; code: string }
): Promise<VerifyOtpResult> {
  const { db, config } = ctx;
  const { phone, role } = input;
  const code = input.code.trim();

  if (await lockedUntil(db, `otp-lock:${phone}`)) {
    return { ok: false, status: 429, error: 'Too many wrong codes. This number is locked for a while. Please try again later.' };
  }

  const { rows } = await db.query<{ id: string; code_hash: string; attempts: number }>(
    `SELECT id, code_hash, attempts FROM otp_challenges
     WHERE phone = $1 AND role = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, role]
  );
  const challenge = rows[0];
  if (!challenge) return { ok: false, status: 400, error: 'This code has expired. Please request a new one.' };
  if (challenge.attempts >= MAX_ATTEMPTS_PER_CODE) {
    return { ok: false, status: 400, error: 'Too many wrong attempts for this code. Please request a new one.' };
  }

  const expected = challenge.code_hash;
  const given = hashCode(config.sessionSecret, phone, role, code);
  if (!/^\d{6}$/.test(code) || !safeEqual(expected, given)) {
    await db.query('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = $1', [challenge.id]);
    const fails = await hit(db, `otp-fail:${phone}`, MAX_FAILS_BEFORE_LOCK, 3600);
    if (fails.count >= MAX_FAILS_BEFORE_LOCK) await lock(db, `otp-lock:${phone}`, LOCK_SEC);
    return { ok: false, status: 401, error: 'Wrong code. Please check and try again.' };
  }

  // Single use: only one concurrent request can win this update.
  const consumed = await db.query('UPDATE otp_challenges SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL', [challenge.id]);
  if (consumed.rowCount !== 1) return { ok: false, status: 400, error: 'This code was already used. Please request a new one.' };
  await clear(db, `otp-fail:${phone}`);
  return { ok: true };
}
