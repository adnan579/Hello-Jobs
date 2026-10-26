import type { Config } from '../config.ts';
import { normalizeIndianPhone } from '../lib/phone.ts';

/**
 * How a login code reaches the person.
 *  - dev-echo:   development/tests. Code is returned in the API response.
 *  - demo-echo:  production, OTP_DEMO_MODE=true and the number is on OTP_DEMO_ALLOWLIST. Code is shown on screen.
 *  - whatsapp:   code is sent through the WhatsApp Business Cloud API. Never returned to the browser.
 *  - blocked:    nothing can deliver a code; the request is refused.
 */
export type OtpPolicy =
  | { kind: 'dev-echo' }
  | { kind: 'demo-echo' }
  | { kind: 'whatsapp' }
  | { kind: 'blocked'; reason: 'demo-not-invited' | 'no-provider' };

export function getOtpPolicy(phone: string, config: Config): OtpPolicy {
  if (!config.isProd) {
    if (config.otp.echoInDev) return { kind: 'dev-echo' };
    return config.whatsapp ? { kind: 'whatsapp' } : { kind: 'blocked', reason: 'no-provider' };
  }
  if (config.otp.demoMode) {
    const allow = new Set(config.otp.demoAllowlist.map((p) => normalizeIndianPhone(p)).filter(Boolean));
    if (allow.has(phone)) return { kind: 'demo-echo' };
  }
  if (config.whatsapp) return { kind: 'whatsapp' };
  return { kind: 'blocked', reason: config.otp.demoMode ? 'demo-not-invited' : 'no-provider' };
}
