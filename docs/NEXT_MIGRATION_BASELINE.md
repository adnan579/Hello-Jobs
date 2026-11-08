# Next.js Migration Baseline

## Baseline gates

- `npm run lint`: passed on the branch baseline.
- `npm test`: 14 files and 122 tests pass.
- `npm run e2e`: the journey passes against `next dev` (the test waits for the `html[data-hydrated]` marker, which the app sets once React is attached and the first session check is done).
- `vite-final` rollback tag: exists on GitHub at commit `5942508`, the last Vite-only `main`.

## Behavior to preserve

- API integration tests construct the Express app and send requests through `supertest` (`tests/helpers/app.ts`).
- The user session cookie is `hj_session`, HttpOnly, SameSite=Lax, path `/`, 30-day max age, and Secure in production (`server/auth/session.ts`).
- The session token is hashed in the existing `sessions` table. Do not change the cookie or schema during the page migration.
- The selected language is stored in the `hj_language` cookie; routes stay unprefixed.
- Razorpay webhook validation depends on the raw request bytes (`server/routes/credits.ts`).
- Public job data must use `jobView` without the contact option. HR names, phone numbers, and WhatsApp numbers are private (`server/services/serialize.ts`).
- `tests/api-contract-baseline.test.ts` snapshots all 71 Express method/path routes. Existing route tests remain the status/body contract; `tests/next-api.test.ts` additionally pins adapter body limits, webhook bytes, and session-cookie flags.

## Phase 4 status

The public pages live under `app/(public)` with their own root layout and stylesheet. The staff console lives at `/admin` under `app/(admin)` with a separate root layout and stylesheet; it is not linked from public UI code. The admin response retains `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.

## Deployment shape and Phase 5 pause point

Next.js serves pages and API traffic in the existing Vercel project. A Node route handler adapts web requests to the Express app, preserving its middleware, request parsing, and tests. Local development uses this same route handler. The Vite build and server commands were removed in Phase 7; the `vite-final` tag keeps them.

Phase 5 has not started: all API routes still use the Express adapter. Keep it until the replacement for the in-memory limiter is resolved and each route has equivalent direct-handler contract coverage.