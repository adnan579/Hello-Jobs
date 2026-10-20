import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "hj_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = "WORKER" | "EMPLOYER" | "ADMIN";
export type Session = { userId: string; role: SessionRole };

export function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ characters) in production");
  }
  return "dev-only-secret-do-not-use-in-production-0000";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/** Signed, tamper-evident token: base64url(payload).signature */
export function signToken(session: Session, now = Date.now()): string {
  const payload = b64url(JSON.stringify({ ...session, exp: now + MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${hmac(payload)}`;
}

export function verifyToken(token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = hmac(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < now) return null;
    if (typeof data.userId !== "string") return null;
    if (!["WORKER", "EMPLOYER", "ADMIN"].includes(data.role)) return null;
    return { userId: data.userId, role: data.role };
  } catch {
    return null;
  }
}

export async function createSession(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, signToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE_NAME)?.value);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
