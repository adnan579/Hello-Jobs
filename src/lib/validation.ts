import { z } from "zod";
import {
  CATEGORIES,
  INDIAN_STATES,
  TRADES,
} from "./constants";
import { normalizeIndianPhone } from "./phone";

/** Turn a FormData into a plain object. Repeated keys become arrays. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key).filter((v) => typeof v === "string");
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

/** First error message per field, for showing next to inputs. */
export type FieldErrors = Record<string, string>;
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const checkbox = z
  .enum(["on", "true", "false"])
  .optional()
  .transform((v) => v === "on" || v === "true");

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalInt = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max).optional());

const requiredInt = (min: number, max: number, label: string) =>
  z.coerce
    .number({ error: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

const stateEnum = z.enum(INDIAN_STATES, { error: "Choose a state" });

// ---------- Auth ----------

export const phoneSchema = z
  .string()
  .transform((v, ctx) => {
    const phone = normalizeIndianPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit mobile number" });
      return z.NEVER;
    }
    return phone;
  });

export const requestOtpSchema = z.object({
  phone: phoneSchema,
  role: z.enum(["WORKER", "EMPLOYER"], { error: "Choose worker or factory" }),
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  role: z.enum(["WORKER", "EMPLOYER"]),
  code: z.string().regex(/^\d{4}$/, "Enter the 4-digit code"),
});

// ---------- Worker profile ----------

const machineTags = z
  .preprocess(
    (v) =>
      typeof v === "string"
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    z.array(z.string().max(30)).max(10, "Add at most 10 machine tags"),
  )
  .transform((tags) => [...new Set(tags)]);

export const workerProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  category: z.enum(CATEGORIES, { error: "Choose a category" }),
  trade: z.enum(TRADES, { error: "Choose your trade" }),
  machineTags,
  experienceYears: requiredInt(0, 50, "Experience"),
  itiCertified: checkbox,
  ncvtRollNumber: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9/-]{5,24}$/, "Roll number looks wrong")
      .optional(),
  ),
  currentState: stateEnum,
  currentDistrict: z.string().trim().min(2, "Enter your district").max(60),
  willingToRelocate: checkbox,
  preferredStates: z
    .preprocess(
      (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
      z.array(stateEnum),
    ),
  expectedSalaryMonthly: optionalInt(5000, 500000),
  availableImmediately: checkbox,
  skillVideoUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .url("Enter a valid link")
      .refine((u) => u.startsWith("https://"), "Link must start with https://")
      .optional(),
  ),
  visibleInDirectory: checkbox,
});
export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;

// ---------- Employer profile ----------

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const UDYAM_RE = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

export const employerProfileSchema = z.object({
  companyName: z.string().trim().min(2, "Enter the company name").max(120),
  contactPerson: z.string().trim().min(2, "Enter a contact person").max(80),
  hrPhone: phoneSchema,
  industrialCluster: z.string().trim().min(2, "Enter the industrial area").max(80),
  city: z.string().trim().min(2, "Enter the city").max(60),
  state: stateEnum,
  gstin: z.preprocess(
    (v) => (typeof v === "string" ? emptyToUndefined(v.trim().toUpperCase()) : v),
    z.string().regex(GSTIN_RE, "GSTIN must be 15 characters, e.g. 09ABCDE1234F1Z5").optional(),
  ),
  udyamNumber: z.preprocess(
    (v) => (typeof v === "string" ? emptyToUndefined(v.trim().toUpperCase()) : v),
    z.string().regex(UDYAM_RE, "Format: UDYAM-UP-00-0000000").optional(),
  ),
});
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;

// ---------- Job posting ----------

export const jobPostingSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a job title").max(100),
    trade: z.enum(TRADES, { error: "Choose a trade" }),
    category: z.enum(CATEGORIES, { error: "Choose a category" }),
    openings: requiredInt(1, 1000, "Openings"),
    city: z.string().trim().min(2, "Enter the city").max(60),
    state: stateEnum,
    minExperienceYears: requiredInt(0, 40, "Minimum experience"),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    grossSalaryMonthly: requiredInt(5000, 500000, "Gross salary"),
    inHandSalaryMonthly: requiredInt(5000, 500000, "In-hand salary"),
    overtimeRatePerHour: requiredInt(0, 2000, "Overtime rate"),
    shiftHours: requiredInt(4, 12, "Shift hours"),
    hasHostel: checkbox,
    hasCanteen: checkbox,
    hasPfEsi: checkbox,
    hasTravelAllowance: checkbox,
  })
  .refine((j) => j.inHandSalaryMonthly <= j.grossSalaryMonthly, {
    path: ["inHandSalaryMonthly"],
    message: "In-hand salary cannot be more than gross salary",
  });
export type JobPostingInput = z.infer<typeof jobPostingSchema>;

// ---------- Misc ----------

export const agentReportSchema = z.object({
  description: z.string().trim().min(10, "Please describe what happened").max(2000),
  jobId: z.preprocess(emptyToUndefined, z.string().optional()),
});
