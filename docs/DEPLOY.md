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
   - `ADMIN_BOOTSTRAP_PHONES` — your own 10-digit mobile number
   - `CRON_SECRET` — another long random text
4. Press **Deploy**. The database tables are created automatically on the first visit.

## 4. First login (staff)
Open `https://your-site/#staff`. Enter your number. Until WhatsApp is connected (step 5) production hides the code, so for the very first pilot only:
- add `OTP_DEMO_MODE` = `true` and `OTP_DEMO_ALLOWLIST` = your own number in Vercel, redeploy. The code shows on screen only for that number.
- Remove both variables as soon as WhatsApp works.

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

## 7. Day-to-day
- New factories appear in the staff console under **Verification queue**. Check the GSTIN on services.gst.gov.in, then press Approve.
- Fee complaints appear under **Trust & safety**.
- A daily cleanup job removes expired login codes and sessions (set up by `vercel.json`).

## Before you invite real users
- Have a lawyer review the privacy notice, terms and the DPDP flows.
- Get the Hindi, Marathi and Tamil text reviewed by native speakers.
- Register the company, confirm GST invoicing with an accountant.
- Add the grievance officer's real name and email in the legal pages.
- Revoke any GitHub token that was ever pasted in a chat.
