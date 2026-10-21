import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // The three journeys share one seeded database and run in order.
  fullyParallel: false,
  workers: 1,
  // No retries: the journeys create data, so a retry would run against polluted state.
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Workers use cheap Android phones: test on a phone-sized viewport.
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // `next dev`: the dev-only OTP echo on the login screen is what lets the tests sign in.
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-session-secret-e2e-session-secret-00",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
