export interface Config {
  nodeEnv: string;
  isProd: boolean;
  databaseUrl: string;
  sessionSecret: string;
  appUrl?: string;
  otp: {
    demoMode: boolean;
    demoAllowlist: string[];
    /** Dev/test only: return the code in the API response. Never honoured in production. */
    echoInDev: boolean;
  };
  whatsapp?: {
    token: string;
    phoneNumberId: string;
    otpTemplate: string;
    language: string;
    apiVersion: string;
  };
  payments: {
    mode: 'razorpay' | 'demo' | 'off';
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    razorpayWebhookSecret?: string;
  };
  cronSecret?: string;
  admin: {
    /** Key material for encrypting authenticator secrets. */
    totpKey: string;
    bootstrapEmail?: string;
    bootstrapPassword?: string;
    bootstrapReset: boolean;
  };
}

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env): Config {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  const sessionSecret = env.SESSION_SECRET || '';
  if (isProd && sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random string of 32+ characters in production');
  }
  const databaseUrl = env.DATABASE_URL || '';
  if (isProd && !databaseUrl) {
    throw new Error('DATABASE_URL must be set in production');
  }

  const whatsapp =
    env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_OTP_TEMPLATE
      ? {
          token: env.WHATSAPP_TOKEN,
          phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
          otpTemplate: env.WHATSAPP_OTP_TEMPLATE,
          language: env.WHATSAPP_OTP_LANGUAGE || 'en',
          apiVersion: env.WHATSAPP_API_VERSION || 'v21.0',
        }
      : undefined;

  const rzp = env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET;
  let paymentsMode: Config['payments']['mode'] = 'off';
  if (rzp) paymentsMode = 'razorpay';
  // Free credits without payment are only ever possible outside production, or on an explicitly flagged demo site.
  else if (!isProd || env.PAYMENTS_DEMO_MODE === 'true') paymentsMode = 'demo';

  return {
    nodeEnv,
    isProd,
    databaseUrl,
    sessionSecret: sessionSecret || 'dev-only-secret-do-not-use-in-production-0000',
    appUrl: env.APP_URL,
    otp: {
      demoMode: env.OTP_DEMO_MODE === 'true',
      demoAllowlist: (env.OTP_DEMO_ALLOWLIST || '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
      echoInDev: env.OTP_ECHO !== 'false',
    },
    whatsapp,
    payments: {
      mode: paymentsMode,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
      razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    },
    cronSecret: env.CRON_SECRET,
    admin: {
      totpKey: env.ADMIN_2FA_KEY || sessionSecret || 'dev-only-secret-do-not-use-in-production-0000',
      bootstrapEmail: env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() || undefined,
      bootstrapPassword: env.ADMIN_BOOTSTRAP_PASSWORD || undefined,
      bootstrapReset: env.ADMIN_BOOTSTRAP_RESET === 'true',
    },
  };
}
