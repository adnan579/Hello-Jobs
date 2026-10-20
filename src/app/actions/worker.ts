"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireWorker } from "@/lib/auth";
import { canWorkerWithdraw } from "@/lib/pipeline";
import type { StageValue } from "@/lib/constants";
import {
  agentReportSchema,
  fieldErrors,
  formToObject,
  workerProfileSchema,
  type FieldErrors,
} from "@/lib/validation";

export type FormState = {
  ok?: boolean;
  error?: string;
  errors?: FieldErrors;
};

export async function saveWorkerProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireWorker("/worker/onboarding");
  const parsed = workerProfileSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // We never mark credentials VERIFIED here — that needs the NCVT/DigiLocker
  // integration or an admin check. A submitted roll number is PENDING review.
  const existing = user.workerProfile;
  let ncvtStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" = "UNVERIFIED";
  if (data.ncvtRollNumber) {
    ncvtStatus =
      existing?.ncvtRollNumber === data.ncvtRollNumber ? existing.ncvtStatus : "PENDING";
  }

  const fields = {
    fullName: data.fullName,
    category: data.category,
    trade: data.trade,
    machineTags: data.machineTags,
    experienceYears: data.experienceYears,
    itiCertified: data.itiCertified,
    ncvtRollNumber: data.ncvtRollNumber ?? null,
    ncvtStatus,
    currentState: data.currentState,
    currentDistrict: data.currentDistrict,
    willingToRelocate: data.willingToRelocate,
    preferredStates: data.preferredStates,
    expectedSalaryMonthly: data.expectedSalaryMonthly ?? null,
    availableImmediately: data.availableImmediately,
    skillVideoUrl: data.skillVideoUrl ?? null,
    visibleInDirectory: data.visibleInDirectory,
  };

  await db.workerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...fields },
    update: fields,
  });

  revalidatePath("/worker");
  revalidatePath("/jobs");
  redirect(existing ? "/worker?saved=1" : "/jobs?welcome=1");
}

export async function applyToJobAction(formData: FormData): Promise<void> {
  const jobId = String(formData.get("jobId") ?? "");
  const user = await requireWorker(`/jobs/${jobId}`);
  if (!user.workerProfile) redirect("/worker/onboarding");

  const job = await db.jobPosting.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "OPEN") redirect("/jobs?error=closed");

  // One interaction per worker per job. If the factory already invited this
  // worker, applying again just takes them to the existing conversation.
  await db.jobInteraction.upsert({
    where: { jobId_workerId: { jobId: job.id, workerId: user.workerProfile.id } },
    create: {
      jobId: job.id,
      workerId: user.workerProfile.id,
      employerId: job.employerId,
      source: "WORKER_APPLY",
    },
    update: {},
  });

  revalidatePath("/worker");
  redirect("/worker?applied=1");
}

export async function withdrawInteractionAction(formData: FormData): Promise<void> {
  const interactionId = String(formData.get("interactionId") ?? "");
  const user = await requireWorker("/worker");
  if (!user.workerProfile) redirect("/worker/onboarding");

  const interaction = await db.jobInteraction.findUnique({ where: { id: interactionId } });
  if (!interaction || interaction.workerId !== user.workerProfile.id) redirect("/worker");
  if (!canWorkerWithdraw(interaction.stage as StageValue)) redirect("/worker");

  await db.jobInteraction.update({
    where: { id: interaction.id },
    data: { stage: "WITHDRAWN" },
  });
  revalidatePath("/worker");
  redirect("/worker");
}

/** Anti-exploitation SOS. Works for logged-out users too — fear of retaliation is real. */
export async function reportAgentFeeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = agentReportSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const user = await getCurrentUser();
  await db.agentFeeReport.create({
    data: {
      description: parsed.data.description,
      jobId: parsed.data.jobId ?? null,
      reporterId: user?.id ?? null,
    },
  });
  return { ok: true };
}
