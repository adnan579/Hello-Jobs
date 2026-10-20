import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";
import InviteForm from "@/components/InviteForm";
import { Badge } from "@/components/ui";
import { INDIAN_STATES, TRADES, TRADE_LABELS, type TradeValue } from "@/lib/constants";
import { rupees } from "@/lib/format";

export const metadata = { title: "Hunt talent" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Search = {
  trade?: string;
  state?: string;
  tag?: string;
  minExp?: string;
  relocate?: string;
  available?: string;
  page?: string;
};

export default async function HuntPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const user = await requireEmployer("/employer/hunt");
  const employer = user.employerProfile;
  if (!employer) redirect("/employer/onboarding");

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const minExp = Number.parseInt(sp.minExp ?? "", 10);
  const tag = sp.tag?.trim().slice(0, 30);

  const where = {
    visibleInDirectory: true,
    ...(sp.trade && (TRADES as readonly string[]).includes(sp.trade) ? { trade: sp.trade as TradeValue } : {}),
    ...(sp.state && (INDIAN_STATES as readonly string[]).includes(sp.state) ? { currentState: sp.state } : {}),
    ...(tag ? { machineTags: { has: tag } } : {}),
    ...(Number.isFinite(minExp) && minExp > 0 ? { experienceYears: { gte: minExp } } : {}),
    ...(sp.relocate ? { willingToRelocate: true } : {}),
    ...(sp.available ? { availableImmediately: true } : {}),
  };

  const [workers, total, openJobs] = await Promise.all([
    db.workerProfile.findMany({
      where,
      orderBy: [{ ncvtStatus: "asc" }, { experienceYears: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      // No phone, no Aadhaar, no last name: contact is revealed only on invite.
      select: {
        id: true,
        fullName: true,
        trade: true,
        machineTags: true,
        experienceYears: true,
        itiCertified: true,
        ncvtStatus: true,
        currentDistrict: true,
        currentState: true,
        willingToRelocate: true,
        availableImmediately: true,
        expectedSalaryMonthly: true,
        skillVideoUrl: true,
      },
    }),
    db.workerProfile.count({ where }),
    db.jobPosting.findMany({
      where: { employerId: employer.id, status: "OPEN" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const unlocked = employer.kybStatus === "VERIFIED";
  const disabledReason = !unlocked
    ? "Talent Hunt unlocks once your factory is verified."
    : employer.huntCredits <= 0
      ? "You are out of credits."
      : undefined;

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") q.set(k, v);
    q.set("page", String(p));
    return `/employer/hunt?${q.toString()}`;
  };

  const firstNameLastInitial = (full: string) => {
    const parts = full.trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Hunt talent</h1>
          <p className="mt-1 text-slate-600">Find ready-to-join workers and invite them straight to your job.</p>
        </div>
        <Badge tone="slate">{employer.huntCredits} credits left</Badge>
      </div>

      {!unlocked && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          You can browse the directory now. Inviting workers unlocks once your GSTIN / Udyam is verified.{" "}
          <Link href="/employer/onboarding" className="font-semibold underline">
            Check your profile
          </Link>
        </p>
      )}

      <form method="get" className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">
          ITI trade
          <select name="trade" defaultValue={sp.trade ?? ""} className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="">Any trade</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {TRADE_LABELS[t].en}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Current state
          <select name="state" defaultValue={sp.state ?? ""} className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="">Anywhere</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Machine or tool
          <input name="tag" defaultValue={sp.tag ?? ""} placeholder="e.g. CNC" className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 px-3" />
        </label>
        <label className="text-sm font-medium">
          Min. experience (yrs)
          <input name="minExp" type="number" inputMode="numeric" min={0} defaultValue={sp.minExp ?? ""} className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 px-3" />
        </label>
        <label className="flex min-h-12 items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="relocate" value="1" defaultChecked={!!sp.relocate} className="h-5 w-5 accent-amber-600" />
          Willing to relocate
        </label>
        <label className="flex min-h-12 items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="available" value="1" defaultChecked={!!sp.available} className="h-5 w-5 accent-amber-600" />
          Can join immediately
        </label>
        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" className="min-h-12 rounded-lg bg-amber-500 px-6 font-semibold text-slate-900 hover:bg-amber-400">
            Search
          </button>
          <Link href="/employer/hunt" className="inline-flex min-h-12 items-center rounded-lg px-4 font-medium text-slate-700 hover:bg-slate-100">
            Clear
          </Link>
        </div>
      </form>

      <p className="mt-6 text-sm text-slate-600" aria-live="polite">
        {total} {total === 1 ? "worker" : "workers"} found
      </p>

      {workers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No workers match yet. Try fewer filters.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {workers.map((w: (typeof workers)[number]) => (
            <li key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold">
                    {firstNameLastInitial(w.fullName)}{" "}
                    <span className="font-normal text-slate-600">
                      · {TRADE_LABELS[w.trade as TradeValue]?.en} · {w.experienceYears} yrs
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {w.currentDistrict}, {w.currentState}
                    {w.expectedSalaryMonthly ? ` · expects ${rupees(w.expectedSalaryMonthly)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {w.ncvtStatus === "VERIFIED" && <Badge tone="green">NCVT verified</Badge>}
                  {w.itiCertified && w.ncvtStatus !== "VERIFIED" && <Badge>ITI (unverified)</Badge>}
                  {w.availableImmediately && <Badge tone="green">Can join now</Badge>}
                  {w.willingToRelocate && <Badge>Will relocate</Badge>}
                </div>
              </div>
              {w.machineTags.length > 0 && (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Machines:</span> {w.machineTags.join(", ")}
                </p>
              )}
              {w.skillVideoUrl && (
                <p className="mt-1 text-sm">
                  <a href={w.skillVideoUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-amber-800 underline">
                    Watch work video
                  </a>
                </p>
              )}
              <div className="mt-3">
                <InviteForm workerId={w.id} jobs={openJobs} disabledReason={disabledReason} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4 text-sm font-medium">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100">
              ← Previous
            </Link>
          )}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
