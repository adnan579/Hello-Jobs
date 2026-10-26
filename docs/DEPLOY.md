# Deploy Hello Jobs (browser only, about 30 minutes)

You need: a GitHub account (you have it), a Neon account (database), a Vercel account (hosting). All have free plans good enough for a pilot.

## 1. Database (Neon)
1. Go to neon.tech and sign up. Create a project named `hellojobs`, region closest to India (Singapore).
2. On the project dashboard press **Connect**. Copy the connection string that starts with `postgresql://`. This is `DATABASE_URL`.

## 2. Secrets
Make a long random text for `SESSION_SECRET`: open any password generator in your browser and make a 48-character password. Save it somewhere safe. Changing it later logs everyone out.

## 3. Hosting (Vercel)
1. Go to vercel.com, sign up with GitHub, press **Add New → Project**, pick `adnan579/Hello-Jobs`.
2. Branch: `main` (merge the pull request first). Framework: Vite (already set in `vercel.json`).
3. Open **Environment Variables** and add:
   - `DATABASE_URL` — from step 1
   - `SESSION_SECRET` — from step 2
   - `APP_URL` — your site address, for example `https://hello-jobs.vercel.app` (edit after the first deploy if it differs)
   - `ADMIN_BOOTSTRAP_EMAIL` — your email (this becomes the first Super Admin)
   - `ADMIN_BOOTSTRAP_PASSWORD` — a temporary password, 12+ characters (you change it at first sign-in)
   - `CRON_SECRET` — another long random text
4. Press **Deploy**. The database tables are created automatically on the first visit.

## 4. First login (staff console)
1. Open `https://your-site/admin` (the address is not linked from the public site).
2. Sign in with the bootstrap email and temporary password.
3. Scan the QR code with Google Authenticator or Microsoft Authenticator, then type the 6-digit code.
4. Choose your own password when asked.
5. **Go to Vercel → Settings → Environment Variables and delete `ADMIN_BOOTSTRAP_PASSWORD`, then redeploy.** It is only needed once.
6. In the console open **Staff** to add colleagues with the right role (Super Admin, Trust & Safety, Verifier, Support, Finance).

Lost your phone or locked out as the only Super Admin? Set `ADMIN_BOOTSTRAP_RESET` = `true` (with the bootstrap email and password still set) for one deploy, sign in again, then remove all three. See `docs/ADMIN_CONSOLE_PLAN.md` for what each role can do.

## 5. WhatsApp login codes (Meta)
1. business.facebook.com → create a business account, then WhatsApp → add a phone number you control.
2. Create a message template of category **Authentication** (one-time code). Wait for approval.
3. From the Meta developer dashboard copy: permanent access token, phone number ID, template name.
4. Add in Vercel: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE` (and `WHATSAPP_OTP_LANGUAGE` if the template is not English). Redeploy.
5. The code that sends the message has not been tried against the live Meta service. Test with your own number first.

## 6. Payments (Razorpay) — only when you are ready to charge
1. Create a Razorpay account and finish KYC. Copy the key id and secret.
2. Add a webhook to `https://your-site/api/webhooks/razorpay` for the `payment.captured` and `order.paid` events, with a secret you choose.
3. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Vercel. Do a ₹1 test purchase first.
4. Until then factories cannot buy credits in production, which is intentional.

See `docs/ENVIRONMENT.md` for every setting and how to keep things running smoothly. Run `npm run doctor` to check yours.

## 7. Day-to-day
- New factories appear in the staff console under **Verification queue**. Check the GSTIN on services.gst.gov.in, then press Approve.
- Fee complaints appear under **Trust & safety**.
- A daily cleanup job removes expired login codes and sessions (set up by `vercel.json`).

## Before you invite real users
- Have a lawyer review the privacy notice, terms and the DPDP flows.
- Get the Hindi, Marathi and Tamil text reviewed by native speakers.
- Register the company, confirm GST invoicing with an accountant.
- Set `VITE_GRIEVANCE_OFFICER_NAME`, `VITE_GRIEVANCE_EMAIL`, `VITE_HELPLINE` and `VITE_COMPANY_ADDRESS` in Vercel and redeploy. Until you do, the site says the details are not published yet.
- Revoke any GitHub token that was ever pasted in a chat.
