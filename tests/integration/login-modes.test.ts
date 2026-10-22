import { afterEach, describe, expect, it, vi } from "vitest";
import { requestOtpAction, verifyOtpAction, type AuthState } from "@/app/actions/auth";
import { ensureAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/session";
import { fd, makeWorker, redirectOf, testCookies } from "./helpers";

const phoneStep: AuthState = { step: "phone" };
const codeStep: AuthState = { step: "code" };

afterEach(() => vi.unstubAllEnvs());

describe("login on a deployed (production-mode) site", () => {
  it("refuses to send codes when there is no provider and no test mode, and stores nothing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OTP_DEMO_MODE", "");
    const r = await requestOtpAction(phoneStep, fd({ phone: "98111 00010", role: "WORKER" }));
    expect(r.step).toBe("phone");
    expect(r.devCode).toBeUndefined();
    expect(r.error).toMatch(/cannot be sent/i);
    expect(await db.otpChallenge.count()).toBe(0);
  });

  it("private test mode: an allowlisted number gets the code on screen and can log in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OTP_DEMO_MODE", "true");
    vi.stubEnv("OTP_DEMO_ALLOWLIST", "98111 00011, 98111 00012");

    const sent = await requestOtpAction(phoneStep, fd({ phone: "9811100011", role: "WORKER" }));
    expect(sent.step).toBe("code");
    expect(sent.devCode).toMatch(/^\d{4}$/);

    const url = await redirectOf(
      verifyOtpAction(codeStep, fd({ phone: sent.phone!, role: "WORKER", code: sent.devCode! })),
    );
    expect(url).toBe("/worker/onboarding");
    expect(testCookies.get(COOKIE_NAME)).toBeTruthy();
  });

  it("private test mode: a number that is not on the list is refused without creating anything", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OTP_DEMO_MODE", "true");
    vi.stubEnv("OTP_DEMO_ALLOWLIST", "9811100011");

    const r = await requestOtpAction(phoneStep, fd({ phone: "9811100099", role: "WORKER" }));
    expect(r.step).toBe("phone");
    expect(r.devCode).toBeUndefined();
    expect(r.error).toMatch(/private test site/i);
    expect(await db.otpChallenge.count()).toBe(0);
    expect(await db.user.count()).toBe(0);
  });

  it("an existing admin number that is not allowlisted cannot be logged into", async () => {
    await ensureAdmin("9811100020");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OTP_DEMO_MODE", "true");
    vi.stubEnv("OTP_DEMO_ALLOWLIST", "9811100011");

    const r = await requestOtpAction(phoneStep, fd({ phone: "9811100020", role: "WORKER" }));
    expect(r.devCode).toBeUndefined();
    expect(r.error).toMatch(/private test site/i);
    expect(testCookies.get(COOKIE_NAME)).toBeUndefined();
  });
});

describe("ensureAdmin (npm run admin:create)", () => {
  it("creates an admin, audits it, is idempotent, and the admin can log in to the review page", async () => {
    const first = await ensureAdmin("98111 00030");
    expect(first).toEqual({ ok: true, phone: "+919811100030", created: true });
    expect(await ensureAdmin("+919811100030")).toEqual({ ok: true, phone: "+919811100030", created: false });
    expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
    const entry = await db.auditLog.findFirstOrThrow({ where: { action: "ADMIN_CREATED" } });
    expect(entry.actorRole).toBe("SYSTEM");
    expect(JSON.stringify(entry)).not.toContain("9811100030");

    const sent = await requestOtpAction(phoneStep, fd({ phone: "9811100030", role: "WORKER" }));
    const url = await redirectOf(
      verifyOtpAction(codeStep, fd({ phone: sent.phone!, role: "WORKER", code: sent.devCode! })),
    );
    expect(url).toBe("/admin/employers");
  });

  it("never converts an existing worker account", async () => {
    const { user } = await makeWorker();
    const r = await ensureAdmin(user.phone);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/already registered as a worker/i);
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).role).toBe("WORKER");
  });

  it("rejects invalid numbers", async () => {
    const r = await ensureAdmin("12345");
    expect(r.ok).toBe(false);
    expect(await db.user.count()).toBe(0);
  });
});
