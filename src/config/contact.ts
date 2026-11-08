/**
 * Public contact details, set at build time (Vercel environment variables starting with NEXT_PUBLIC_) so that no
 * invented name, email or phone number is ever shown. The older VITE_ names are still read, in next.config.ts, so a
 * deployment that already has them keeps working. When a value is empty the UI says that the details are not
 * published yet and points people to the in-app grievance form.
 *
 * Next.js only replaces a variable when it is written out in full as `process.env.NEXT_PUBLIC_NAME`, so do not
 * shorten these lines into a loop or a lookup.
 */
export const CONTACT = {
  officerName: (process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME ?? '').trim(),
  email: (process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL ?? '').trim(),
  helpline: (process.env.NEXT_PUBLIC_HELPLINE ?? '').trim(),
  companyAddress: (process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? '').trim(),
};
