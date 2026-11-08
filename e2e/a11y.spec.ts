import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// `next dev` compiles a route on first request and then reloads open pages, which would break a scan in progress.
test.beforeAll(async ({ request }) => {
  test.setTimeout(180_000);
  for (const path of ['/', '/about', '/jobs', '/employers', '/api/bootstrap']) await request.get(path);
});

// Public pages must have no serious or critical accessibility problems, and headings must not skip levels.
// This is what caught the 4.23:1 footer text and the h4-under-h2 jump; it keeps them from coming back.
for (const path of ['/', '/about', '/jobs', '/employers']) {
  for (const [label, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 375, height: 700 }]] as const) {
    test(`${path} has no accessibility violations (${label})`, async ({ browser }) => {
      const page = await (await browser.newContext({ viewport })).newPage();
      await page.goto(path);
      await page.waitForLoadState('load');
      if (path === '/' || path === '/about') await page.waitForSelector('html[data-hydrated="true"]'); // client-rendered pages
      await page.waitForTimeout(500);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).include('body').analyze();
      const blocking = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical' || v.id === 'heading-order');
      expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
    });
  }
}
