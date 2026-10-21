"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AUDIT, audit } from "@/lib/audit";
import { getCurrentUser, requireWorker } from "@/lib/auth";
import { destroySession } from "@/lib/session";
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
  // worker (or the worker already applied), applying again just takes them to
  // the existing conversation.
  const workerId = user.workerProfile.id;
  try {
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.jobInteraction.findUnique({
        where: { jobId_workerId: { jobId: job.id, workerId } },
      });
      if (existing) return;
      const created = await tx.jobInteraction.create({
        data: { jobId: job.id, workerId, employerId: job.employerId, source: "WORKER_APPLY" },
      });
      await audit(
        {
          actorId: user.id,
          actorRole: "WORKER",
          action: AUDIT.WORKER_APPLIED,
          entityType: "JobInteraction",
          entityId: created.id,
          metadata: { jobId: job.id, employerId: job.employerId },
        },
        tx,
      );
    });
  } catch (e) {
    // Two taps at once: the unique (jobId, workerId) rule already did its job.
    if ((e as { code?: string }).code !== "P2002") throw e;
  }

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

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.jobInteraction.update({
      where: { id: interaction.id },
      data: { stage: "WITHDRAWN" },
    });
    await audit(
      {
        actorId: user.id,
        actorRole: "WORKER",
        action: AUDIT.STAGE_CHANGED,
        entityType: "JobInteraction",
        entityId: interaction.id,
        metadata: { from: interaction.stage, to: "WITHDRAWN" },
      },
      tx,
    );
  });
  revalidatePath("/worker");
  redirect("/worker");
}

/**
 * "Delete my data": permanently removes the worker's account, Trade Card,
 * applications and invites. Reports they filed are kept but detached from them
 * (the abuse record matters more than the link). Only an audit entry with no
 * personal data remains.
 */
export async function deleteWorkerAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireWorker("/worker/account");

  const confirmation = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirmation !== "DELETE") {
    return { errors: { confirm: 'Type DELETE to confirm' } };
  }

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const interactionCount = user.workerProfile
      ? await tx.jobInteraction.count({ where: { workerId: user.workerProfile.id } })
      : 0;
    await audit(
      {
        actorId: user.id,
        actorRole: "WORKER",
        action: AUDIT.ACCOUNT_DELETED,
        entityType: "User",
        entityId: user.id,
        metadata: { hadProfile: !!user.workerProfile, interactionCount },
      },
      tx,
    );
    // Login codes are keyed by phone number, so they go too.
    await tx.otpChallenge.deleteMany({ where: { phone: user.phone } });
    // Cascades to WorkerProfile and JobInteraction; AgentFeeReport.reporterId becomes null.
    await tx.user.delete({ where: { id: user.id } });
  });

  await destroySession();
  redirect("/?deleted=1");
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
