# Next.js Migration Baseline

## Baseline gates

- `npm run lint`: passed on the branch baseline.
- `npm test`: 11 files and 114 tests passed.
- `npm run e2e`: not completed in this container because Chromium cannot load `libatk-1.0.so.0`; CI installs browser system dependencies before running it.

## Behavior to preserve

- API integration tests construct the Express app and send requests through `supertest` (`tests/helpers/app.ts`).
- The user session cookie is `hj_session`, HttpOnly, SameSite=Lax, path `/`, 30-day max age, and Secure in production (`server/auth/session.ts`).
- The session token is hashed in the existing `sessions` table. Do not change the cookie or schema during the page migration.
- The selected language is stored in the `hj_language` cookie; routes stay unprefixed.
- Razorpay webhook validation depends on the raw request bytes (`server/routes/credits.ts`).
- Public job data must use `jobView` without the contact option. HR names, phone numbers, and WhatsApp numbers are private (`server/services/serialize.ts`).
- `tests/api-contract-baseline.test.ts` snapshots all 71 Express method/path routes. Existing route tests remain the status/body contract; `tests/next-api.test.ts` additionally pins adapter body limits, webhook bytes, and session-cookie flags.

## Deployment shape for this branch

Next.js serves pages and API traffic in the existing Vercel project. A Node route handler adapts web requests to the Express app, preserving its middleware, request parsing, and tests. Local development uses this same route handler. The Vite build and server commands remain available for rollback.