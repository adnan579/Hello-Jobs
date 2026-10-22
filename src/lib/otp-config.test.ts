import { describe, expect, it } from "vitest";
import { getOtpPolicy, parseAllowlist } from "./otp-config";

const PHONE = "+919876543210";

describe("parseAllowlist", () => {
  it("accepts common formats separated by commas, semicolons or newlines", () => {
    const set = parseAllowlist("98765 43210, +91 90000-00001;09000000002\n 919000000003 ");
    expect([...set].sort()).toEqual(["+919000000001", "+919000000002", "+919000000003", "+919876543210"]);
  });
  it("ignores junk and empty values", () => {
    expect(parseAllowlist(undefined).size).toBe(0);
    expect(parseAllowlist("").size).toBe(0);
    expect(parseAllowlist("abc, 12345, ,;").size).toBe(0);
  });
});

describe("getOtpPolicy", () => {
  it("echoes the code outside production, whatever the demo settings", () => {
    for (const NODE_ENV of ["development", "test", undefined]) {
      expect(getOtpPolicy(PHONE, { NODE_ENV })).toEqual({ kind: "dev-echo" });
    }
  });

  it("refuses to send in production when there is no provider and no demo mode", () => {
    expect(getOtpPolicy(PHONE, { NODE_ENV: "production" })).toEqual({ kind: "provider-missing" });
    expect(getOtpPolicy(PHONE, { NODE_ENV: "production", OTP_DEMO_ALLOWLIST: PHONE })).toEqual({
      kind: "provider-missing",
    });
  });

  it("demo mode only works for allowlisted numbers", () => {
    const env = { NODE_ENV: "production", OTP_DEMO_MODE: "true", OTP_DEMO_ALLOWLIST: "98765 43210, 9000000001" };
    expect(getOtpPolicy(PHONE, env)).toEqual({ kind: "demo-echo" });
    expect(getOtpPolicy("+919000000001", env)).toEqual({ kind: "demo-echo" });
    expect(getOtpPolicy("+919111111111", env)).toEqual({ kind: "demo-blocked" });
  });

  it("demo mode with an empty allowlist blocks everyone", () => {
    expect(getOtpPolicy(PHONE, { NODE_ENV: "production", OTP_DEMO_MODE: "true" })).toEqual({ kind: "demo-blocked" });
  });

  it("only the exact string 'true' turns demo mode on", () => {
    for (const value of ["TRUE", "1", "yes", "on", " true", ""]) {
      const env = { NODE_ENV: "production", OTP_DEMO_MODE: value, OTP_DEMO_ALLOWLIST: PHONE };
      expect(getOtpPolicy(PHONE, env)).toEqual({ kind: "provider-missing" });
    }
  });
});
