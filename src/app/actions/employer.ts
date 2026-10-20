"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, requireEmployer } from "@/lib/auth";
import { canEmployerMove } from "@/lib/pipeline";
import { STAGES, type StageValue } from "@/lib/constants";
import {
  employerProfileSchema,
  fieldErrors,
  formToObject,
  jobPostingSchema,
} from "@/lib/validation";
import type { FormState } from "./worker";

export async function saveEmployerProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireEmployer("/employer/onboarding");
  const parsed = employerProfileSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const existing = user.employerProfile;
  const idsChanged =
    !!existing && (existing.gstin !== (d.gstin ?? null) || existing.udyamNumber !== (d.udyamNumber ?? null));

  // Changing GSTIN/Udyam resets verification. Having at least one ID puts the
  // factory in the admin review queue; having none leaves it unverified.
  let kybStatus = existing?.kybStatus ?? "UNVERIFIED";
  if (!existing || idsChanged) kybStatus = d.gstin || d.udyamNumber ? "PENDING" : "UNVERIFIED";

  const fields = {
    companyName: d.companyName,
    contactPerson: d.contactPerson,
    hrPhone: d.hrPhone,
    industrialCluster: d.industrialCluster,
    city: d.city,
    state: d.state,
    gstin: d.gstin ?? null,
    udyamNumber: d.udyamNumber ?? null,
    kybStatus,
  };

  await db.employerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...fields },
    update: fields,
  });

  revalidatePath("/employer");
  redirect(existing ? "/employer?saved=1" : "/employer?welcome=1");
}

export async function createJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireEmployer("/employer/jobs/new");
  if (!user.employerProfile) redirect("/employer/onboarding");

  const parsed = jobPostingSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  await db.jobPosting.create({
    data: {
      employerId: user.employerProfile.id,
      title: d.title,
      trade: d.trade,
      category: d.category,
      openings: d.openings,
      city: d.city,
      state: d.state,
      description: d.description ?? null,
      minExperienceYears: d.minExperienceYears,
      grossSalaryMonthly: d.grossSalaryMonthly,
      inHandSalaryMonthly: d.inHandSalaryMonthly,
      overtimeRatePerHour: d.overtimeRatePerHour,
      shiftHours: d.shiftHours,
      hasHostel: d.hasHostel,
      hasCanteen: d.hasCanteen,
      hasPfEsi: d.hasPfEsi,
      hasTravelAllowance: d.hasTravelAllowance,
    },
  });

  revalidatePath("/employer");
  revalidatePath("/jobs");
  redirect("/employer?posted=1");
}

export async function setJobStatusAction(formData: FormData): Promise<void> {
  const jobId = String(formData.get("jobId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["OPEN", "PAUSED", "CLOSED"].includes(status)) redirect("/employer");

  const user = await requireEmployer("/employer");
  if (!user.employerProfile) redirect("/employer/onboarding");

  // updateMany with the owner in the filter = ownership check + update in one step.
  await db.jobPosting.updateMany({
    where: { id: jobId, employerId: user.employerProfile.id },
    data: { status: status as "OPEN" | "PAUSED" | "CLOSED" },
  });
  revalidatePath("/employer");
  revalidatePath("/jobs");
  redirect("/employer");
}

export async function moveInteractionAction(formData: FormData): Promise<void> {
  const interactionId = String(formData.get("interactionId") ?? "");
  const to = String(formData.get("to") ?? "") as StageValue;
  if (!STAGES.includes(to)) redirect("/employer");

  const user = await requireEmployer("/employer");
  if (!user.employerProfile) redirect("/employer/onboarding");

  const interaction = await db.jobInteraction.findUnique({ where: { id: interactionId } });
  if (!interaction || interaction.employerId !== user.employerProfile.id) redirect("/employer");
  if (!canEmployerMove(interaction.stage as StageValue, to)) redirect("/employer?error=stage");

  await db.jobInteraction.update({ where: { id: interaction.id }, data: { stage: to } });
  revalidatePath("/employer");
  redirect("/employer");
}

export type InviteState = { ok?: boolean; error?: string };

/**
 * Outbound "Hunt Employees": invite a directory worker to one of your open jobs.
 * Costs one hunt credit and reveals the worker's phone to this employer.
 */
export async function inviteWorkerAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const workerId = String(formData.get("workerId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");

  const user = await requireEmployer("/employer/hunt");
  const employer = user.employerProfile;
  if (!employer) redirect("/employer/onboarding");

  if (employer.kybStatus !== "VERIFIED") {
    return { error: "Talent Hunt unlocks once your GSTIN / Udyam is verified." };
  }
  if (!jobId) return { error: "Choose which job you are inviting for." };

  const [job, worker] = await Promise.all([
    db.jobPosting.findFirst({ where: { id: jobId, employerId: employer.id, status: "OPEN" } }),
    db.workerProfile.findFirst({ where: { id: workerId, visibleInDirectory: true } }),
  ]);
  if (!job) return { error: "That job is not open or does not belong to you." };
  if (!worker) return { error: "This worker is no longer available." };

  try {
    const result = await db.$transaction(async (tx: Prisma.TransactionClient): Promise<InviteState> => {
      const existing = await tx.jobInteraction.findUnique({
        where: { jobId_workerId: { jobId: job.id, workerId: worker.id } },
      });
      if (existing) return { error: "This worker has already applied or been invited for this job." };

      // Atomic credit spend: only succeeds if a credit is actually left.
      const spent = await tx.employerProfile.updateMany({
        where: { id: employer.id, huntCredits: { gt: 0 } },
        data: { huntCredits: { decrement: 1 } },
      });
      if (spent.count === 0) return { error: "You are out of Talent Hunt credits." };

      await tx.jobInteraction.create({
        data: {
          jobId: job.id,
          workerId: worker.id,
          employerId: employer.id,
          source: "EMPLOYER_HUNT",
        },
      });
      return { ok: true };
    });
    if (result.ok) {
      revalidatePath("/employer");
      revalidatePath("/employer/hunt");
    }
    return result;
  } catch {
    // Unique (jobId, workerId) raced with another request; the transaction rolled back the credit.
    return { error: "This worker has already been invited for this job." };
  }
}

// ---------- Admin: factory verification (KYB) ----------

export async function reviewEmployerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const employerId = String(formData.get("employerId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "VERIFIED" && decision !== "REJECTED") redirect("/admin/employers");

  await db.employerProfile.update({ where: { id: employerId }, data: { kybStatus: decision } });
  revalidatePath("/admin/employers");
  redirect("/admin/employers");
}
