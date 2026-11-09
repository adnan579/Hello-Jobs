<p align="center"><img src="public/logo.svg" alt="Shramkart: Direct Hands for Indian Industry" width="180"></p>

# Shramkart — Direct Hands for Indian Industry

A two-way marketplace for blue and grey-collar manufacturing work in India. Verified factories and ITI / semi-skilled workers find each other directly. No contractor cut. Free for workers. Factories pay for talent-directory credits.

## What works today

| Area | Status |
| --- | --- |
| Worker and factory sign-up with a 6-digit login code | Works. Codes go out over WhatsApp once you connect the Meta WhatsApp Cloud API (see `docs/DEPLOY.md`). No SMS provider is built. |
| Factory verification | A staff member checks the GSTIN on the official GST portal and approves it in the staff console (`/admin`, password + authenticator app). The server checks the GSTIN format and checksum. |
| Jobs, applications, shortlist, interview, offer, accept, joined | Works and is covered by API tests and a browser test. Joining needs both the worker and the factory. |
| Talent directory | Verified factories only. Phone numbers are masked until the worker applies or the factory spends a credit. |
| Credits and invoices | Server-owned prices. Razorpay Checkout, signature check and webhook are written but not yet tried against a live Razorpay account. |
| DPDP | Versioned consent, nominee, data export, erasure, grievance, audit log. Needs a lawyer to review the wording. |
| Staff console | Verification queue, fee-complaint handling with pause and resume, worker funnel counts. |
| Not built yet | Skill video upload and storage, pay-per-hire billing, SMS, real NCVT / DigiLocker lookups, native-language review. |

## How it is built

- **Front end:** React 19, Next.js App Router, and Tailwind. The main screen UI is one client component (`src/App.tsx`) mounted by the catch-all page; the job pages, `/employers`, `/about`, the sitemap and the staff console are native routes. The session is an httpOnly cookie; the browser only holds what the server sends for that person's role (`/api/bootstrap`).
- **Back end:** Express and PostgreSQL (`server/`). Every input is checked with zod. Ownership and role checks are in SQL. Credits and payments are atomic and run once.
- **Security:** hashed login codes with attempt limits, hashed session tokens, origin check on writes, strict content security policy in production, rate limits, append-only audit log.
- **Hosting:** one Vercel deployment. Next.js builds and serves everything (there is no separate front-end build). `GET /api/health`, `GET /api/bootstrap`, `POST /api/jobs` and `PUT /api/jobs/:id` are native Next.js route handlers; every other `/api` route is the Express app, mounted through `app/api/[...path]/route.ts`.

Brand files are in `public/`: `logo.svg` (full badge with tagline), `icon.svg` (badge without the tagline, used in the app and as the favicon), and the PNG, ICO and maskable versions for browsers, phones and installed web apps.

Folder map: `app/` (Next.js pages, staff console and route handlers), `proxy.ts` (page security headers), `instrumentation.ts` (error reporting), `server/` (API), `src/` (UI components, data, helpers), `server/migrations/` (SQL), `tests/` (API tests), `e2e/` (browser tests), `scripts/` (migrate, create admin, local Postgres, lint, smoke test), `docs/` (guides).

## Run it on your computer

```bash
npm install
npm run db:local          # starts a throwaway PostgreSQL on port 54329 (leave it running)
cp .env.example .env      # then set DATABASE_URL=postgres://hj:hj@localhost:54329/hellojobs_test
                          # and SESSION_SECRET to any 32+ characters, ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD for your first admin
npm run dev               # Next.js pages and API on http://localhost:3000
```

In development the login code is shown on screen. In production it is never shown (see `docs/DEPLOY.md` for the pilot switch).

## Checks

```bash
npm run lint                         # TypeScript (strict) + Biome; warnings may not increase
npm run build                        # Next.js production build
TEST_DATABASE_URL=postgres://... npm test        # API and security tests (Vitest; starts its own Postgres if unset)
npx playwright install chromium && npm run e2e   # full browser journey
```

CI (`.github/workflows/ci.yml`) runs all of these on every pull request, plus a smoke test of the production build (`npm run preview:check`). The app is built, served and tested through Next.js only. Vitest, the test runner, needs the `vite` package as a required peer, so it stays as a dev dependency; nothing is built or served with it.

## Go live

Follow `docs/DEPLOY.md`. It is written for someone using only a web browser.
