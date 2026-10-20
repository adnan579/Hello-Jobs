import { db } from "./db";
import { codesMatch, generateCode, hashCode } from "./otp-core";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 10 * 60 * 1000;

/**
 * Deliver the OTP. WhatsApp Business / SMS providers plug in here.
 * - development: logs to the server console and the caller may echo it in the UI
 * - production: refuses to run until a real provider is wired in
 */
export async function deliverOtp(phone: string, code: string): Promise<{ devCode?: string }> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[hello-jobs] OTP for ${phone}: ${code}`);
    return { devCode: code };
  }
  throw new Error(
    "No OTP provider configured. Implement deliverOtp() with WhatsApp Business Cloud API or an SMS gateway.",
  );
}

export type SendResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string };

export async function sendOtp(phone: string): Promise<SendResult> {
  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const recent = await db.otpChallenge.count({ where: { phone, createdAt: { gte: since } } });
  if (recent >= MAX_SENDS_PER_WINDOW) {
    return { ok: false, error: "Too many codes requested. Please wait a few minutes and try again." };
  }

  const code = generateCode();
  await db.otpChallenge.create({
    data: { phone, codeHash: hashCode(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  try {
    const { devCode } = await deliverOtp(phone, code);
    return { ok: true, devCode };
  } catch (e) {
    console.error("OTP delivery failed", e);
    return { ok: false, error: "Could not send the code right now. Please try again." };
  }
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

export async function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  const challenge = await db.otpChallenge.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return { ok: false, error: "Code expired. Request a new one." };
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  if (!codesMatch(challenge.codeHash, phone, code)) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Wrong code. Please check and try again." };
  }

  // Single use. updateMany guards against two requests consuming the same code.
  const consumed = await db.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) return { ok: false, error: "Code already used. Request a new one." };
  return { ok: true };
}
