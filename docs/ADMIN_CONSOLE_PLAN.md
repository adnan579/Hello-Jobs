# Admin console: research and plan

## Why
Staff need one place to run Hello Jobs: verify factories, keep scams out, support users, watch money, answer privacy requests, and see who did what. Today the staff screen is hidden behind a `#staff` link on the public site and signs in with a WhatsApp code. That is not good enough for the people who hold the keys to everyone's data.

## What the research says
Sources: [LowCode Agency, admin panel design for marketplaces](https://www.lowcode.agency/blog/admin-panel-design-for-marketplace-platforms); [auth security checklist (knowledgelib)](https://knowledgelib.io/software/security/auth-security-checklist/2026.md); OWASP guidance it summarises.

Marketplace admin panels need nine things: user management, onboarding/vendor management, moderation queues, disputes with SLA timers and required notes, payments controls, analytics and export, editable settings, a searchable audit log, and role-based access with MFA and session timeouts.

Admin sign-in should have: strong password hashing, per-account lockout (not only per IP), MFA for every admin, idle timeout 15-30 min and absolute timeout 8-24 h, new session id on login, generic error messages, `HttpOnly` + `Secure` + `SameSite` cookies, and a minimum password length of 12-15.

## Decisions
1. **Own URL, own app.** The console lives at `/admin` and is a separate page with a separate JavaScript bundle. The public site no longer contains any admin code, link, tab or `#staff` shortcut. The page is `noindex` and sends `no-store`.
2. **Credentials, not phone codes.** Email + password, then a 6-digit authenticator-app code (TOTP). Passwords are hashed with scrypt. Minimum 12 characters, not allowed to contain the email. Authenticator setup is forced at first sign-in, so there is no admin without a second factor.
3. **Lockout.** 5 wrong passwords lock that account for 15 minutes (doubling on repeats up to 1 hour). 20 attempts per IP per 15 minutes. Wrong email and wrong password look the same, and take the same time.
4. **Own session cookie.** `hj_admin`, `HttpOnly`, `SameSite=Strict`, `Secure` in production. Ends after 30 minutes idle or 12 hours total. A public-site cookie can never open the console, and an admin cookie is never accepted by the public API.
5. **First admin without a terminal.** Set `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` in Vercel. On start the server creates a Super Admin who must change the password and set up the authenticator at first sign-in. Remove the password variable afterwards.
6. **Roles and least privilege.**

| Area | Super Admin | Trust & Safety | Verifier | Support | Finance |
| --- | :-: | :-: | :-: | :-: | :-: |
| Dashboard | yes | yes | yes | yes | yes |
| Verification queue | yes | yes | yes | | |
| Workers and factories (view) | yes | yes | yes | yes | yes |
| Suspend / pause accounts | yes | yes | | | |
| Jobs moderation | yes | yes | | | |
| Fee complaints | yes | yes | | | |
| Privacy grievances | yes | yes | | yes | |
| Payments and ledger (view) | yes | | | | yes |
| Adjust credits | yes | | | | yes |
| Notifications outbox | yes | yes | | yes | |
| Audit log | yes | yes | | | |
| Staff accounts, system health | yes | | | | |

7. **Every write is logged** with who did it, what and why. Sensitive actions (suspend, credit change, data views of a person) require a written reason. Opening a person's full record is itself logged.
8. **Private data stays minimal.** Lists show masked phone numbers. Full phone is shown only on a record's page and that view is logged.

## Modules
1. **Overview**: people, live jobs, hires, queues waiting (with how old the oldest is), revenue, 30-day signup chart.
2. **Verification**: pending/approved/rejected, filter by kind, approve or reject with a note.
3. **Workers**: search, filter, record, suspend / restore, their applications and offers.
4. **Factories**: search, KYB status, credits, jobs, orders, pause / resume, suspend, reopen verification.
5. **Jobs**: search, filter by moderation state, hide or restore a job with a reason.
6. **Fee complaints**: status, notes, pause the factory.
7. **Privacy grievances**: due dates with overdue highlighted (30-day promise), status changes.
8. **Payments**: orders, credit ledger, manual credit adjustment with a reason.
9. **Notifications**: what the platform has sent.
10. **Audit log**: search by action, person or staff member, export CSV.
11. **Staff**: add, change role, disable, reset password, reset authenticator, end sessions (Super Admin only).
12. **System**: database, migrations, configuration review (secrets never shown), your own sessions.
13. **My account**: change password, new authenticator, sign out everywhere.

## Build order
Migration, then password + TOTP + sessions, then the API for each module with tests, then the console screens, then a browser test that signs in with password and authenticator code, then docs.

## Not in this pass
Passkeys/FIDO2 hardware keys, email-based password reset (there is no email service yet; a Super Admin resets passwords instead), IP allow-lists, editable platform settings such as credit-pack prices (these are fixed in code), bulk actions.
