import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireWorker } from "@/lib/auth";
import { withdrawInteractionAction } from "@/app/actions/worker";
import { Badge } from "@/components/ui";
import { STAGE_LABELS, TRADE_LABELS, type StageValue, type TradeValue } from "@/lib/constants";
import { canWorkerWithdraw } from "@/lib/pipeline";
import { rupees } from "@/lib/format";

export const metadata = { title: "My applications" };
export const dynamic = "force-dynamic";

const stageTone = (s: StageValue) =>
  s === "JOINED" || s === "OFFERED" ? "green" : s === "REJECTED" || s === "WITHDRAWN" ? "red" : s === "SHORTLISTED" ? "amber" : "slate";

export default async function WorkerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; applied?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireWorker("/worker");
  const profile = user.workerProfile;
  if (!profile) redirect("/worker/onboarding");

  const interactions = await db.jobInteraction.findMany({
    where: { workerId: profile.id },
    orderBy: { updatedAt: "desc" },
    include: { job: { include: { employer: { select: { companyName: true, hrPhone: true } } } } },
  });
  const invites = interactions.filter((i: (typeof interactions)[number]) => i.source === "EMPLOYER_HUNT" && i.stage === "INITIATED");
  const rest = interactions.filter((i: (typeof interactions)[number]) => !invites.includes(i));

  const ncvt =
    profile.ncvtStatus === "VERIFIED" ? (
      <Badge tone="green">NCVT verified</Badge>
    ) : profile.ncvtStatus === "PENDING" ? (
      <Badge tone="amber">NCVT under review</Badge>
    ) : null;

  const row = (i: (typeof interactions)[number]) => (
    <li key={i.id} className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/jobs/${i.job.id}`} className="text-lg font-bold hover:underline">
            {i.job.title}
          </Link>
          <p className="text-sm text-slate-600">
            {i.job.employer.companyName} · {i.job.city} · {rupees(i.job.inHandSalaryMonthly)} in hand
          </p>
        </div>
        <Badge tone={stageTone(i.stage as StageValue)}>{STAGE_LABELS[i.stage as StageValue]}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {i.source === "EMPLOYER_HUNT" ? "The factory found you and invited you" : "You applied"}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={`tel:${i.job.employer.hrPhone}`} className="inline-flex min-h-11 items-center rounded-lg border-2 border-slate-900 px-4 text-sm font-semibold hover:bg-slate-900 hover:text-white">
          Call HR
        </a>
        {canWorkerWithdraw(i.stage as StageValue) && (
          <form action={withdrawInteractionAction}>
            <input type="hidden" name="interactionId" value={i.id} />
            <button type="submit" className="min-h-11 rounded-lg px-4 text-sm font-medium text-red-700 hover:bg-red-50">
              {i.source === "EMPLOYER_HUNT" && i.stage === "INITIATED" ? "Not interested" : "Withdraw"}
            </button>
          </form>
        )}
      </div>
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {sp.saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 font-medium text-emerald-900">Trade Card saved.</p>}
      {sp.applied && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 font-medium text-emerald-900">Applied. The factory can now see your Trade Card.</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{profile.fullName}</h1>
            <p className="text-slate-600">
              {TRADE_LABELS[profile.trade as TradeValue]?.en} · {profile.experienceYears} yrs · {profile.currentDistrict}, {profile.currentState}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ncvt}
            {profile.visibleInDirectory ? <Badge tone="green">Visible to factories</Badge> : <Badge>Hidden from factories</Badge>}
          </div>
        </div>
        <Link href="/worker/onboarding" className="mt-3 inline-block text-sm font-semibold text-amber-800 underline">
          Edit Trade Card
        </Link>
      </section>

      {invites.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Factories that want you ({invites.length})</h2>
          <ul className="mt-3 space-y-3">{invites.map(row)}</ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold">Your applications</h2>
        {rest.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            You have not applied anywhere yet.{" "}
            <Link href="/jobs" className="font-semibold text-amber-800 underline">
              Browse jobs
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-3">{rest.map(row)}</ul>
        )}
      </section>
    </div>
  );
}
