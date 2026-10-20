import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";
import { moveInteractionAction, setJobStatusAction } from "@/app/actions/employer";
import { Badge } from "@/components/ui";
import { STAGE_LABELS, TRADE_LABELS, type StageValue, type TradeValue } from "@/lib/constants";
import { employerNextStages } from "@/lib/pipeline";
import { formatPhone } from "@/lib/phone";
import { rupees } from "@/lib/format";

export const metadata = { title: "Factory dashboard" };
export const dynamic = "force-dynamic";

const NEXT_LABEL: Partial<Record<StageValue, string>> = {
  SHORTLISTED: "Shortlist",
  OFFERED: "Send offer",
  JOINED: "Mark joined",
  REJECTED: "Reject",
};

export default async function EmployerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; welcome?: string; posted?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireEmployer("/employer");
  const employer = user.employerProfile;
  if (!employer) redirect("/employer/onboarding");

  const [jobs, interactions] = await Promise.all([
    db.jobPosting.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { interactions: true } } },
    }),
    db.jobInteraction.findMany({
      where: { employerId: employer.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        job: { select: { title: true } },
        worker: { include: { user: { select: { phone: true } } } },
      },
    }),
  ]);

  const kyb =
    employer.kybStatus === "VERIFIED" ? (
      <Badge tone="green">Verified factory</Badge>
    ) : employer.kybStatus === "PENDING" ? (
      <Badge tone="amber">Verification under review</Badge>
    ) : employer.kybStatus === "REJECTED" ? (
      <Badge tone="red">Verification rejected</Badge>
    ) : (
      <Badge>Not verified</Badge>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {(sp.saved || sp.welcome || sp.posted) && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 font-medium text-emerald-900">
          {sp.posted ? "Job posted. Workers can see it now." : sp.welcome ? "Factory registered." : "Profile saved."}
        </p>
      )}
      {sp.error === "stage" && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 font-medium text-red-800">
          That move is not allowed from the current stage.
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{employer.companyName}</h1>
            <p className="text-slate-600">
              {employer.industrialCluster}, {employer.city}, {employer.state}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {kyb}
            <Badge tone="slate">{employer.huntCredits} Talent Hunt credits</Badge>
          </div>
        </div>
        {employer.kybStatus !== "VERIFIED" && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {employer.kybStatus === "PENDING"
              ? "We are checking your GSTIN / Udyam. Talent Hunt unlocks once verified."
              : "Add your GSTIN or Udyam number to get verified and unlock Talent Hunt."}{" "}
            <Link href="/employer/onboarding" className="font-semibold underline">
              Edit profile
            </Link>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/employer/jobs/new" className="inline-flex min-h-12 items-center rounded-lg bg-amber-500 px-5 font-semibold text-slate-900 hover:bg-amber-400">
            Post a job
          </Link>
          <Link href="/employer/hunt" className="inline-flex min-h-12 items-center rounded-lg border-2 border-slate-900 px-5 font-semibold hover:bg-slate-900 hover:text-white">
            Hunt talent
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Your jobs</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No jobs yet. Post your first one.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {jobs.map((j: (typeof jobs)[number]) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                  <Link href={`/jobs/${j.id}`} className="font-bold hover:underline">
                    {j.title}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {j.openings} openings · {rupees(j.inHandSalaryMonthly)} in hand · {j._count.interactions} in pipeline
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={j.status === "OPEN" ? "green" : j.status === "PAUSED" ? "amber" : "slate"}>{j.status}</Badge>
                  {(["OPEN", "PAUSED", "CLOSED"] as const)
                    .filter((s) => s !== j.status)
                    .map((s) => (
                      <form key={s} action={setJobStatusAction}>
                        <input type="hidden" name="jobId" value={j.id} />
                        <input type="hidden" name="status" value={s} />
                        <button type="submit" className="min-h-10 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                          {s === "OPEN" ? "Reopen" : s === "PAUSED" ? "Pause" : "Close"}
                        </button>
                      </form>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Candidates</h2>
        {interactions.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            Applications and invites will show up here.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {interactions.map((i: (typeof interactions)[number]) => {
              const next = employerNextStages(i.stage as StageValue);
              return (
                <li key={i.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">
                        {i.worker.fullName}{" "}
                        <span className="font-normal text-slate-600">
                          · {TRADE_LABELS[i.worker.trade as TradeValue]?.en} · {i.worker.experienceYears} yrs
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        For {i.job.title} · {i.source === "EMPLOYER_HUNT" ? "You invited" : "Applied"} ·{" "}
                        {i.worker.currentDistrict}, {i.worker.currentState}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {i.worker.ncvtStatus === "VERIFIED" && <Badge tone="green">NCVT verified</Badge>}
                      <Badge tone={i.stage === "JOINED" || i.stage === "OFFERED" ? "green" : i.stage === "REJECTED" || i.stage === "WITHDRAWN" ? "red" : "slate"}>
                        {STAGE_LABELS[i.stage as StageValue]}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {i.stage !== "WITHDRAWN" && (
                      <a href={`tel:${i.worker.user.phone}`} className="inline-flex min-h-10 items-center rounded-lg border-2 border-slate-900 px-3 text-sm font-semibold hover:bg-slate-900 hover:text-white">
                        Call {formatPhone(i.worker.user.phone)}
                      </a>
                    )}
                    {next.map((to) => (
                      <form key={to} action={moveInteractionAction}>
                        <input type="hidden" name="interactionId" value={i.id} />
                        <input type="hidden" name="to" value={to} />
                        <button
                          type="submit"
                          className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${to === "REJECTED" ? "text-red-700 hover:bg-red-50" : "bg-amber-500 text-slate-900 hover:bg-amber-400"}`}
                        >
                          {NEXT_LABEL[to]}
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
