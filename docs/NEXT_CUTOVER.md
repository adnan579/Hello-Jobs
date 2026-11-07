# Next.js cutover checklist (Phase 6)

Everything below is safe to do from a Vercel preview deployment of this branch. Nothing here touches production until you press **Promote**.

## 1. Automatic gates (CI runs these on every push)

| Gate | What it proves |
| --- | --- |
| `npm run lint` | Types are correct |
| `npm run build` | Next.js builds every route |
| Production smoke test (`scripts/preview-check.mjs`) | The production build starts, sends the strict page policy, every page type carries its nonce, visitors see no HR contacts, `/admin` is `noindex` + `no-store`, API headers are present |
| `npm test` | 135+ API, security and native-route parity tests |
| `npm run e2e` | Factory → admin approval → job → worker applies → offer → accept → both confirm joining |

You can run the smoke test against any deployment:

```
npm run preview:check -- https://<your-preview>.vercel.app
```

## 2. Vercel settings to check once

- **Framework Preset**: Next.js (`vercel.json` already says `"framework": "nextjs"`).
- **Install / Build command**: `npm ci` / `npm run build` (set in `vercel.json`; clear any override in the dashboard).
- **Output Directory**: empty. An old `dist` override from the Vite setup must be removed.
- **Node.js version**: 22.x.
- **Region**: `sin1` (set in `vercel.json`).
- **Environment variables**: unchanged from the Vite deployment (`DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, `ADMIN_BOOTSTRAP_*`, WhatsApp and Razorpay settings, `CRON_SECRET`). Run `NODE_ENV=production npm run doctor` with the same values to see what the app thinks of them.
- **Cron**: `/api/cron/cleanup` appears under Settings → Cron Jobs after the deploy.

## 3. Click-through on the preview (10 minutes)

The smoke test cannot sign in, so do these by hand, once, on the preview URL. Open the browser console in each step and look for red "Content Security Policy" errors.

1. Visitor: `/`, `/about`, `/jobs`, `/employers`; open a job. No HR phone or WhatsApp number anywhere.
2. Register and sign in as a **worker** (WhatsApp code). Reload the page: you stay signed in. Apply to a job.
3. Register and sign in as a **factory**. Post a job. Open Dashboard.
4. `/admin`: the staff sign-in loads (not stuck on "Loading…"), sign in, approve the factory.
5. Pay flow (if Razorpay is on): the checkout window opens (needs `checkout.razorpay.com` in the page policy, already allowed).
6. `/sitemap.xml` and `/robots.txt` open.

## 4. Cutover

1. Merge the PR into `main`. Vercel builds production from `main`.
2. When the production deployment is ready, run `npm run preview:check -- https://<production domain>`.
3. Repeat step 3 above on the production domain, quickly.
4. Watch Vercel → Logs for 30 minutes. API calls log one JSON line each (method, path, status, milliseconds).

## 5. Rollback

- **Fastest**: Vercel → Deployments → pick the last deployment from before the merge → **Promote to Production**. No code change, takes seconds.
- **From git**: the last Vite + Express build is commit `5942508` (create the `vite-final` tag there from GitHub → Releases). Revert the merge commit on `main`.
- The database is the same in both versions. This migration adds no tables or columns, so rolling back needs no data change.

## 6. What still goes through Express (Phase 5 is partly done)

Native Next.js routes: `GET /api/health`, `GET /api/bootstrap`, `POST /api/jobs`, `PUT /api/jobs/:id`. Everything else is served by the Express app through `app/api/[...path]/route.ts`, with identical behaviour. Port the rest one router at a time using `server/next/native.ts` and add a parity block to `tests/native-routes.test.ts` for each. Port login last. Delete `server.ts`, `vite.config.ts`, `index.html` and `admin.html` in Phase 7 once every route is native and production has been stable for a while.

## 7. Known differences from the Vite build

- API responses now carry the headers in `server/lib/security-headers.ts` instead of `helmet`'s defaults; page headers come from `proxy.ts`.
- The per-IP request limit (600 per minute) is counted in the database (`throttles` table) instead of in memory, so it is shared across serverless instances. If the database is unreachable the limiter lets the request through.
