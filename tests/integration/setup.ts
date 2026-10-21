import { afterAll, beforeAll, beforeEach, vi } from "vitest";

// ---- Safety: this suite TRUNCATES every table. Refuse anything but a test DB. ----
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required, e.g. postgresql://postgres:postgres@localhost:5432/hello_jobs_test",
  );
}
const dbName = decodeURIComponent(new URL(testUrl).pathname.replace(/^\//, ""));
if (!/test/i.test(dbName)) {
  throw new Error(`Refusing to run: database "${dbName}" does not look like a test database (name must contain "test").`);
}
process.env.DATABASE_URL = testUrl;
process.env.SESSION_SECRET ??= "integration-test-secret-integration-test-secret";

// ---- Next.js request APIs ----
vi.mock("next/headers", async () => {
  const { testCookies } = await import("./next-mocks");
  return { cookies: async () => testCookies.jar };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", async () => {
  const { RedirectSignal } = await import("./next-mocks");
  return {
    redirect: (url: string) => {
      throw new RedirectSignal(url);
    },
    permanentRedirect: (url: string) => {
      throw new RedirectSignal(url);
    },
    notFound: () => {
      throw new Error("NOT_FOUND");
    },
  };
});

beforeAll(async () => {
  const { db } = await import("@/lib/db");
  // Fail fast with a clear message if the database is not reachable / not migrated.
  await db.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
});

beforeEach(async () => {
  const { resetDb } = await import("./helpers");
  await resetDb();
});

afterAll(async () => {
  const { db } = await import("@/lib/db");
  await db.$disconnect();
});
