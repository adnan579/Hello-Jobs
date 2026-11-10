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
  it('asks for error monitoring and a cleanup heartbeat in production, and rejects a malformed Sentry address', () => {
    const missing = levels(base).filter((x) => x.level === 'warn').map((x) => `${x.area}:${x.message.split(' ')[0]}`);
    expect(missing).toEqual(expect.arrayContaining(['Monitoring:SENTRY_DSN', 'Cleanup job:CRON_HEARTBEAT_URL']));
    const bad = levels({ ...base, SENTRY_DSN: 'oops' }).find((x) => x.area === 'Monitoring');
    expect(bad?.level).toBe('warn');
    expect(bad?.message).toMatch(/not a valid/);
    expect(levels({ NODE_ENV: 'development' }).filter((x) => x.area === 'Monitoring')[0]!.level).toBe('ok');
  });
  it('is quiet when everything is set', () => {
    const f = levels({ ...base, ADMIN_2FA_KEY: 'k'.repeat(32), WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '1', WHATSAPP_OTP_TEMPLATE: 'otp', RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's', RAZORPAY_WEBHOOK_SECRET: 'w', ADMIN_BOOTSTRAP_PHONES: '9000000001', SENTRY_DSN: 'https://k@o1.ingest.sentry.io/1', CRON_HEARTBEAT_URL: 'https://hc-ping.com/x' });
    expect(f.filter((x) => x.level !== 'ok')).toEqual([]);
  });
});
