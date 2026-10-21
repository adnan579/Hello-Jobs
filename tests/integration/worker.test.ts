import { describe, expect, it } from "vitest";
import {
  applyToJobAction,
  deleteWorkerAccountAction,
  reportAgentFeeAction,
  saveWorkerProfileAction,
  withdrawInteractionAction,
} from "@/app/actions/worker";
import { db } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/session";
import { fd, loginAs, makeEmployer, makeJob, makeWorker, nextPhone, redirectOf, testCookies } from "./helpers";

const profileForm = (over: Record<string, string | string[] | undefined> = {}) =>
  fd({
    fullName: "Ramesh Kumar",
    category: "SKILLED",
    trade: "FITTER",
    machineTags: "CNC, Lathe, cnc",
    experienceYears: "4",
    itiCertified: "on",
    currentState: "Uttar Pradesh",
    currentDistrict: "Lucknow",
    willingToRelocate: "on",
    expectedSalaryMonthly: "20000",
    skillVideoUrl: "",
    visibleInDirectory: "on",
    ...over,
  });

describe("saveWorkerProfileAction", () => {
  it("creates a Trade Card for a new worker", async () => {
    const { user } = await makeWorker({ profile: false });
    loginAs(user);
    const url = await redirectOf(saveWorkerProfileAction({}, profileForm()));
    expect(url).toBe("/jobs?welcome=1");

    const p = await db.workerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(p.fullName).toBe("Ramesh Kumar");
    expect(p.machineTags).toEqual(["CNC", "Lathe", "cnc"]);
    expect(p.itiCertified).toBe(true);
    expect(p.availableImmediately).toBe(false); // unchecked box
    expect(p.ncvtStatus).toBe("UNVERIFIED");
  });

  it("returns field errors and saves nothing when the form is invalid", async () => {
    const { user } = await makeWorker({ profile: false });
    loginAs(user);
    const r = await saveWorkerProfileAction({}, profileForm({ fullName: "", trade: undefined }));
    expect(r.errors?.fullName).toBeTruthy();
    expect(r.errors?.trade).toBeTruthy();
    expect(await db.workerProfile.count()).toBe(0);
  });

  it("never marks an NCVT roll number as verified on its own, and keeps admin-verified status if unchanged", async () => {
    const { user } = await makeWorker({ profile: false });
    loginAs(user);
    await redirectOf(saveWorkerProfileAction({}, profileForm({ ncvtRollNumber: "up2019fit1234" })));
    let p = await db.workerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(p.ncvtRollNumber).toBe("UP2019FIT1234");
    expect(p.ncvtStatus).toBe("PENDING");

    await db.workerProfile.update({ where: { id: p.id }, data: { ncvtStatus: "VERIFIED" } });
    await redirectOf(saveWorkerProfileAction({}, profileForm({ ncvtRollNumber: "UP2019FIT1234", fullName: "Ramesh K" })));
    p = await db.workerProfile.findUniqueOrThrow({ where: { id: p.id } });
    expect(p.ncvtStatus).toBe("VERIFIED");

    await redirectOf(saveWorkerProfileAction({}, profileForm({ ncvtRollNumber: "UP2020FIT9999" })));
    p = await db.workerProfile.findUniqueOrThrow({ where: { id: p.id } });
    expect(p.ncvtStatus).toBe("PENDING");
  });

  it("does not let a factory account create a Trade Card", async () => {
    const { user } = await makeEmployer();
    loginAs(user);
    expect(await redirectOf(saveWorkerProfileAction({}, profileForm()))).toBe("/");
    expect(await db.workerProfile.count()).toBe(0);
  });

  it("sends logged-out visitors to log in", async () => {
    const url = await redirectOf(saveWorkerProfileAction({}, profileForm()));
    expect(url).toMatch(/^\/login/);
  });
});

describe("applyToJobAction", () => {
  async function setup() {
    const { profile: employer } = await makeEmployer();
    const job = await makeJob(employer!.id);
    const { user, profile } = await makeWorker();
    loginAs(user);
    return { employer: employer!, job, user, profile: profile! };
  }

  it("applies, creating one WORKER_APPLY interaction and an audit entry", async () => {
    const { job, user, profile } = await setup();
    expect(await redirectOf(applyToJobAction(fd({ jobId: job.id })))).toBe("/worker?applied=1");

    const rows = await db.jobInteraction.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ jobId: job.id, workerId: profile.id, source: "WORKER_APPLY", stage: "INITIATED" });
    expect(await db.auditLog.count({ where: { action: "WORKER_APPLIED", actorId: user.id } })).toBe(1);
  });

  it("is idempotent, including a double-tap at the same instant", async () => {
    const { job } = await setup();
    const results = await Promise.allSettled([
      redirectOf(applyToJobAction(fd({ jobId: job.id }))),
      redirectOf(applyToJobAction(fd({ jobId: job.id }))),
    ]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    await redirectOf(applyToJobAction(fd({ jobId: job.id })));
    expect(await db.jobInteraction.count()).toBe(1);
    expect(await db.auditLog.count({ where: { action: "WORKER_APPLIED" } })).toBe(1);
  });

  it("keeps an existing factory invite as it is instead of overwriting it", async () => {
    const { job, employer, profile } = await setup();
    await db.jobInteraction.create({
      data: { jobId: job.id, workerId: profile.id, employerId: employer.id, source: "EMPLOYER_HUNT", stage: "SHORTLISTED" },
    });
    await redirectOf(applyToJobAction(fd({ jobId: job.id })));
    const rows = await db.jobInteraction.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ source: "EMPLOYER_HUNT", stage: "SHORTLISTED" });
  });

  it("refuses paused or closed jobs", async () => {
    const { employer } = await setup();
    const paused = await makeJob(employer.id, { status: "PAUSED" });
    expect(await redirectOf(applyToJobAction(fd({ jobId: paused.id })))).toBe("/jobs?error=closed");
    expect(await redirectOf(applyToJobAction(fd({ jobId: "does-not-exist" })))).toBe("/jobs?error=closed");
    expect(await db.jobInteraction.count()).toBe(0);
  });

  it("asks a worker without a Trade Card to build one first", async () => {
    const { employer } = await setup();
    const job = await makeJob(employer.id, { title: "Another" });
    const { user } = await makeWorker({ profile: false });
    loginAs(user);
    expect(await redirectOf(applyToJobAction(fd({ jobId: job.id })))).toBe("/worker/onboarding");
    expect(await db.jobInteraction.count()).toBe(0);
  });
});

describe("withdrawInteractionAction", () => {
  it("lets a worker withdraw only their own open application", async () => {
    const { profile: employer } = await makeEmployer();
    const job = await makeJob(employer!.id);
    const a = await makeWorker({ fullName: "A" });
    const b = await makeWorker({ fullName: "B" });
    const interaction = await db.jobInteraction.create({
      data: { jobId: job.id, workerId: a.profile!.id, employerId: employer!.id, source: "WORKER_APPLY" },
    });

    loginAs(b.user);
    await redirectOf(withdrawInteractionAction(fd({ interactionId: interaction.id })));
    expect((await db.jobInteraction.findUniqueOrThrow({ where: { id: interaction.id } })).stage).toBe("INITIATED");

    loginAs(a.user);
    await redirectOf(withdrawInteractionAction(fd({ interactionId: interaction.id })));
    expect((await db.jobInteraction.findUniqueOrThrow({ where: { id: interaction.id } })).stage).toBe("WITHDRAWN");
    const entry = await db.auditLog.findFirstOrThrow({ where: { action: "STAGE_CHANGED", entityId: interaction.id } });
    expect(entry.metadata).toEqual({ from: "INITIATED", to: "WITHDRAWN" });
  });

  it("cannot withdraw after joining", async () => {
    const { profile: employer } = await makeEmployer();
    const job = await makeJob(employer!.id);
    const w = await makeWorker();
    const joined = await db.jobInteraction.create({
      data: { jobId: job.id, workerId: w.profile!.id, employerId: employer!.id, source: "WORKER_APPLY", stage: "JOINED" },
    });
    loginAs(w.user);
    await redirectOf(withdrawInteractionAction(fd({ interactionId: joined.id })));
    expect((await db.jobInteraction.findUniqueOrThrow({ where: { id: joined.id } })).stage).toBe("JOINED");
  });
});

describe("deleteWorkerAccountAction (delete my data)", () => {
  it("requires typing DELETE", async () => {
    const { user } = await makeWorker();
    loginAs(user);
    const r = await deleteWorkerAccountAction({}, fd({ confirm: "nope" }));
    expect(r.errors?.confirm).toBeTruthy();
    expect(await db.user.count({ where: { id: user.id } })).toBe(1);
  });

  it("removes the account, profile, applications and login codes; keeps only a PII-free audit entry and the detached report", async () => {
    const { profile: employer } = await makeEmployer();
    const job = await makeJob(employer!.id);
    const me = await makeWorker({ fullName: "Delete Me" });
    const other = await makeWorker({ fullName: "Keep Me" });
    await db.jobInteraction.create({
      data: { jobId: job.id, workerId: me.profile!.id, employerId: employer!.id, source: "WORKER_APPLY" },
    });
    await db.jobInteraction.create({
      data: { jobId: job.id, workerId: other.profile!.id, employerId: employer!.id, source: "WORKER_APPLY" },
    });
    await db.otpChallenge.create({
      data: { phone: me.user.phone, codeHash: "x", expiresAt: new Date(Date.now() + 60_000) },
    });
    await db.agentFeeReport.create({ data: { description: "Agent asked for 5000 rupees", reporterId: me.user.id } });

    loginAs(me.user);
    expect(await redirectOf(deleteWorkerAccountAction({}, fd({ confirm: "delete" })))).toBe("/?deleted=1");

    expect(await db.user.count({ where: { id: me.user.id } })).toBe(0);
    expect(await db.workerProfile.count({ where: { id: me.profile!.id } })).toBe(0);
    expect(await db.jobInteraction.count({ where: { workerId: me.profile!.id } })).toBe(0);
    expect(await db.otpChallenge.count({ where: { phone: me.user.phone } })).toBe(0);
    expect(testCookies.get(COOKIE_NAME)).toBeUndefined();

    // Another worker is untouched.
    expect(await db.workerProfile.count({ where: { id: other.profile!.id } })).toBe(1);
    expect(await db.jobInteraction.count({ where: { workerId: other.profile!.id } })).toBe(1);

    // The abuse report survives, but is no longer linked to the person.
    const report = await db.agentFeeReport.findFirstOrThrow();
    expect(report.reporterId).toBeNull();

    // The audit trail records the deletion without personal data.
    const entry = await db.auditLog.findFirstOrThrow({ where: { action: "ACCOUNT_DELETED" } });
    expect(entry.entityId).toBe(me.user.id);
    expect(entry.metadata).toEqual({ hadProfile: true, interactionCount: 1 });
    const serialised = JSON.stringify(entry);
    expect(serialised).not.toContain(me.user.phone);
    expect(serialised).not.toContain("Delete Me");
  });

  it("logged-out visitors cannot delete anything", async () => {
    const { user } = await makeWorker();
    expect(await redirectOf(deleteWorkerAccountAction({}, fd({ confirm: "DELETE" })))).toMatch(/^\/login/);
    expect(await db.user.count({ where: { id: user.id } })).toBe(1);
  });
});

describe("reportAgentFeeAction", () => {
  it("accepts anonymous reports", async () => {
    const r = await reportAgentFeeAction({}, fd({ description: "They asked me for 5000 rupees to join" }));
    expect(r.ok).toBe(true);
    const row = await db.agentFeeReport.findFirstOrThrow();
    expect(row.reporterId).toBeNull();
  });

  it("links the report to a logged-in worker and validates length", async () => {
    const { user } = await makeWorker();
    loginAs(user);
    expect((await reportAgentFeeAction({}, fd({ description: "short" }))).errors?.description).toBeTruthy();
    await reportAgentFeeAction({}, fd({ description: "Supervisor wanted a cut of my salary", jobId: "abc" }));
    const row = await db.agentFeeReport.findFirstOrThrow();
    expect(row).toMatchObject({ reporterId: user.id, jobId: "abc" });
  });

  it("phone helper numbers are unique across fixtures", () => {
    expect(nextPhone()).not.toBe(nextPhone());
  });
});
