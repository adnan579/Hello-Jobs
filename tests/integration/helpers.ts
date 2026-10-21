import { db } from "@/lib/db";
import type { TradeValue } from "@/lib/constants";
import { COOKIE_NAME, signToken } from "@/lib/session";
import { RedirectSignal, testCookies } from "./next-mocks";

export { RedirectSignal, testCookies };

export async function resetDb(): Promise<void> {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "AuditLog","AgentFeeReport","JobInteraction","JobPosting","EmployerProfile","WorkerProfile","OtpChallenge","User" RESTART IDENTITY CASCADE`,
  );
  testCookies.clear();
}

let seq = 0;
/** Unique, valid-looking Indian mobile numbers for fixtures. */
export const nextPhone = (): string => `+9198000${String(++seq).padStart(5, "0")}`;

export function fd(values: Record<string, string | string[] | undefined>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) form.append(key, v);
  }
  return form;
}

/** Run an action and return the URL it redirected to. Fails if it did not redirect. */
export async function redirectOf(action: Promise<unknown>): Promise<string> {
  try {
    await action;
  } catch (e) {
    if (e instanceof RedirectSignal) return e.url;
    throw e;
  }
  throw new Error("Expected the action to redirect, but it returned normally");
}

// ---------- Fixtures ----------

export async function makeWorker(
  o: { fullName?: string; trade?: TradeValue; visible?: boolean; profile?: boolean } = {},
) {
  const user = await db.user.create({ data: { phone: nextPhone(), role: "WORKER" } });
  const profile =
    o.profile === false
      ? null
      : await db.workerProfile.create({
          data: {
            userId: user.id,
            fullName: o.fullName ?? "Test Worker",
            category: "SKILLED",
            trade: o.trade ?? "FITTER",
            machineTags: ["Lathe"],
            experienceYears: 3,
            currentState: "Uttar Pradesh",
            currentDistrict: "Lucknow",
            visibleInDirectory: o.visible ?? true,
          },
        });
  return { user, profile };
}

export async function makeEmployer(
  o: {
    company?: string;
    kyb?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    credits?: number;
    profile?: boolean;
  } = {},
) {
  const user = await db.user.create({ data: { phone: nextPhone(), role: "EMPLOYER" } });
  const profile =
    o.profile === false
      ? null
      : await db.employerProfile.create({
          data: {
            userId: user.id,
            companyName: o.company ?? "Test Components Pvt Ltd",
            contactPerson: "Anita Verma",
            hrPhone: "+919811100000",
            industrialCluster: "Noida Sector 63",
            city: "Noida",
            state: "Uttar Pradesh",
            gstin: "09ABCDE1234F1Z5",
            kybStatus: o.kyb ?? "VERIFIED",
            huntCredits: o.credits ?? 5,
          },
        });
  return { user, profile };
}

export async function makeAdmin() {
  return db.user.create({ data: { phone: nextPhone(), role: "ADMIN" } });
}

export async function makeJob(
  employerId: string,
  o: { title?: string; status?: "OPEN" | "PAUSED" | "CLOSED" } = {},
) {
  return db.jobPosting.create({
    data: {
      employerId,
      title: o.title ?? "ITI Fitter",
      trade: "FITTER",
      category: "SKILLED",
      openings: 5,
      city: "Noida",
      state: "Uttar Pradesh",
      grossSalaryMonthly: 22000,
      inHandSalaryMonthly: 19500,
      overtimeRatePerHour: 95,
      shiftHours: 8,
      status: o.status ?? "OPEN",
    },
  });
}

export function loginAs(user: { id: string; role: string }): void {
  testCookies.set(COOKIE_NAME, signToken({ userId: user.id, role: user.role as "WORKER" | "EMPLOYER" | "ADMIN" }));
}

export function logout(): void {
  testCookies.clear();
}
