import { defineConfig } from "vitest/config";

// Fast unit tests only (no database). Integration tests: vitest.integration.config.ts.
// Playwright specs live in e2e/ and must not be picked up by Vitest.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
