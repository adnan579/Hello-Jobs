import { defineConfig } from '@playwright/test';

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? 'postgres://hj:hj@localhost:54329/hj_e2e';
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    // CI runs `npx playwright install chromium`. Locally you can point at any Chromium build.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'node e2e/reset-db.mjs && npx tsx server.ts',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: 'development',
      PORT: String(PORT),
      DATABASE_URL,
      SESSION_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e-secret',
      ADMIN_BOOTSTRAP_PHONES: '9000000001',
    },
  },
});
