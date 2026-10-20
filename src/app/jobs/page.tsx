import Link from "next/link";
import { db } from "@/lib/db";
import JobCard from "@/components/JobCard";
import { INDIAN_STATES, TRADES, TRADE_LABELS, type TradeValue } from "@/lib/constants";

export const metadata = { title: "Factory jobs" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Search = {
  trade?: string;
  state?: string;
  hostel?: string;
  canteen?: string;
  pf?: string;
  minInHand?: string;
  page?: string;
  welcome?: string;
  error?: string;
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const minInHand = Number.parseInt(sp.minInHand ?? "", 10);

  const where = {
    status: "OPEN" as const,
    ...(sp.trade && (TRADES as readonly string[]).includes(sp.trade) ? { trade: sp.trade as TradeValue } : {}),
    ...(sp.state && (INDIAN_STATES as readonly string[]).includes(sp.state) ? { state: sp.state } : {}),
    ...(sp.hostel ? { hasHostel: true } : {}),
    ...(sp.canteen ? { hasCanteen: true } : {}),
    ...(sp.pf ? { hasPfEsi: true } : {}),
    ...(Number.isFinite(minInHand) && minInHand > 0 ? { inHandSalaryMonthly: { gte: minInHand } } : {}),
  };

  const [jobs, total] = await Promise.all([
    db.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        employer: { select: { companyName: true, kybStatus: true, industrialCluster: true } },
      },
    }),
    db.jobPosting.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page" && k !== "welcome" && k !== "error") q.set(k, v);
    q.set("page", String(p));
    return `/jobs?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {sp.welcome && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <strong>Your Trade Card is ready.</strong> Factories can now find you, and you can apply to the jobs below.
        </div>
      )}
      {sp.error === "closed" && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          That job is no longer open.
        </div>
      )}

      <h1 className="text-3xl font-extrabold">Factory jobs</h1>
      <p className="mt-1 text-slate-600">
        Every job shows the in-hand salary and overtime rate up front. No fees, ever.
      </p>

      <form method="get" className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Trade
          <select name="trade" defaultValue={sp.trade ?? ""} className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="">All trades</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {TRADE_LABELS[t].en}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          State
          <select name="state" defaultValue={sp.state ?? ""} className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="">All states</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Minimum in-hand (₹/month)
          <input
            name="minInHand"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={sp.minInHand ?? ""}
            placeholder="e.g. 18000"
            className="mt-1 block min-h-12 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <fieldset className="flex flex-wrap items-end gap-x-4 gap-y-2 text-sm font-medium">
          <legend className="sr-only">Facilities</legend>
          {(
            [
              ["hostel", "Hostel"],
              ["canteen", "Canteen"],
              ["pf", "PF / ESIC"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex min-h-12 items-center gap-2">
              <input type="checkbox" name={name} value="1" defaultChecked={!!sp[name]} className="h-5 w-5 accent-amber-600" />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="min-h-12 rounded-lg bg-amber-500 px-6 font-semibold text-slate-900 hover:bg-amber-400">
            Search jobs
          </button>
          <Link href="/jobs" className="inline-flex min-h-12 items-center rounded-lg px-4 font-medium text-slate-700 hover:bg-slate-100">
            Clear
          </Link>
        </div>
      </form>

      <p className="mt-6 text-sm text-slate-600" aria-live="polite">
        {total} {total === 1 ? "job" : "jobs"} found
      </p>

      {jobs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No jobs match these filters yet. Try removing a filter.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {jobs.map((job: (typeof jobs)[number]) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
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
