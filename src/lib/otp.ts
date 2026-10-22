import { db } from "./db";
import { codesMatch, generateCode, hashCode } from "./otp-core";
import { getOtpPolicy, type OtpPolicy } from "./otp-config";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 10 * 60 * 1000;

/**
 * Deliver the OTP. A WhatsApp Business / SMS provider plugs in here.
 * Today only the on-screen modes exist (see otp-config.ts); a deployed site with
 * neither a provider nor the private test mode refuses to send codes.
 */
export async function deliverOtp(phone: string, code: string, policy: OtpPolicy): Promise<{ devCode?: string }> {
  switch (policy.kind) {
    case "dev-echo":
      console.log(`[hello-jobs] OTP for ${phone}: ${code}`);
      return { devCode: code };
    case "demo-echo":
      return { devCode: code };
    default:
      throw new Error(
        "No OTP provider configured. Implement deliverOtp() with the WhatsApp Business Cloud API or an SMS gateway.",
      );
  }
}

export type SendResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string };

export async function sendOtp(phone: string): Promise<SendResult> {
  // Decide first: refused numbers must not create rows or use up rate-limit budget.
  const policy = getOtpPolicy(phone);
  if (policy.kind === "demo-blocked") {
    return { ok: false, error: "This is a private test site. Your number is not on the invite list yet." };
  }
  if (policy.kind === "provider-missing") {
    console.error(
      "[hello-jobs] Cannot send login codes: no OTP provider is configured. Set OTP_DEMO_MODE=true with OTP_DEMO_ALLOWLIST for a private test site, or implement deliverOtp().",
    );
    return { ok: false, error: "Login codes cannot be sent yet because this site has no SMS or WhatsApp provider set up." };
  }

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
    const { devCode } = await deliverOtp(phone, code, policy);
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
