import type { Config } from '../config.ts';

export interface Finding {
  level: 'ok' | 'warn' | 'error';
  area: string;
  message: string;
}

type Env = Record<string, string | undefined>;

/** Plain-language review of the running configuration. Used by `npm run doctor` and logged at startup. */
export function reviewConfig(config: Config, env: Env = process.env): Finding[] {
  const f: Finding[] = [];
  const add = (level: Finding['level'], area: string, message: string) => f.push({ level, area, message });
  const prod = config.isProd;

  add(config.databaseUrl ? 'ok' : 'error', 'Database', config.databaseUrl ? 'DATABASE_URL is set.' : 'DATABASE_URL is missing. Nothing can be stored.');
  if (prod && config.databaseUrl && !/sslmode=require|ssl=true/i.test(config.databaseUrl) && !/localhost|127\.0\.0\.1/.test(config.databaseUrl)) {
    add('warn', 'Database', 'The connection string has no sslmode=require. Hosted databases such as Neon need it.');
  }

  const secret = env.SESSION_SECRET ?? '';
  add(secret.length >= 32 ? 'ok' : prod ? 'error' : 'warn', 'Security', secret.length >= 32 ? 'SESSION_SECRET is long enough.' : 'SESSION_SECRET must be at least 32 random characters.');

  if (prod) {
    add(config.appUrl ? 'ok' : 'warn', 'Security', config.appUrl ? `APP_URL is ${config.appUrl}.` : 'APP_URL is not set. Set it to your public address so cross-site requests are blocked correctly.');
    if (config.appUrl && !config.appUrl.startsWith('https://')) add('warn', 'Security', 'APP_URL is not https. Login cookies are marked Secure in production and will not work over plain http.');
  }

  const email = (env.ADMIN_BOOTSTRAP_EMAIL ?? '').trim();
  const pw = env.ADMIN_BOOTSTRAP_PASSWORD ?? '';
  add(email && pw ? 'warn' : 'ok', 'Staff', email && pw
    ? 'ADMIN_BOOTSTRAP_PASSWORD is set. After your first sign-in and password change, delete that variable.'
    : 'No bootstrap variables set. That is fine once a Super Admin exists. For the first one set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD.');

  if (config.whatsapp) add('ok', 'Login codes', 'WhatsApp delivery is configured.');
  else if (config.otp.demoMode) add('warn', 'Login codes', `Pilot mode: codes are SHOWN ON SCREEN for ${config.otp.demoAllowlist.length} allow-listed number(s). Turn off before real users.`);
  else if (prod) add('error', 'Login codes', 'No way to send login codes. Set the WHATSAPP_* variables (or the pilot switch for your own number).');
  else add('ok', 'Login codes', 'Development: codes are shown on screen.');
  if (prod && config.otp.demoMode && !config.otp.demoAllowlist.length) add('warn', 'Login codes', 'OTP_DEMO_MODE is on but OTP_DEMO_ALLOWLIST is empty, so it does nothing.');

  if (config.payments.mode === 'razorpay') {
    add('ok', 'Payments', 'Razorpay is configured.');
    if (!config.payments.razorpayWebhookSecret) add('error', 'Payments', 'RAZORPAY_WEBHOOK_SECRET is missing. Paid orders will not be fulfilled if the browser closes early.');
  } else if (config.payments.mode === 'demo') {
    add(prod ? 'warn' : 'ok', 'Payments', prod ? 'PAYMENTS_DEMO_MODE is on: factories get credits without paying. Never use with real customers.' : 'Development: credits are granted without payment.');
  } else {
    add('warn', 'Payments', 'Payments are off. Factories cannot buy credits (welcome credits still work).');
  }

  add(config.cronSecret ? 'ok' : prod ? 'warn' : 'ok', 'Cleanup job', config.cronSecret ? 'CRON_SECRET is set.' : 'CRON_SECRET is not set. The daily cleanup endpoint is disabled, so old login codes and sessions pile up.');
  return f;
}

export function formatFindings(findings: Finding[]): string {
  const icon = { ok: 'OK   ', warn: 'WARN ', error: 'ERROR' } as const;
  return findings.map((x) => `${icon[x.level]} [${x.area}] ${x.message}`).join('\n');
}
