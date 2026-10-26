import { test, expect, type Page } from '@playwright/test';
import { totpAt } from '../server/lib/totp.ts';

const GSTIN = '27AAPFU0939F1ZV'; // valid format + checksum

async function otpLogin(p: Page, phone: string) {
  await p.locator('input[type=tel]').fill(phone);
  await p.getByRole('button', { name: /Send WhatsApp OTP/ }).click();
  await p.waitForSelector('text=Enter 6-Digit');
  const chip = await p.locator('button:has-text("Code:")').innerText();
  await p.locator('input[autocomplete=one-time-code]').fill(chip.match(/\d{6}/)![0]);
  await p.locator('form button[type=submit]').last().click();
}

async function openAuth(p: Page, role: 'worker' | 'employer', mode: 'register' | 'login') {
  await p.goto('/');
  await p.getByRole('button', { name: mode === 'register' ? (role === 'worker' ? 'Register as Worker' : 'Register as Employer') : 'Log In' }).first().click();
  await p.waitForSelector('text=10-Digit Mobile');
  await p.getByRole('button', { name: role === 'worker' ? /I am a Worker/ : /I am an Employer/ }).click();
  if (mode === 'register') await p.getByRole('button', { name: role === 'worker' ? /New Worker Registration/ : /New Employer Registration/ }).click();
}

async function checkConsents(p: Page) {
  for (const cb of await p.locator('input[type=checkbox]').all()) await cb.check();
}

test('factory -> admin approval -> job -> worker applies -> offer -> accept -> both confirm joining', async ({ browser }) => {
  const mk = async () => (await browser.newContext()).newPage();
  const [emp, adm, wk] = [await mk(), await mk(), await mk()];
  const apiErrors: string[] = [];
  for (const p of [emp, adm, wk]) {
    p.on('pageerror', (e) => { if (!/WebSocket/.test(e.message)) apiErrors.push('pageerror ' + e.message); });
    p.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400 && r.request().method() !== 'GET') apiErrors.push(`${r.status()} ${r.url()}`);
    });
  }
  const bootstrap = (p: Page) => p.evaluate(async () => (await fetch('/api/bootstrap')).json());

  // 1. Factory registers; it cannot do anything until a human verifies the GSTIN.
  await openAuth(emp, 'employer', 'register');
  await emp.getByPlaceholder('Registered company name').fill('Precision Auto Components Pvt Ltd');
  await emp.getByPlaceholder('e.g. 27AAPFU0939F1ZV').fill(GSTIN);
  await emp.getByPlaceholder('HR manager full name').fill('Sunita Rao');
  await emp.getByPlaceholder('e.g. Chakan MIDC, Pune').fill('Chakan MIDC, Pune');
  await checkConsents(emp);
  await otpLogin(emp, '9823011491');
  await emp.waitForSelector('text=Verification pending');

  // 2. Staff sign in at /admin (password + authenticator), choose a new password, and approve.
  await adm.goto('/admin');
  await adm.getByLabel('Work email').fill('owner@hellojobs.test');
  await adm.getByLabel('Password').fill('E2e-Owner-Password-9');
  await adm.getByRole('button', { name: 'Continue' }).click();
  await adm.waitForSelector('text=Set up your authenticator');
  const secret = (await adm.locator('code').innerText()).trim();
  await adm.getByLabel(/6-digit code/).fill(totpAt(secret, Math.floor(Date.now() / 30_000)));
  await adm.getByRole('button', { name: 'Sign in' }).click();
  await adm.waitForSelector('text=Set your own password');
  await adm.getByLabel('Current password').fill('E2e-Owner-Password-9');
  await adm.locator('input[autocomplete=new-password]').nth(0).fill('E2e-Brand-New-Password-77');
  await adm.locator('input[autocomplete=new-password]').nth(1).fill('E2e-Brand-New-Password-77');
  await adm.getByRole('button', { name: 'Change password' }).click();
  await adm.getByRole('button', { name: 'Verification', exact: true }).click();
  await adm.getByRole('button', { name: 'Review' }).first().click();
  await adm.getByRole('button', { name: 'Approve' }).click();
  await expect(adm.locator('span:text-is("VERIFIED")').first()).toBeVisible();
  // The public site has no way into the console.
  const publicHtml = await (await adm.request.get('/')).text();
  expect(publicHtml).not.toContain('Staff Console');

  // 3. Factory posts a job (3 welcome credits were granted on verification).
  await emp.reload();
  await emp.getByRole('button', { name: /Post (a )?(New )?Job|Post Requirement/i }).first().click();
  await emp.waitForSelector('text=Transparent Compensation');
  await emp.getByPlaceholder('e.g. Maharashtra').fill('Maharashtra');
  const nums = emp.locator('input[type=number]');
  await nums.nth(1).fill('16000');
  await nums.nth(2).fill('19000');
  await emp.getByRole('button', { name: /Publish Requirement/ }).click();
  await expect.poll(async () => (await bootstrap(emp)).jobs.length).toBe(1);
  expect((await bootstrap(emp)).employerProfile.huntCredits).toBe(3);

  // 4. Worker registers and applies.
  await openAuth(wk, 'worker', 'register');
  await wk.getByPlaceholder('Your name as on your ID').fill('Ramesh Yadav');
  await wk.locator('label:has-text("Current City") + input').fill('Pune');
  await wk.locator('label:has-text("Home State") + input').fill('Uttar Pradesh');
  await checkConsents(wk);
  await otpLogin(wk, '9811122233');
  await wk.getByRole('button', { name: /1-Tap Direct Apply/ }).first().click();
  await expect.poll(async () => (await bootstrap(wk)).applications.length).toBe(1);

  // 5. Factory sees the applicant with a usable phone number and issues an offer.
  await emp.reload();
  await emp.getByRole('button', { name: /Dashboard/ }).last().click();
  await emp.getByRole('button', { name: /Job Postings & Applicants/ }).click();
  await expect(emp.getByText('+91 98111 22233')).toBeVisible();
  await emp.getByRole('button', { name: 'Issue Offer' }).click();
  const n = emp.locator('.fixed input[type=number]');
  await n.nth(0).fill('16000');
  await n.nth(1).fill('100');
  await n.nth(2).fill('19000');
  await emp.getByRole('button', { name: 'Issue Direct Digital Offer Letter' }).click();
  await expect.poll(async () => (await bootstrap(emp)).offers.map((o: any) => o.status)).toEqual(['Issued']);
  const issued = (await bootstrap(emp)).offers[0];
  expect(issued.companyName).toBe('Precision Auto Components Pvt Ltd');
  expect(issued.gstin).toBe(GSTIN);

  // 6. Worker accepts and says they reported for work. That alone does not fill the vacancy.
  await wk.reload();
  await wk.getByRole('button', { name: /My Profile/ }).first().click();
  await wk.getByRole('button', { name: /My Applications/ }).first().click();
  await wk.getByRole('button', { name: /Accept Direct Offer/ }).click();
  await wk.getByRole('button', { name: /Confirm I Joined/ }).click();
  await expect.poll(async () => (await bootstrap(wk)).applications.map((a: any) => a.status)).toEqual(['Accepted']);

  // 7. The factory marks the worker as joined; now the offer is fully confirmed.
  await emp.reload();
  await emp.getByRole('button', { name: /Dashboard/ }).last().click();
  await emp.getByRole('button', { name: /Job Postings & Applicants/ }).click();
  await emp.locator('select').first().selectOption('Joined');
  await expect.poll(async () => (await bootstrap(emp)).offers.map((o: any) => o.status)).toEqual(['Joined Confirmed']);

  expect(apiErrors).toEqual([]);
});

test('the public site shows no demo data and no instant logins', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Apex Industrial|Bharat Forge|Instant Login|Demo Login/i)).toHaveCount(0);
  const data = await page.evaluate(async () => (await fetch('/api/bootstrap')).json());
  expect(data.session).toBeNull();
  expect(data.candidates).toEqual([]);
});
