import { describe, expect, it } from "vitest";
import { formatPhone, normalizeIndianPhone } from "./phone";
import { canEmployerMove, canWorkerWithdraw, employerNextStages } from "./pipeline";
import { rupees, takeHomePercent } from "./format";
import {
  employerProfileSchema,
  fieldErrors,
  formToObject,
  jobPostingSchema,
  requestOtpSchema,
  verifyOtpSchema,
  workerProfileSchema,
} from "./validation";

function form(entries: Array<[string, string]>): Record<string, unknown> {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return formToObject(fd);
}

describe("phone", () => {
  it("normalises common Indian formats", () => {
    expect(normalizeIndianPhone("98765 43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("919876543210")).toBe("+919876543210");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("5876543210")).toBeNull();
    expect(normalizeIndianPhone("")).toBeNull();
  });
  it("formats for display", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });
});

describe("pipeline", () => {
  it("allows the forward path and rejections", () => {
    expect(canEmployerMove("INITIATED", "SHORTLISTED")).toBe(true);
    expect(canEmployerMove("SHORTLISTED", "OFFERED")).toBe(true);
    expect(canEmployerMove("OFFERED", "JOINED")).toBe(true);
    expect(canEmployerMove("OFFERED", "REJECTED")).toBe(true);
  });
  it("blocks skipping stages and leaving terminal ones", () => {
    expect(canEmployerMove("INITIATED", "JOINED")).toBe(false);
    expect(canEmployerMove("JOINED", "REJECTED")).toBe(false);
    expect(employerNextStages("WITHDRAWN")).toEqual([]);
  });
  it("lets workers withdraw only from open stages", () => {
    expect(canWorkerWithdraw("INITIATED")).toBe(true);
    expect(canWorkerWithdraw("OFFERED")).toBe(true);
    expect(canWorkerWithdraw("JOINED")).toBe(false);
  });
});

describe("format", () => {
  it("uses Indian digit grouping", () => {
    expect(rupees(1234567)).toBe("₹12,34,567");
    expect(rupees(18500)).toBe("₹18,500");
  });
  it("computes take-home share", () => {
    expect(takeHomePercent(20000, 17000)).toBe(85);
    expect(takeHomePercent(0, 0)).toBe(0);
  });
});

describe("auth schemas", () => {
  it("normalises the phone and requires a role", () => {
    const ok = requestOtpSchema.safeParse({ phone: "98765 43210", role: "WORKER" });
    expect(ok.success && ok.data.phone).toBe("+919876543210");
    expect(requestOtpSchema.safeParse({ phone: "98765 43210", role: "ADMIN" }).success).toBe(false);
  });
  it("requires a 4-digit code", () => {
    const base = { phone: "9876543210", role: "WORKER" };
    expect(verifyOtpSchema.safeParse({ ...base, code: "1234" }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ ...base, code: "12345" }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ ...base, code: "12a4" }).success).toBe(false);
  });
});

describe("workerProfileSchema", () => {
  const valid: Array<[string, string]> = [
    ["fullName", "Ramesh Kumar"],
    ["category", "SKILLED"],
    ["trade", "FITTER"],
    ["machineTags", "CNC, Lathe, cnc"],
    ["experienceYears", "4"],
    ["itiCertified", "on"],
    ["currentState", "Uttar Pradesh"],
    ["currentDistrict", "Lucknow"],
    ["willingToRelocate", "on"],
    ["preferredStates", "Gujarat"],
    ["preferredStates", "Haryana"],
    ["expectedSalaryMonthly", "20000"],
    ["skillVideoUrl", ""],
  ];
  it("parses a valid trade card", () => {
    const r = workerProfileSchema.safeParse(form(valid));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.machineTags).toEqual(["CNC", "Lathe", "cnc"]);
      expect(r.data.itiCertified).toBe(true);
      expect(r.data.availableImmediately).toBe(false); // unchecked checkbox
      expect(r.data.preferredStates).toEqual(["Gujarat", "Haryana"]);
      expect(r.data.skillVideoUrl).toBeUndefined();
    }
  });
  it("rejects http video links", () => {
    const withoutVideo = valid.filter(([k]) => k !== "skillVideoUrl");
    const r = workerProfileSchema.safeParse(
      form([...withoutVideo, ["skillVideoUrl", "http://example.com/v.mp4"]]),
    );
    expect(r.success).toBe(false);
  });
});

describe("employerProfileSchema", () => {
  const base: Array<[string, string]> = [
    ["companyName", "Shakti Auto Components"],
    ["contactPerson", "Anita Verma"],
    ["hrPhone", "9811122233"],
    ["industrialCluster", "Noida Sector 63"],
    ["city", "Noida"],
    ["state", "Uttar Pradesh"],
  ];
  it("accepts optional, well-formed GSTIN and Udyam (case-insensitive)", () => {
    const r = employerProfileSchema.safeParse(
      form([...base, ["gstin", "09abcde1234f1z5"], ["udyamNumber", "udyam-up-12-1234567"]]),
    );
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.gstin).toBe("09ABCDE1234F1Z5");
  });
  it("rejects a malformed GSTIN", () => {
    const r = employerProfileSchema.safeParse(form([...base, ["gstin", "NOTAGSTIN"]]));
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).gstin).toMatch(/GSTIN/);
  });
});

describe("jobPostingSchema", () => {
  const base: Array<[string, string]> = [
    ["title", "ITI Fitter - Assembly"],
    ["trade", "FITTER"],
    ["category", "SKILLED"],
    ["openings", "25"],
    ["city", "Noida"],
    ["state", "Uttar Pradesh"],
    ["minExperienceYears", "1"],
    ["grossSalaryMonthly", "22000"],
    ["inHandSalaryMonthly", "19500"],
    ["overtimeRatePerHour", "95"],
    ["shiftHours", "8"],
    ["hasHostel", "on"],
  ];
  it("parses a wage-transparent job", () => {
    const r = jobPostingSchema.safeParse(form(base));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.hasHostel).toBe(true);
      expect(r.data.hasCanteen).toBe(false);
    }
  });
  it("rejects in-hand above gross", () => {
    const r = jobPostingSchema.safeParse(
      form(base.map(([k, v]) => (k === "inHandSalaryMonthly" ? [k, "30000"] : [k, v]) as [string, string])),
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).inHandSalaryMonthly).toMatch(/more than gross/);
  });
  it("requires wage fields (no 'as per industry standards')", () => {
    const r = jobPostingSchema.safeParse(form(base.filter(([k]) => k !== "overtimeRatePerHour")));
    expect(r.success).toBe(false);
  });
});
