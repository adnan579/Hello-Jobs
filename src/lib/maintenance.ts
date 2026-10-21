import { db } from "./db";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Delete OTP challenges that expired more than `retentionHours` ago.
 * Codes live 5 minutes, so anything older than a day is just dead weight
 * (and a phone-number log we have no reason to keep).
 */
export async function cleanupExpiredOtps(now = new Date(), retentionHours = 24): Promise<number> {
  const cutoff = new Date(now.getTime() - retentionHours * HOUR_MS);
  const result = await db.otpChallenge.deleteMany({ where: { expiresAt: { lt: cutoff } } });
  return result.count;
}
