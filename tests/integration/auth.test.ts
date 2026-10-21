import { describe, expect, it } from "vitest";
import { requestOtpAction, verifyOtpAction, logoutAction, type AuthState } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { COOKIE_NAME, verifyToken } from "@/lib/session";
import { fd, makeWorker, redirectOf, testCookies } from "./helpers";

const phoneStep: AuthState = { step: "phone" };
const codeStep: AuthState = { step: "code" };

async function requestCode(phone: string, role: "WORKER" | "EMPLOYER" = "WORKER") {
  const state = await requestOtpAction(phoneStep, fd({ phone, role }));
  if (state.step !== "code") throw new Error(`OTP not sent: ${state.error ?? JSON.stringify(state.errors)}`);
  return state as Required<Pick<AuthState, "phone" | "devCode">> & AuthState;
}

describe("OTP login", () => {
  it("signs a new worker up: code is sent, verified, session cookie set, login audited", async () => {
    const sent = await requestCode("98111 00001");
    expect(sent.phone).toBe("+919811100001");
    expect(sent.devCode).toMatch(/^\d{4}$/);

    const url = await redirectOf(
      verifyOtpAction(codeStep, fd({ phone: sent.phone, role: "WORKER", code: sent.devCode })),
    );
    expect(url).toBe("/worker/onboarding");

    const user = await db.user.findUniqueOrThrow({ where: { phone: "+919811100001" } });
    expect(user.role).toBe("WORKER");
    expect(verifyToken(testCookies.get(COOKIE_NAME))).toEqual({ userId: user.id, role: "WORKER" });
    expect(await db.auditLog.count({ where: { action: "LOGIN", actorId: user.id } })).toBe(1);
  });

  it("stores only a hash of the code", async () => {
    const sent = await requestCode("9811100002");
    const row = await db.otpChallenge.findFirstOrThrow({ where: { phone: sent.phone } });
    expect(row.codeHash).not.toContain(sent.devCode);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("sends a returning worker with a Trade Card straight to their dashboard", async () => {
    const { user } = await makeWorker();
    const sent = await requestCode(user.phone);
    const url = await redirectOf(
      verifyOtpAction(codeStep, fd({ phone: sent.phone, role: "WORKER", code: sent.devCode })),
    );
    expect(url).toBe("/worker");
  });

  it("codes are single use", async () => {
    const sent = await requestCode("9811100003");
    const form = () => fd({ phone: sent.phone, role: "WORKER", code: sent.devCode });
    await redirectOf(verifyOtpAction(codeStep, form()));
    testCookies.clear();
    const again = await verifyOtpAction(codeStep, form());
    expect(again.error).toMatch(/expired|already used/i);
    expect(testCookies.get(COOKIE_NAME)).toBeUndefined();
  });

  it("locks the code after 5 wrong attempts, even if the right code is then entered", async () => {
    const sent = await requestCode("9811100004");
    const wrong = sent.devCode === "0000" ? "1111" : "0000";
    for (let i = 0; i < 5; i++) {
      const r = await verifyOtpAction(codeStep, fd({ phone: sent.phone, role: "WORKER", code: wrong }));
      expect(r.error).toMatch(/wrong code/i);
    }
    const locked = await verifyOtpAction(codeStep, fd({ phone: sent.phone, role: "WORKER", code: sent.devCode }));
    expect(locked.error).toMatch(/too many wrong attempts/i);
    expect(testCookies.get(COOKIE_NAME)).toBeUndefined();
    expect(await db.user.count({ where: { phone: sent.phone } })).toBe(0);
  });

  it("rate-limits code requests per phone number", async () => {
    for (let i = 0; i < 3; i++) await requestCode("9811100005");
    const fourth = await requestOtpAction(phoneStep, fd({ phone: "9811100005", role: "WORKER" }));
    expect(fourth.step).toBe("phone");
    expect(fourth.error).toMatch(/too many codes/i);
    expect(await db.otpChallenge.count({ where: { phone: "+919811100005" } })).toBe(3);
  });

  it("rejects invalid phone numbers without creating anything", async () => {
    const r = await requestOtpAction(phoneStep, fd({ phone: "12345", role: "WORKER" }));
    expect(r.errors?.phone).toMatch(/valid 10-digit/i);
    expect(await db.otpChallenge.count()).toBe(0);
  });

  it("does not let a worker number be used as a factory", async () => {
    const { user } = await makeWorker();
    const r = await requestOtpAction(phoneStep, fd({ phone: user.phone, role: "EMPLOYER" }));
    expect(r.step).toBe("phone");
    expect(r.error).toMatch(/already registered as a worker/i);
    expect(await db.otpChallenge.count()).toBe(0);
  });

  it("only follows same-site `next` redirects", async () => {
    const a = await requestCode("9811100006");
    const evil = await redirectOf(
      verifyOtpAction(codeStep, fd({ phone: a.phone, role: "WORKER", code: a.devCode, next: "https://evil.example" })),
    );
    expect(evil).toBe("/worker/onboarding");

    testCookies.clear();
    const b = await requestCode("9811100006");
    const ok = await redirectOf(
      verifyOtpAction(codeStep, fd({ phone: b.phone, role: "WORKER", code: b.devCode, next: "/jobs" })),
    );
    expect(ok).toBe("/jobs");
  });

  it("logout clears the session", async () => {
    const sent = await requestCode("9811100007");
    await redirectOf(verifyOtpAction(codeStep, fd({ phone: sent.phone, role: "WORKER", code: sent.devCode })));
    expect(testCookies.get(COOKIE_NAME)).toBeTruthy();
    expect(await redirectOf(logoutAction())).toBe("/");
    expect(testCookies.get(COOKIE_NAME)).toBeUndefined();
  });
});
