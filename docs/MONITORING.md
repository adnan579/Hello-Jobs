# Monitoring and alerts

Three small things, all set up in a browser, none needing a terminal. Do them in this order.

| What you want to know | Tool | Setting in Vercel | Cost |
|---|---|---|---|
| "The site or its database is down" | Uptime monitor on `/api/health` | none | free tiers exist |
| "Something threw an error for a user" | Sentry (or a log drain) | `SENTRY_DSN` | free tier exists |
| "The daily cleanup failed or did not run" | Heartbeat monitor | `CRON_HEARTBEAT_URL` | free tiers exist |

After you add or change a setting in Vercel (Project, Settings, Environment Variables), redeploy so it takes effect.

## 1. Uptime monitor on `/api/health`

`GET https://YOUR-DOMAIN/api/health` answers `200 {"ok":true}` when the app can reach the database. It answers `503` when the database or start-up step is failing, and the body names the step (config, database or migrations) without any secrets.

1. Create a free account with UptimeRobot, Better Stack or any similar service.
2. Add a new **HTTP(s) monitor** for `https://YOUR-DOMAIN/api/health`, checked every 1 to 5 minutes.
3. Alert when the status is anything other than `200`. If the service offers a keyword check, use the keyword `"ok":true`.
4. Add your email or phone as the alert contact.

This one check also catches a bad deploy, an expired database password and a paused Neon database.

## 2. Error reports (Sentry)

Every server error is written to the Vercel logs as one JSON line with `"level":"error"`. That alone works with a log drain (section 4). Setting `SENTRY_DSN` also sends each error to Sentry, which emails you.

1. Create a project at sentry.io. Choose the platform **Node.js**.
2. Copy the DSN. It looks like `https://KEY@oNNN.ingest.sentry.io/PROJECT_ID`.
3. In Vercel, add `SENTRY_DSN` with that value to the Production environment, then redeploy.
4. In Sentry, check **Alerts**. The default rule emails you on a new issue. Add a rule for "issue seen more than N times in an hour" if you want to hear about repeats.

What is sent: error type, message and stack, the method, the path without query string (long numbers such as phone numbers are replaced), the status, the release (the first 12 characters of the git commit) and the environment. Database addresses and tokens in messages are removed. Request bodies, cookies and headers are never sent.

What is covered: API errors (both the Express routes and the native Next.js routes), start-up failures (tagged with `stage`: config, database or migrations), and errors Next.js catches while rendering a page.

Limits you should know about:
- It is a light reporter, not the full Sentry SDK. There are no breadcrumbs, no performance data and no source maps, so stack traces show the built file names.
- It does not see errors that happen inside the visitor's browser. Adding that needs the Sentry browser SDK and a `connect-src` entry in the security policy in `proxy.ts`.
- To protect your Sentry quota, each distinct error is sent at most once a minute, and at most 20 events a minute per server instance. The log line is always written, so nothing is lost from the logs.
- Reporting waits at most 2 seconds, and never makes a failing request fail differently.

Without `SENTRY_DSN` the server logs a warning at start-up in production. That warning goes away once the DSN is valid.

## 3. Alert if the daily cleanup fails (or never runs)

The cleanup runs once a day from Vercel Cron (`/api/cron/cleanup`, 21:30 UTC, which is 03:00 IST). Two things can go wrong: it can fail, or Vercel can fail to call it. Both are covered by a heartbeat monitor, which alerts when its ping stops arriving.

1. Create a free check at Healthchecks.io (or a heartbeat monitor at Better Stack).
2. Set the expected period to **1 day** and the grace time to **2 to 3 hours**.
3. Copy the ping URL, for example `https://hc-ping.com/YOUR-UUID`.
4. In Vercel, add `CRON_HEARTBEAT_URL` with that URL, then redeploy.
5. Add your email as the alert contact in the monitor.

The app pings the URL only after the cleanup finished successfully. If the cleanup throws, there is no ping, the route answers `500` (Vercel shows the run as failed) and, with Sentry configured, an error report is sent with the path `/api/cron/cleanup`. The cron response shows `"heartbeat": true` when the ping was accepted.

Vercel's own Observability alerts for failed cron runs are a good extra if your plan includes them.

## 4. Log drain (optional)

If you would rather alert from logs, send Vercel logs to a service such as Better Stack, Axiom or Datadog (Vercel dashboard, Team Settings, Log Drains, which depends on your plan). Then alert on lines that contain `"level":"error"`. Each line has these fields:

```json
{"level":"error","t":"2026-11-08T10:00:00.000Z","where":"api","m":"GET","p":"/api/bootstrap","s":500,"name":"Error","msg":"…","stack":"…"}
```

`where` is `api`, `startup` or `next`. Every API request in production also logs `{"t","m","p","s","ms"}`, which is enough to chart error rate and slow requests.

## Checklist

- [ ] Uptime monitor on `/api/health` with an alert contact
- [ ] `SENTRY_DSN` set and redeployed
- [ ] `CRON_HEARTBEAT_URL` set and redeployed, grace time 2 to 3 hours
- [ ] Someone reads the alert email (a shared address is better than one person)
