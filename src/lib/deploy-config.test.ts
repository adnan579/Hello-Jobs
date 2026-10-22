import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
  regions?: string[];
  crons?: Array<{ path: string; schedule: string }>;
};

describe("vercel.json", () => {
  it("pins one function region (Hobby plan allows a single region)", () => {
    expect(vercel.regions).toHaveLength(1);
  });

  it("schedules a cron for a route that exists, at most once a day", () => {
    expect(vercel.crons?.length).toBeGreaterThan(0);
    for (const cron of vercel.crons ?? []) {
      expect(existsSync(join(root, "src/app", cron.path, "route.ts"))).toBe(true);
      // "minute hour * * *": daily. Anything more frequent fails a Hobby deployment.
      expect(cron.schedule).toMatch(/^\d{1,2} \d{1,2} \* \* \*$/);
    }
  });
});

describe(".env.example", () => {
  it("documents every environment variable the app reads", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    for (const name of ["DATABASE_URL", "SESSION_SECRET", "CRON_SECRET", "OTP_DEMO_MODE", "OTP_DEMO_ALLOWLIST"]) {
      expect(example).toContain(`${name}=`);
    }
  });
});
