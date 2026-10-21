import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  createJobAction,
  inviteWorkerAction,
  moveInteractionAction,
  reviewEmployerAction,
  saveEmployerProfileAction,
  setJobStatusAction,
} from "@/app/actions/employer";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { fd, loginAs, logout, makeAdmin, makeEmployer, makeJob, makeWorker, redirectOf } from "./helpers";

const profileForm = (over: Record<string, string | undefined> = {}) =>
  fd({
    companyName: "Shakti Auto Components",
    contactPerson: "Anita Verma",
    hrPhone: "98111 00002",
    industrialCluster: "Noida Sector 63",
    city: "Noida",
    state: "Uttar Pradesh",
    gstin: "09ABCDE1234F1Z5",
    udyamNumber: "",
    ...over,
  });

const jobForm = (over: Record<string, string | undefined> = {}) =>
  fd({
    title: "ITI Fitter - Assembly",
    trade: "FITTER",
    category: "SKILLED",
    openings: "25",
    city: "Noida",
    state: "Uttar Pradesh",
    minExperienceYears: "1",
    grossSalaryMonthly: "22000",
    inHandSalaryMonthly: "19500",
    overtimeRatePerHour: "95",
    shiftHours: "8",
    hasHostel: "on",
    ...over,
  });

describe("saveEmployerProfileAction (factory verification submission)", () => {
  it("registers a factory with a GSTIN as PENDING review and audits the submission", async () => {
    const { user } = await makeEmployer({ profile: false });
    loginAs(user);
    expect(await redirectOf(saveEmployerProfileAction({}, profileForm()))).toBe("/employer?welcome=1");

    const p = await db.employerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(p).toMatchObject({ hrPhone: "+919811100002", kybStatus: "PENDING", gstin: "09ABCDE1234F1Z5", huntCredits: 5 });
    const entry = await db.auditLog.findFirstOrThrow({ where: { action: "KYB_SUBMITTED" } });
    expect(entry.entityId).toBe(p.id);
    expect(entry.metadata).toEqual({ hasGstin: true, hasUdyam: false });
  });

  it("stays UNVERIFIED (not in the review queue) when no GSTIN or Udyam is given", async () => {
    const { user } = await makeEmployer({ profile: false });
    loginAs(user);
    await redirectOf(saveEmployerProfileAction({}, profileForm({ gstin: "" })));
    const p = await db.employerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(p.kybStatus).toBe("UNVERIFIED");
    expect(await db.auditLog.count({ where: { action: "KYB_SUBMITTED" } })).toBe(0);
  });

  it("rejects a malformed GSTIN", async () => {
    const { user } = await makeEmployer({ profile: false });
    loginAs(user);
    const r = await saveEmployerProfileAction({}, profileForm({ gstin: "NOTAGSTIN" }));
    expect(r.errors?.gstin).toBeTruthy();
    expect(await db.employerProfile.count()).toBe(0);
  });

  it("keeps VERIFIED when the IDs are unchanged but resets to PENDING when they change", async () => {
    const { user, profile } = await makeEmployer({ kyb: "VERIFIED" });
    loginAs(user);
    await redirectOf(saveEmployerProfileAction({}, profileForm({ companyName: "Renamed Pvt Ltd" })));
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: profile!.id } })).kybStatus).toBe("VERIFIED");

    await redirectOf(saveEmployerProfileAction({}, profileForm({ gstin: "27ABCDE1234F1Z5" })));
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: profile!.id } })).kybStatus).toBe("PENDING");
  });

  it("does not let a worker account register a factory", async () => {
    const { user } = await makeWorker();
    loginAs(user);
    expect(await redirectOf(saveEmployerProfileAction({}, profileForm()))).toBe("/");
    expect(await db.employerProfile.count()).toBe(0);
  });
});

describe("createJobAction", () => {
  it("posts a wage-transparent job", async () => {
    const { user, profile } = await makeEmployer();
    loginAs(user);
    expect(await redirectOf(createJobAction({}, jobForm()))).toBe("/employer?posted=1");
    const job = await db.jobPosting.findFirstOrThrow();
    expect(job).toMatchObject({
      employerId: profile!.id,
      openings: 25,
      grossSalaryMonthly: 22000,
      inHandSalaryMonthly: 19500,
      overtimeRatePerHour: 95,
      hasHostel: true,
      hasCanteen: false,
      status: "OPEN",
    });
  });

  it("rejects in-hand pay above gross, and missing pay fields", async () => {
    const { user } = await makeEmployer();
    loginAs(user);
    const high = await createJobAction({}, jobForm({ inHandSalaryMonthly: "30000" }));
    expect(high.errors?.inHandSalaryMonthly).toMatch(/more than gross/i);
    const missing = await createJobAction({}, jobForm({ overtimeRatePerHour: undefined }));
    expect(missing.errors?.overtimeRatePerHour).toBeTruthy();
    expect(await db.jobPosting.count()).toBe(0);
  });

  it("sends a factory without a profile to onboarding", async () => {
    const { user } = await makeEmployer({ profile: false });
    loginAs(user);
    expect(await redirectOf(createJobAction({}, jobForm()))).toBe("/employer/onboarding");
  });
});

describe("setJobStatusAction", () => {
  it("only the owning factory can change a job's status", async () => {
    const owner = await makeEmployer({ company: "Owner" });
    const rival = await makeEmployer({ company: "Rival" });
    const job = await makeJob(owner.profile!.id);

    loginAs(rival.user);
    await redirectOf(setJobStatusAction(fd({ jobId: job.id, status: "CLOSED" })));
    expect((await db.jobPosting.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("OPEN");
    expect(await db.auditLog.count({ where: { action: "JOB_STATUS_CHANGED" } })).toBe(0);

    loginAs(owner.user);
    await redirectOf(setJobStatusAction(fd({ jobId: job.id, status: "PAUSED" })));
    expect((await db.jobPosting.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("PAUSED");
    expect(await db.auditLog.count({ where: { action: "JOB_STATUS_CHANGED", entityId: job.id } })).toBe(1);
  });

  it("ignores unknown statuses", async () => {
    const { user, profile } = await makeEmployer();
    const job = await makeJob(profile!.id);
    loginAs(user);
    await redirectOf(setJobStatusAction(fd({ jobId: job.id, status: "DELETED" })));
    expect((await db.jobPosting.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("OPEN");
  });
});

describe("moveInteractionAction (hiring pipeline)", () => {
  async function setup() {
    const employer = await makeEmployer();
    const job = await makeJob(employer.profile!.id);
    const worker = await makeWorker();
    const interaction = await db.jobInteraction.create({
      data: { jobId: job.id, workerId: worker.profile!.id, employerId: employer.profile!.id, source: "WORKER_APPLY" },
    });
    return { employer, job, worker, interaction };
  }
  const stageOf = async (id: string) => (await db.jobInteraction.findUniqueOrThrow({ where: { id } })).stage;

  it("walks shortlisted → offered → joined, auditing each step", async () => {
    const { employer, interaction } = await setup();
    loginAs(employer.user);
    for (const to of ["SHORTLISTED", "OFFERED", "JOINED"]) {
      expect(await redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to })))).toBe("/employer");
      expect(await stageOf(interaction.id)).toBe(to);
    }
    const entries = await db.auditLog.findMany({ where: { action: "STAGE_CHANGED" }, orderBy: { createdAt: "asc" } });
    expect(entries.map((e: { metadata: unknown }) => e.metadata)).toEqual([
      { from: "INITIATED", to: "SHORTLISTED" },
      { from: "SHORTLISTED", to: "OFFERED" },
      { from: "OFFERED", to: "JOINED" },
    ]);
  });

  it("blocks skipping stages and leaving final stages", async () => {
    const { employer, interaction } = await setup();
    loginAs(employer.user);
    expect(await redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to: "JOINED" })))).toBe(
      "/employer?error=stage",
    );
    expect(await stageOf(interaction.id)).toBe("INITIATED");

    await redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to: "REJECTED" })));
    expect(await redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to: "SHORTLISTED" })))).toBe(
      "/employer?error=stage",
    );
    expect(await stageOf(interaction.id)).toBe("REJECTED");
  });

  it("another factory cannot move someone else's candidates", async () => {
    const { interaction } = await setup();
    const rival = await makeEmployer({ company: "Rival" });
    loginAs(rival.user);
    await redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to: "SHORTLISTED" })));
    expect(await stageOf(interaction.id)).toBe("INITIATED");
    expect(await db.auditLog.count({ where: { action: "STAGE_CHANGED" } })).toBe(0);
  });

  it("two simultaneous clicks cannot both apply (compare-and-set)", async () => {
    const { employer, interaction } = await setup();
    loginAs(employer.user);
    const results = await Promise.all([
      redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to: "SHORTLISTED" }))),
      redirectOf(moveInteractionAction(fd({ interactionId: interaction.id, to: "REJECTED" }))),
    ]);
    expect(results.filter((u) => u === "/employer")).toHaveLength(1);
    expect(results.filter((u) => u === "/employer?error=stage")).toHaveLength(1);
    expect(["SHORTLISTED", "REJECTED"]).toContain(await stageOf(interaction.id));
    expect(await db.auditLog.count({ where: { action: "STAGE_CHANGED" } })).toBe(1);
  });
});

describe("inviteWorkerAction (Hunt Employees)", () => {
  it("spends one credit, creates an EMPLOYER_HUNT interaction, and audits the contact reveal without personal data", async () => {
    const employer = await makeEmployer({ credits: 3 });
    const job = await makeJob(employer.profile!.id);
    const worker = await makeWorker({ fullName: "Sunil Yadav" });
    loginAs(employer.user);

    const r = await inviteWorkerAction({}, fd({ workerId: worker.profile!.id, jobId: job.id }));
    expect(r).toEqual({ ok: true });

    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).huntCredits).toBe(2);
    const row = await db.jobInteraction.findFirstOrThrow();
    expect(row).toMatchObject({ source: "EMPLOYER_HUNT", stage: "INITIATED", workerId: worker.profile!.id });

    const entry = await db.auditLog.findFirstOrThrow({ where: { action: "CONTACT_REVEALED_ON_INVITE" } });
    expect(entry.actorId).toBe(employer.user.id);
    expect(entry.entityId).toBe(row.id);
    const serialised = JSON.stringify(entry);
    expect(serialised).not.toContain(worker.user.phone);
    expect(serialised).not.toContain("Sunil");
  });

  it("is locked until the factory is verified, and costs nothing when refused", async () => {
    const employer = await makeEmployer({ kyb: "PENDING", credits: 3 });
    const job = await makeJob(employer.profile!.id);
    const worker = await makeWorker();
    loginAs(employer.user);

    const r = await inviteWorkerAction({}, fd({ workerId: worker.profile!.id, jobId: job.id }));
    expect(r.error).toMatch(/verified/i);
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).huntCredits).toBe(3);
    expect(await db.jobInteraction.count()).toBe(0);
  });

  it("refuses duplicate invites without spending a second credit", async () => {
    const employer = await makeEmployer({ credits: 3 });
    const job = await makeJob(employer.profile!.id);
    const worker = await makeWorker();
    loginAs(employer.user);
    const form = () => fd({ workerId: worker.profile!.id, jobId: job.id });

    expect(await inviteWorkerAction({}, form())).toEqual({ ok: true });
    const again = await inviteWorkerAction({}, form());
    expect(again.error).toMatch(/already/i);
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).huntCredits).toBe(2);
    expect(await db.jobInteraction.count()).toBe(1);
  });

  it("stops at zero credits", async () => {
    const employer = await makeEmployer({ credits: 0 });
    const job = await makeJob(employer.profile!.id);
    const worker = await makeWorker();
    loginAs(employer.user);
    const r = await inviteWorkerAction({}, fd({ workerId: worker.profile!.id, jobId: job.id }));
    expect(r.error).toMatch(/out of/i);
    expect(await db.jobInteraction.count()).toBe(0);
  });

  it("never spends more credits than the factory has, even with simultaneous invites", async () => {
    const employer = await makeEmployer({ credits: 2 });
    const job = await makeJob(employer.profile!.id);
    const workers = await Promise.all([1, 2, 3, 4, 5].map((i) => makeWorker({ fullName: `Worker ${i}` })));
    loginAs(employer.user);

    const results = await Promise.all(
      workers.map((w) => inviteWorkerAction({}, fd({ workerId: w.profile!.id, jobId: job.id }))),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(results.filter((r) => r.error)).toHaveLength(3);
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).huntCredits).toBe(0);
    expect(await db.jobInteraction.count()).toBe(2);
    expect(await db.auditLog.count({ where: { action: "CONTACT_REVEALED_ON_INVITE" } })).toBe(2);
  });

  it("only invites to the factory's own open jobs, and only visible workers", async () => {
    const employer = await makeEmployer({ credits: 5 });
    const rival = await makeEmployer({ company: "Rival" });
    const ownPaused = await makeJob(employer.profile!.id, { status: "PAUSED" });
    const rivalJob = await makeJob(rival.profile!.id);
    const ownOpen = await makeJob(employer.profile!.id, { title: "Open" });
    const visible = await makeWorker();
    const hidden = await makeWorker({ visible: false });
    loginAs(employer.user);

    expect((await inviteWorkerAction({}, fd({ workerId: visible.profile!.id, jobId: ownPaused.id }))).error).toBeTruthy();
    expect((await inviteWorkerAction({}, fd({ workerId: visible.profile!.id, jobId: rivalJob.id }))).error).toBeTruthy();
    expect((await inviteWorkerAction({}, fd({ workerId: hidden.profile!.id, jobId: ownOpen.id }))).error).toMatch(
      /no longer available/i,
    );
    expect((await inviteWorkerAction({}, fd({ workerId: visible.profile!.id, jobId: "" }))).error).toBeTruthy();
    expect(await db.jobInteraction.count()).toBe(0);
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).huntCredits).toBe(5);
  });
});

describe("reviewEmployerAction (admin factory verification)", () => {
  it("lets an admin approve a pending factory and audits the decision", async () => {
    const admin = await makeAdmin();
    const employer = await makeEmployer({ kyb: "PENDING" });
    loginAs(admin);
    expect(
      await redirectOf(reviewEmployerAction(fd({ employerId: employer.profile!.id, decision: "VERIFIED" }))),
    ).toBe("/admin/employers");
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).kybStatus).toBe(
      "VERIFIED",
    );
    const entry = await db.auditLog.findFirstOrThrow({ where: { action: "KYB_REVIEWED" } });
    expect(entry).toMatchObject({ actorId: admin.id, actorRole: "ADMIN", entityId: employer.profile!.id });
    expect(entry.metadata).toEqual({ decision: "VERIFIED" });
  });

  it("only acts on factories that are actually waiting for review", async () => {
    const admin = await makeAdmin();
    const verified = await makeEmployer({ kyb: "VERIFIED" });
    loginAs(admin);
    await redirectOf(reviewEmployerAction(fd({ employerId: verified.profile!.id, decision: "REJECTED" })));
    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: verified.profile!.id } })).kybStatus).toBe(
      "VERIFIED",
    );
    expect(await db.auditLog.count({ where: { action: "KYB_REVIEWED" } })).toBe(0);
  });

  it("is admin-only", async () => {
    const employer = await makeEmployer({ kyb: "PENDING" });
    const form = () => fd({ employerId: employer.profile!.id, decision: "VERIFIED" });

    // A factory cannot approve itself.
    loginAs(employer.user);
    expect(await redirectOf(reviewEmployerAction(form()))).toBe("/");
    // Nor can a worker.
    const worker = await makeWorker();
    loginAs(worker.user);
    expect(await redirectOf(reviewEmployerAction(form()))).toBe("/");
    // Nor a logged-out visitor.
    logout();
    expect(await redirectOf(reviewEmployerAction(form()))).toMatch(/^\/login/);

    expect((await db.employerProfile.findUniqueOrThrow({ where: { id: employer.profile!.id } })).kybStatus).toBe(
      "PENDING",
    );
  });
});

describe("audit()", () => {
  it("commits and rolls back together with the surrounding transaction", async () => {
    await expect(
      db.$transaction(async (tx: Prisma.TransactionClient) => {
        await audit({ action: "LOGIN", entityType: "User", entityId: "x" }, tx);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await db.auditLog.count()).toBe(0);

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await audit({ action: "LOGIN", entityType: "User", entityId: "x" }, tx);
    });
    expect(await db.auditLog.count()).toBe(1);
  });
});
