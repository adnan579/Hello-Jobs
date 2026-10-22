# Deploying Hello Jobs for testing

Goal: a private URL you can open on a real phone, backed by a real database.
Stack: **Vercel** (the Next.js app) + **Neon** (managed PostgreSQL). Both have free plans; check their
current limits and terms before relying on them (Vercel's Hobby plan is for personal, non-commercial use).

> **Region matters.** Vercel Functions default to Washington, D.C. Neon has **no Mumbai region**
> (nearest: Singapore `aws-ap-southeast-1`). `vercel.json` therefore pins the functions to Singapore
> (`sin1`) so the app and database sit side by side. If you pick a different database region, change
> `regions` in `vercel.json` to match.

## 1. Create the database (Neon)

1. Create a Neon project. Region: **AWS Asia Pacific (Singapore)**.
2. From the connection details copy **two** strings:
   - **Pooled** (host contains `-pooler`): used by the running app.
   - **Direct** (no `-pooler`): used for migrations and admin scripts. Prisma's migration commands need it.

## 2. Create the tables

### Option A: from the GitHub website (nothing to install, recommended)

1. In GitHub open the repo → **Settings → Secrets and variables → Actions → New repository secret**.
   Name: `DATABASE_URL_DIRECT`. Value: the **direct** connection string from step 1 (paste it exactly, no quotes).
2. Open the repo's **Actions** tab → **Database tasks** (left list) → **Run workflow** → task **migrate** → **Run workflow**.
   After a minute or two a green tick means the tables exist. A red cross means something is wrong: click the run
   to read the error message (see Troubleshooting).
3. Optional demo data (fake factories, jobs and workers, so the job feed is not empty): run **Database tasks** again
   with task **seed-demo-data**.

The seeded accounts use obviously fake numbers (`90000 00001` etc.). They can only log in if you put them on the
allowlist in step 4. Do not seed a database that holds real people's data.

### Option B: from your own computer

You need [Node.js 22](https://nodejs.org) and [Git](https://git-scm.com). In a terminal:

```bash
git clone https://github.com/adnan579/Hello-Jobs.git
cd Hello-Jobs
npm install
DATABASE_URL="<DIRECT connection string>" npm run db:deploy
DATABASE_URL="<DIRECT connection string>" npm run db:seed     # optional demo data
```

On Windows PowerShell, set the variable first: `$env:DATABASE_URL="<DIRECT connection string>"`, then run the `npm run` command on its own line.

## 3. Deploy the app (Vercel)

1. In Vercel choose **Add New → Project** and import `adnan579/Hello-Jobs`. Keep the detected Next.js defaults.
2. Add these **Environment Variables** (Production and Preview):

| Name | Value |
| :--- | :--- |
| `DATABASE_URL` | The **pooled** string (host contains `-pooler`) with `&pgbouncer=true&connect_timeout=15` added at the very end. If it contains `channel_binding=require`, delete that part. |
| `SESSION_SECRET` | 40+ random characters from a password generator (or `openssl rand -base64 48` in a terminal). Letters and digits only is fine. The app refuses to start without it. |
| `CRON_SECRET` | 20+ random characters from a password generator (or `openssl rand -base64 32`). Needed for the daily cleanup job. |
| `OTP_DEMO_MODE` | `true` (private test mode, see step 4) |
| `OTP_DEMO_ALLOWLIST` | Comma-separated mobile numbers allowed to log in, e.g. `98765 43210, 99887 76655` |

3. Click **Deploy**. Environment variable changes only apply to **new** deployments, so redeploy after editing them.

## 4. Logging in on the test site

A deployed build refuses to send OTPs until a real provider exists, so the test site uses a **private test
mode**: with `OTP_DEMO_MODE=true`, the login screen shows the code on screen, but **only for numbers on
`OTP_DEMO_ALLOWLIST`**. Any other number gets "This is a private test site".

Security consequences, plainly:

- Anyone who can type an allowlisted number can log in as that number. Put only testers' numbers on the list and
  share the URL only with them.
- Never put a number on the list that belongs to someone whose account you would not want others to access.
- Turn the mode off (`OTP_DEMO_MODE` empty) and wire in WhatsApp/SMS before any real users.

Create your admin account (the person who approves factories) and add the same number to the allowlist:

- **From GitHub:** Actions → **Database tasks** → Run workflow → task **create-admin** → type the mobile number in the box → Run.
- **From your computer:** `DATABASE_URL="<DIRECT connection string>" npm run admin:create -- 98765 43210`

Then log in on the site with that number (choose either option; an admin goes to `/admin/employers`).
It will not convert a number that is already a worker or factory.

## 5. Smoke test on a phone

- [ ] Home page loads, header does not overflow.
- [ ] Worker: log in, build a Trade Card, browse `/jobs`, open a job, apply.
- [ ] Factory (second number): register with a GSTIN, post a job.
- [ ] Admin: approve the factory at `/admin/employers`.
- [ ] Factory: open Hunt talent, invite the worker. Worker sees it under "Factories that want you".
- [ ] Worker: **Delete my data** works and logs you out.

## 6. Daily cleanup job

`vercel.json` schedules `GET /api/cron/cleanup` once a day (about 03:00 IST). On Vercel's Hobby plan cron jobs
can run once per day at most and may fire anywhere within the scheduled hour. Vercel sends
`Authorization: Bearer $CRON_SECRET` automatically; without `CRON_SECRET` the endpoint answers 503.

## 7. Changing the database later

1. Create and test the migration locally (`npm run db:migrate -- --name what_changed`) and merge it. CI checks it.
2. Apply it to the hosted database **before** (or together with) deploying the code that needs it: run
   **Database tasks → migrate** on GitHub, or `DATABASE_URL="<DIRECT string>" npm run db:deploy` from your computer.

## Troubleshooting

| Symptom | Likely cause and fix |
| :--- | :--- |
| Database tasks run says "Missing secret" | Add the repository secret `DATABASE_URL_DIRECT` (step 2, Option A). |
| Database tasks run says "Cannot reach the database" | Use the **direct** string (no `-pooler` in the host name), pasted without quotes or spaces. If it contains `channel_binding=require`, delete that part (the app does not need it; I have not tested it with Prisma). |
| Build fails with a Prisma error | `npm install` runs `prisma generate` automatically. Make sure the install step was not skipped or cached oddly (redeploy with "clear build cache"). |
| App error mentioning `SESSION_SECRET` | Missing or shorter than 32 characters. Set it and redeploy. |
| "Can't reach database server" right after idle | Neon wakes a sleeping database on the first request. Keep `connect_timeout=15` on the URL and retry. |
| Errors about prepared statements | Make sure `pgbouncer=true` is on the pooled URL. As a fallback for testing, use the **direct** string as `DATABASE_URL`. |
| Login says "private test site" | The number is not on `OTP_DEMO_ALLOWLIST`, or you changed it and did not redeploy. |
| Login says "cannot be sent yet" | `OTP_DEMO_MODE` is not exactly `true`, or it was not set for that environment. |
| Cron returns 503 | `CRON_SECRET` is not set. |
| Pages feel slow | Check that the Vercel function region and the Neon region are both Singapore. |

## Before real users

1. Wire a real OTP provider into `deliverOtp()` in `src/lib/otp.ts` (WhatsApp Business Cloud API or an SMS gateway; both need onboarding or registration that can take days) and unset `OTP_DEMO_MODE`.
2. Use a separate production database and secrets. Do not reuse the test ones.
3. Get legal advice on the DPDP Act, Aadhaar handling and contract-labour rules.
