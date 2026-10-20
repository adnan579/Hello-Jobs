import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { applyToJobAction } from "@/app/actions/worker";
import { Badge, SubmitButton } from "@/components/ui";
import {
  CATEGORY_LABELS,
  STAGE_LABELS,
  TRADE_LABELS,
  type CategoryValue,
  type StageValue,
  type TradeValue,
} from "@/lib/constants";
import { formatPhone } from "@/lib/phone";
import { rupees, takeHomePercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobPosting.findUnique({ where: { id }, select: { title: true } });
  return { title: job?.title ?? "Job" };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobPosting.findUnique({
    where: { id },
    include: { employer: true },
  });
  if (!job) notFound();

  const user = await getCurrentUser();
  const isWorker = user?.role === "WORKER";
  const existing =
    isWorker && user?.workerProfile
      ? await db.jobInteraction.findUnique({
          where: { jobId_workerId: { jobId: job.id, workerId: user.workerProfile.id } },
        })
      : null;

  const open = job.status === "OPEN";
  const trade = TRADE_LABELS[job.trade as TradeValue]?.en ?? job.trade;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/jobs" className="text-sm font-medium text-amber-800 hover:underline">
        ← All jobs
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{job.title}</h1>
          <p className="mt-1 text-slate-600">
            {job.employer.companyName} · {job.employer.industrialCluster}, {job.city}, {job.state}
          </p>
        </div>
        {job.employer.kybStatus === "VERIFIED" ? (
          <Badge tone="green">Verified factory</Badge>
        ) : (
          <Badge tone="amber">Verification pending</Badge>
        )}
      </div>

      {!open && (
        <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-slate-700">
          This job is not accepting applications right now.
        </p>
      )}

      <section aria-labelledby="pay" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="pay" className="text-lg font-bold">
          Pay, exactly
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-slate-600">In-hand / month</dt>
            <dd className="text-2xl font-extrabold">{rupees(job.inHandSalaryMonthly)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Gross / month</dt>
            <dd className="text-2xl font-extrabold">{rupees(job.grossSalaryMonthly)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Overtime</dt>
            <dd className="text-2xl font-extrabold">{rupees(job.overtimeRatePerHour)}/hr</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Shift</dt>
            <dd className="text-2xl font-extrabold">{job.shiftHours} hrs</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-slate-500">
          Take-home is {takeHomePercent(job.grossSalaryMonthly, job.inHandSalaryMonthly)}% of gross. The factory pays you
          directly. No agent can take a cut.
        </p>
      </section>

      <section aria-labelledby="facilities" className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="facilities" className="text-lg font-bold">
          Facilities
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              [job.hasHostel, "Free hostel / room"],
              [job.hasCanteen, "Subsidised canteen"],
              [job.hasPfEsi, "PF and ESIC"],
              [job.hasTravelAllowance, "Travel allowance"],
            ] as const
          ).map(([on, label]) => (
            <li key={label} className={on ? "font-medium text-emerald-800" : "text-slate-400 line-through"}>
              {on ? "✓" : "✗"} {label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="role" className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="role" className="text-lg font-bold">
          The role
        </h2>
        <p className="mt-2 text-slate-700">
          {job.openings} {job.openings === 1 ? "opening" : "openings"} · {trade} ·{" "}
          {CATEGORY_LABELS[job.category as CategoryValue]} · {job.minExperienceYears}+ years experience
        </p>
        {job.description && <p className="mt-3 whitespace-pre-line text-slate-700">{job.description}</p>}
      </section>

      <section className="mt-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
        {existing ? (
          <p className="text-lg font-semibold">
            {existing.source === "EMPLOYER_HUNT" ? "This factory invited you." : "You applied."} Status:{" "}
            {STAGE_LABELS[existing.stage as StageValue]}.{" "}
            <Link href="/worker" className="underline">
              See your applications
            </Link>
          </p>
        ) : user?.role === "EMPLOYER" || user?.role === "ADMIN" ? (
          <p className="text-slate-700">Log in with a worker number to apply.</p>
        ) : open ? (
          <div className="flex flex-wrap items-center gap-3">
            {isWorker ? (
              <form action={applyToJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <SubmitButton pendingText="Applying…">Apply in one tap</SubmitButton>
              </form>
            ) : (
              <Link
                href={`/login?role=WORKER&next=${encodeURIComponent(`/jobs/${job.id}`)}`}
                className="inline-flex min-h-12 items-center rounded-lg bg-amber-500 px-5 py-3 font-semibold text-slate-900 hover:bg-amber-400"
              >
                Log in to apply
              </Link>
            )}
            {isWorker && (
              <a
                href={`tel:${job.employer.hrPhone}`}
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-slate-900 px-5 py-3 font-semibold hover:bg-slate-900 hover:text-white"
              >
                Call HR · {formatPhone(job.employer.hrPhone)}
              </a>
            )}
          </div>
        ) : null}
        <p className="mt-3 text-sm text-slate-700">
          Asked for money to get this job?{" "}
          <Link href={`/report?jobId=${job.id}`} className="font-semibold text-red-700 underline">
            Report it. This is free and we act on it.
          </Link>
        </p>
      </section>
    </div>
  );
}
