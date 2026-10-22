import { normalizeIndianPhone } from "./phone";

/**
 * How a login code reaches the person. Decided per request from the environment.
 *
 * - dev-echo:         local development / tests. The code is shown on screen.
 * - demo-echo:        a deployed PRIVATE test site (OTP_DEMO_MODE=true) and the number is on
 *                     OTP_DEMO_ALLOWLIST. The code is shown on screen.
 * - demo-blocked:     OTP_DEMO_MODE=true but the number is not on the allowlist. Refused.
 * - provider-missing: a deployed site with no way to deliver codes. Refused.
 *
 * Showing the code on screen means anyone who can type an allowlisted number can log in as it,
 * so the allowlist must only contain numbers you are happy to expose that way.
 */
export type OtpPolicy =
  | { kind: "dev-echo" }
  | { kind: "demo-echo" }
  | { kind: "demo-blocked" }
  | { kind: "provider-missing" };

type Env = Record<string, string | undefined>;

/** Comma, semicolon or newline separated phone numbers in any common Indian format. */
export function parseAllowlist(raw: string | undefined): Set<string> {
  const out = new Set<string>();
  for (const part of (raw ?? "").split(/[,;\n]+/)) {
    const phone = normalizeIndianPhone(part);
    if (phone) out.add(phone);
  }
  return out;
}

export function getOtpPolicy(phone: string, env: Env = process.env): OtpPolicy {
  if (env.NODE_ENV !== "production") return { kind: "dev-echo" };
  // Strict on purpose: only the exact string "true" switches the demo mode on.
  if (env.OTP_DEMO_MODE === "true") {
    return parseAllowlist(env.OTP_DEMO_ALLOWLIST).has(phone) ? { kind: "demo-echo" } : { kind: "demo-blocked" };
  }
  return { kind: "provider-missing" };
}
