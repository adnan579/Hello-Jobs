import { describe, expect, it } from 'vitest';
import { loadConfig } from '../server/config.ts';
import { reviewConfig } from '../server/lib/doctor.ts';

const base = { NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@db.example.com/x?sslmode=require', SESSION_SECRET: 'x'.repeat(40), APP_URL: 'https://hellojobs.in', CRON_SECRET: 'c' };
const levels = (env: Record<string, string>) => reviewConfig(loadConfig(env), env);

describe('configuration review', () => {
  it('flags a production site that cannot send login codes', () => {
    const f = levels(base);
    expect(f.some((x) => x.level === 'error' && x.area === 'Login codes')).toBe(true);
  });
  it('warns loudly about pilot switches', () => {
    const f = levels({ ...base, OTP_DEMO_MODE: 'true', OTP_DEMO_ALLOWLIST: '9811122233', PAYMENTS_DEMO_MODE: 'true' });
    expect(f.filter((x) => x.level === 'warn').map((x) => x.area)).toEqual(expect.arrayContaining(['Login codes', 'Payments']));
  });
  it('requires a webhook secret with Razorpay', () => {
    const f = levels({ ...base, RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's' });
    expect(f.some((x) => x.level === 'error' && x.area === 'Payments')).toBe(true);
  });
  it('is quiet when everything is set', () => {
    const f = levels({ ...base, WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '1', WHATSAPP_OTP_TEMPLATE: 'otp', RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's', RAZORPAY_WEBHOOK_SECRET: 'w', ADMIN_BOOTSTRAP_PHONES: '9000000001' });
    expect(f.filter((x) => x.level !== 'ok')).toEqual([]);
  });
});
