import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./session";
import { codesMatch, generateCode, hashCode } from "./otp-core";
import { safeNext } from "./auth-paths";

describe("session tokens", () => {
  const session = { userId: "u1", role: "WORKER" as const };

  it("round-trips a valid token", () => {
    expect(verifyToken(signToken(session))).toEqual(session);
  });
  it("rejects a tampered payload", () => {
    const [payload, sig] = signToken(session).split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "u1", role: "ADMIN", exp: Date.now() + 1e9 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`)).toBeNull();
    expect(verifyToken(`${payload}.bad`)).toBeNull();
  });
  it("rejects expired and malformed tokens", () => {
    const old = signToken(session, Date.now() - 1000 * 60 * 60 * 24 * 31);
    expect(verifyToken(old)).toBeNull();
    expect(verifyToken(undefined)).toBeNull();
    expect(verifyToken("nodot")).toBeNull();
  });
});

describe("otp", () => {
  it("generates 4-digit codes", () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{4}$/);
  });
  it("binds the hash to the phone number", () => {
    const h = hashCode("+919876543210", "1234");
    expect(codesMatch(h, "+919876543210", "1234")).toBe(true);
    expect(codesMatch(h, "+919876543210", "1235")).toBe(false);
    expect(codesMatch(h, "+919876543211", "1234")).toBe(false);
  });
});

describe("safeNext", () => {
  it("allows relative paths only", () => {
    expect(safeNext("/jobs/1", "/")).toBe("/jobs/1");
    expect(safeNext("https://evil.com", "/")).toBe("/");
    expect(safeNext("//evil.com", "/")).toBe("/");
    expect(safeNext("/\\evil.com", "/")).toBe("/");
    expect(safeNext(undefined, "/home")).toBe("/home");
  });
});
