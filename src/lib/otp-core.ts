import crypto from "node:crypto";
import { getSecret } from "./session";

export function generateCode(): string {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

/** Codes are stored hashed and bound to the phone number. */
export function hashCode(phone: string, code: string): string {
  return crypto.createHmac("sha256", getSecret()).update(`${phone}:${code}`).digest("hex");
}

export function codesMatch(expectedHash: string, phone: string, code: string): boolean {
  const a = Buffer.from(expectedHash);
  const b = Buffer.from(hashCode(phone, code));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
