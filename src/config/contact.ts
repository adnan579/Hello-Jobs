/**
 * Public contact details. These are set at build time (Vercel environment variables starting with VITE_)
 * so that no invented name, email or phone number is ever shown. When a value is empty the UI says
 * that the details are not published yet and points people to the in-app grievance form.
 */
const env = (import.meta as any).env ?? {};

export const CONTACT = {
  officerName: String(env.VITE_GRIEVANCE_OFFICER_NAME ?? '').trim(),
  email: String(env.VITE_GRIEVANCE_EMAIL ?? '').trim(),
  helpline: String(env.VITE_HELPLINE ?? '').trim(),
  companyAddress: String(env.VITE_COMPANY_ADDRESS ?? '').trim(),
};

export const hasGrievanceContact = Boolean(CONTACT.email || CONTACT.officerName);
