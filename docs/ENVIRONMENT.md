# Environments and settings

Hello Jobs needs three things to run: a PostgreSQL database, a place to run one Node app, and a few settings. Run `npm run doctor` (with the same settings) any time. It tells you in plain words what is missing or unsafe. The server also prints the same warnings when it starts in production.

## Three environments

| | Local (your computer) | Preview / test | Production (real users) |
| --- | --- | --- | --- |
| Database | Throwaway Postgres from `npm run db:local` | A separate Neon branch or project | Its own Neon project with backups on |
| Login codes | Shown on screen | Shown on screen only for allow-listed numbers | WhatsApp only |
| Payments | Credits free (demo) | Razorpay **test** keys | Razorpay **live** keys |
| `NODE_ENV` | development | production | production |

Never point preview at the production database. Never reuse `SESSION_SECRET` between environments.

## Settings

**Must have in production**

| Setting | What to put | If missing |
| --- | --- | --- |
| `DATABASE_URL` | Neon connection string ending `?sslmode=require` | The site shows "starting up or misconfigured" |
| `SESSION_SECRET` | 48+ random characters, kept secret | Server refuses to start |
| `APP_URL` | `https://your-domain` | Cross-site protection is looser; cookies and links can break |
| `ADMIN_BOOTSTRAP_EMAIL` + `ADMIN_BOOTSTRAP_PASSWORD` | Your email and a temporary 12+ character password. Delete the password after first sign-in | Nobody can reach `/admin` until a Super Admin exists |
| `ADMIN_2FA_KEY` (optional) | Long random text that encrypts staff authenticator secrets. Defaults to `SESSION_SECRET`. Do not change after staff enrol | Changing it forces everyone to re-enrol |

**Login codes (WhatsApp)**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`, optional `WHATSAPP_OTP_LANGUAGE`, `WHATSAPP_API_VERSION`. Without them production cannot send codes.

**Payments**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. All three together. The webhook URL is `/api/webhooks/razorpay`.

**Housekeeping**: `CRON_SECRET` (any long random text). Vercel Cron calls `/api/cron/cleanup` daily with it.

**Public contact details** (shown on the site): `VITE_GRIEVANCE_OFFICER_NAME`, `VITE_GRIEVANCE_EMAIL`, `VITE_HELPLINE`, `VITE_COMPANY_ADDRESS`. These are baked in at build time, so redeploy after changing them.

**Pilot switches (for a closed trial only)**: `OTP_DEMO_MODE=true` with `OTP_DEMO_ALLOWLIST=numbers` shows the login code on screen for those numbers. `PAYMENTS_DEMO_MODE=true` gives credits without payment. Remove both before real users or real money.

**Optional**: `AUTO_MIGRATE=false` if you prefer to run `npm run db:migrate` yourself. `OTP_ECHO=false` hides codes in development.

## Keeping it smooth

- **Database:** use a pooled connection string on Vercel (Neon's "pooled connection"). Turn on Neon's point-in-time restore. Check storage monthly.
- **Region:** keep Vercel (`sin1` is set) and Neon in the same region (Singapore) to keep requests fast.
- **Health check:** `GET /api/health` returns `{"ok":true}` when the database answers. Point a free uptime monitor (UptimeRobot) at it.
- **Logs:** production writes one JSON line per API call (method, path, status, milliseconds). No phone numbers or bodies. Read them in Vercel → Logs.
- **Secrets:** change `SESSION_SECRET` only when you want everyone logged out. Rotate WhatsApp and Razorpay tokens if they ever leak.
- **After every deploy:** open `/api/health`, then sign in at `/admin`.
- **Backups:** Neon keeps history. Also export the audit log monthly if your lawyer asks for it.
