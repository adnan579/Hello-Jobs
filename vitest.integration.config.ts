import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests run server actions against a REAL PostgreSQL database.
// Requires TEST_DATABASE_URL (database name must contain "test": it gets truncated).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
