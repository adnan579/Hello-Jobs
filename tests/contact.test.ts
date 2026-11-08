import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The public grievance/helpline details are read in the browser, so Next.js has to inline them at build time.
// This broke silently once (the values were read from Vite's import.meta.env and were always empty), so keep a guard.
const NAMES = ['GRIEVANCE_OFFICER_NAME', 'GRIEVANCE_EMAIL', 'HELPLINE', 'COMPANY_ADDRESS'];

describe('public contact details', () => {
  beforeEach(() => {
    vi.resetModules();
    for (const n of NAMES) {
      vi.stubEnv(`NEXT_PUBLIC_${n}`, undefined as unknown as string);
      vi.stubEnv(`VITE_${n}`, undefined as unknown as string);
    }
  });
  afterEach(() => vi.unstubAllEnvs());

  it('are empty when nothing is set, so the site never shows invented details', async () => {
    const { CONTACT } = await import('../src/config/contact.ts');
    expect(CONTACT).toEqual({ officerName: '', email: '', helpline: '', companyAddress: '' });
  });

  it('come from the NEXT_PUBLIC_ variables, trimmed', async () => {
    vi.stubEnv('NEXT_PUBLIC_GRIEVANCE_EMAIL', '  grievance@shramkart.example ');
    vi.stubEnv('NEXT_PUBLIC_HELPLINE', '1800-000-000');
    const { CONTACT } = await import('../src/config/contact.ts');
    expect(CONTACT.email).toBe('grievance@shramkart.example');
    expect(CONTACT.helpline).toBe('1800-000-000');
  });

  it('are inlined by next.config.ts from the new names, or from the old VITE_ names when the new ones are absent', async () => {
    vi.stubEnv('VITE_GRIEVANCE_EMAIL', 'old@shramkart.example');
    vi.stubEnv('VITE_HELPLINE', 'old-helpline');
    vi.stubEnv('NEXT_PUBLIC_HELPLINE', 'new-helpline');
    const { default: config } = await import('../next.config.ts');
    expect(config.env).toMatchObject({
      NEXT_PUBLIC_GRIEVANCE_EMAIL: 'old@shramkart.example',
      NEXT_PUBLIC_HELPLINE: 'new-helpline',
      NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME: '',
      NEXT_PUBLIC_COMPANY_ADDRESS: '',
    });
  });
});
