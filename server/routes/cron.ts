import { Router } from 'express';
import crypto from 'node:crypto';
import { wrap } from '../lib/http.ts';
import { unauthorized } from '../lib/errors.ts';

export const cronRouter = Router();

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Housekeeping. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. Audit logs are never deleted. */
cronRouter.all(
  '/cron/cleanup',
  wrap(async (req, res) => {
    const secret = req.ctx.config.cronSecret;
    const header = String(req.headers.authorization ?? '');
    if (!secret || !header.startsWith('Bearer ') || !sameSecret(header.slice(7), secret)) throw unauthorized('Not allowed.');
    const db = req.ctx.db;
    const otp = await db.query(`DELETE FROM otp_challenges WHERE expires_at < now() - interval '1 day'`);
    const thr = await db.query(`DELETE FROM throttles WHERE window_start < now() - interval '1 day' AND (locked_until IS NULL OR locked_until < now())`);
    const ses = await db.query(`DELETE FROM sessions WHERE expires_at < now() OR revoked_at < now() - interval '30 days'`);
    const notes = await db.query(`DELETE FROM notifications WHERE created_at < now() - interval '180 days'`);
    res.json({ otpChallenges: otp.rowCount, throttles: thr.rowCount, sessions: ses.rowCount, notifications: notes.rowCount });
  })
);
