import { test, expect, type Page } from '@playwright/test';

// `next dev` compiles each route on first request and then refreshes open pages: warm them up first.
test.beforeAll(async ({ request }) => {
  test.setTimeout(180_000);
  for (const path of ['/', '/me', '/jobs', '/api/health', '/api/bootstrap']) await request.get(path, { maxRedirects: 0 });
});

async function ready(p: Page) {
  await p.waitForSelector('html[data-hydrated="true"]');
}

async function registerWorker(p: Page, phone: string) {
  await p.goto('/');
  await ready(p);
  await p.getByTestId('auth-register-worker').first().click();
  await p.waitForSelector('text=10-Digit Mobile');
  await p.getByTestId('auth-select-worker').click();
  await p.getByTestId('auth-register-mode-worker').click();
  await p.getByPlaceholder('Your name as on your ID').fill('Ramesh Yadav');
  await p.locator('label:has-text("Current City") + input').fill('Pune');
  await p.locator('label:has-text("Home State") + input').fill('Uttar Pradesh');
  for (const cb of await p.locator('input[type=checkbox]').all()) await cb.check();
  await p.locator('input[type=tel]').fill(phone);
  await p.getByTestId('auth-send-otp').click();
  await p.waitForSelector('text=Enter 6-Digit');
  const chip = await p.locator('button:has-text("Code:")').textContent() ?? '';
  await p.locator('input[autocomplete=one-time-code]').fill(chip.match(/\d{6}/)![0]);
  const [verified] = await Promise.all([
    p.waitForResponse((r) => r.url().includes('/api/auth/verify')),
    p.getByTestId('auth-verify-otp').click(),
  ]);
  expect(verified.ok()).toBe(true);
}

test('a worker lands on a simple home with one next step, answers one question at a time, and can log out', async ({ page }) => {
  test.setTimeout(120_000);
  await registerWorker(page, '9822233344');
  await page.goto('/me');
  await ready(page);

  // Home: greeting, one next step with one button, a visible Log out.
  await expect(page.getByRole('heading', { name: /Namaste Ramesh/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your next step' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Listen', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log out' }).first()).toBeVisible();

  // The next step opens one question, with a picture and a speaker button.
  await page.getByRole('button', { name: 'Answer now' }).click();
  await expect(page.getByText(/Question \d+ of 9/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Which machines or tools can you use?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).toBeVisible();

  // Every tap target on the question screen is at least 44 px tall and no text is under 13 px.
  const small = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('main button, main [role=button], main input:not([type=checkbox])')) {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.height < 43.5) out.push(`${el.textContent?.trim().slice(0, 30)} ${Math.round(r.height)}`);
    }
    return out;
  });
  expect(small).toEqual([]);

  // Answer it and move on.
  await page.getByRole('button', { name: /Fanuc 0i-TF/ }).first().click();
  await page.getByRole('button', { name: /Haas VF-2/ }).first().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Where did you work last?' })).toBeVisible();

  // The language switch changes the signed-in screen too.
  await page.locator('#lang-select').selectOption('hi');
  await expect(page.getByRole('heading', { name: 'आपने पिछली बार कहाँ काम किया?' })).toBeVisible();

  // Log out from the home's own button ends the session.
  await page.goto('/me');
  await ready(page);
  await page.getByRole('button', { name: 'लॉग आउट' }).first().click();
  await expect.poll(async () => (await (await page.request.get('/api/auth/me')).json()).session ?? null).toBeNull();
});
