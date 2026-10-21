"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AUDIT, audit } from "@/lib/audit";
import { homeFor, safeNext } from "@/lib/auth";
import { sendOtp, verifyOtp } from "@/lib/otp";
import { createSession, destroySession } from "@/lib/session";
import {
  fieldErrors,
  formToObject,
  requestOtpSchema,
  verifyOtpSchema,
  type FieldErrors,
} from "@/lib/validation";

export type AuthState = {
  step: "phone" | "code";
  phone?: string;
  role?: "WORKER" | "EMPLOYER";
  next?: string;
  devCode?: string;
  error?: string;
  errors?: FieldErrors;
};

export async function requestOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = formToObject(formData);
  const next = typeof raw.next === "string" ? raw.next : undefined;
  const parsed = requestOtpSchema.safeParse(raw);
  if (!parsed.success) {
    return { step: "phone", next, errors: fieldErrors(parsed.error) };
  }
  const { phone, role } = parsed.data;

  // A number belongs to exactly one role. Say so before sending a code.
  const existing = await db.user.findUnique({ where: { phone }, select: { role: true } });
  if (existing && existing.role !== role && existing.role !== "ADMIN") {
    const other = existing.role === "WORKER" ? "a worker" : "a factory";
    return {
      step: "phone",
      next,
      error: `This number is already registered as ${other}. Use a different number or switch the option above.`,
    };
  }

  const sent = await sendOtp(phone);
  if (!sent.ok) return { step: "phone", next, error: sent.error };
  return { step: "code", phone, role, next, devCode: sent.devCode };
}

export async function verifyOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = formToObject(formData);
  const next = typeof raw.next === "string" ? raw.next : undefined;
  const parsed = verifyOtpSchema.safeParse(raw);
  if (!parsed.success) {
    const phone = typeof raw.phone === "string" ? raw.phone : undefined;
    const role = raw.role === "EMPLOYER" ? "EMPLOYER" : "WORKER";
    return { step: "code", phone, role, next, errors: fieldErrors(parsed.error) };
  }
  const { phone, role, code } = parsed.data;

  const result = await verifyOtp(phone, code);
  if (!result.ok) return { step: "code", phone, role, next, error: result.error };

  let user = await db.user.findUnique({
    where: { phone },
    include: { workerProfile: true, employerProfile: true },
  });
  if (!user) {
    user = await db.user.create({
      data: { phone, role },
      include: { workerProfile: true, employerProfile: true },
    });
  }

  await createSession({ userId: user.id, role: user.role });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: AUDIT.LOGIN,
    entityType: "User",
    entityId: user.id,
  });
  redirect(safeNext(next, homeFor(user)));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
