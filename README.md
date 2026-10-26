# Hello Jobs — Direct Hands for Indian Industry

A two-way marketplace for blue and grey-collar manufacturing work in India. Verified factories and ITI / semi-skilled workers find each other directly. No contractor cut. Free for workers. Factories pay for talent-directory credits.

## What works today

| Area | Status |
| --- | --- |
| Worker and factory sign-up with a 6-digit login code | Works. Codes go out over WhatsApp once you connect the Meta WhatsApp Cloud API (see `docs/DEPLOY.md`). No SMS provider is built. |
| Factory verification | A staff member checks the GSTIN on the official GST portal and approves it in the staff console (`/#staff`). The server checks the GSTIN format and checksum. |
| Jobs, applications, shortlist, interview, offer, accept, joined | Works and is covered by API tests and a browser test. Joining needs both the worker and the factory. |
| Talent directory | Verified factories only. Phone numbers are masked until the worker applies or the factory spends a credit. |
| Credits and invoices | Server-owned prices. Razorpay Checkout, signature check and webhook are written but not yet tried against a live Razorpay account. |
| DPDP | Versioned consent, nominee, data export, erasure, grievance, audit log. Needs a lawyer to review the wording. |
| Staff console | Verification queue, fee-complaint handling with pause and resume, worker funnel counts. |
| Not built yet | Skill video upload and storage, pay-per-hire billing, SMS, real NCVT / DigiLocker lookups, native-language review. |

## How it is built

- **Front end:** React 19, Vite, Tailwind. The session is an httpOnly cookie. The browser only holds what the server sends for that person's role (`/api/bootstrap`).
- **Back end:** Express and PostgreSQL (`server/`). Every input is checked with zod. Ownership and role checks are in SQL. Credits and payments are atomic and run once.
- **Security:** hashed login codes with attempt limits, hashed session tokens, origin check on writes, strict content security policy in production, rate limits, append-only audit log.
- **Hosting:** one Express app. `server.ts` runs it on a normal Node host. `api/index.ts` runs the same app as a Vercel function.

Folder map: `server/` (API), `src/` (UI), `server/migrations/` (SQL), `tests/` (API tests), `e2e/` (browser test), `scripts/` (migrate, create admin, local Postgres), `docs/` (guides).

## Run it on your computer

```bash
npm install
npm run db:local          # starts a throwaway PostgreSQL on port 54329 (leave it running)
cp .env.example .env      # then set DATABASE_URL=postgres://hj:hj@localhost:54329/hellojobs_test
                          # and SESSION_SECRET to any 32+ characters, ADMIN_BOOTSTRAP_PHONES to your number
npm run dev               # http://localhost:3000
```

In development the login code is shown on screen. In production it is never shown (see `docs/DEPLOY.md` for the pilot switch).

## Checks

```bash
npm run lint                         # TypeScript
npm run build                        # production build
TEST_DATABASE_URL=postgres://... npm test        # API and security tests (starts its own Postgres if unset)
npx playwright install chromium && npm run e2e   # full browser journey
```

CI (`.github/workflows/ci.yml`) runs all of these on every pull request.

## Go live

Follow `docs/DEPLOY.md`. It is written for someone using only a web browser.
