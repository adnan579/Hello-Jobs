import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/cron/cleanup/route";
import { db } from "@/lib/db";
import { cleanupExpiredOtps } from "@/lib/maintenance";

const HOUR = 60 * 60 * 1000;
const otp = (phone: string, expiresAt: Date) =>
  db.otpChallenge.create({ data: { phone, codeHash: "x", expiresAt } });

describe("cleanupExpiredOtps", () => {
  it("deletes challenges that expired over a day ago and keeps the rest", async () => {
    const now = Date.now();
    await otp("+919000000001", new Date(now - 48 * HOUR)); // long dead
    await otp("+919000000002", new Date(now - 25 * HOUR)); // dead
    await otp("+919000000003", new Date(now - 1 * HOUR)); // expired recently: keep for rate limiting
    await otp("+919000000004", new Date(now + 5 * 60 * 1000)); // still valid

    expect(await cleanupExpiredOtps()).toBe(2);
    const left = await db.otpChallenge.findMany({ orderBy: { phone: "asc" } });
    expect(left.map((r: { phone: string }) => r.phone)).toEqual(["+919000000003", "+919000000004"]);
  });

  it("is a no-op on an empty table", async () => {
    expect(await cleanupExpiredOtps()).toBe(0);
  });
});

describe("GET /api/cron/cleanup", () => {
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });
  const call = (auth?: string) =>
    GET(new Request("http://localhost/api/cron/cleanup", { headers: auth ? { authorization: auth } : {} }));

  it("is disabled (503) until CRON_SECRET is configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer anything")).status).toBe(503);
  });

  it("rejects missing or wrong secrets", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    await otp("+919000000001", new Date(Date.now() - 48 * HOUR));
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect((await call("s3cret-value")).status).toBe(401);
    expect(await db.otpChallenge.count()).toBe(1);
  });

  it("runs the cleanup with the right secret", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    await otp("+919000000001", new Date(Date.now() - 48 * HOUR));
    const res = await call("Bearer s3cret-value");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, deletedOtps: 1 });
    expect(await db.otpChallenge.count()).toBe(0);
  });
});
