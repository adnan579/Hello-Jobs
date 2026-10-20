import Link from "next/link";
import { Badge } from "@/components/ui";
import { TRADE_LABELS, type TradeValue } from "@/lib/constants";
import { rupees, takeHomePercent } from "@/lib/format";

export type JobCardData = {
  id: string;
  title: string;
  trade: string;
  city: string;
  state: string;
  openings: number;
  grossSalaryMonthly: number;
  inHandSalaryMonthly: number;
  overtimeRatePerHour: number;
  shiftHours: number;
  hasHostel: boolean;
  hasCanteen: boolean;
  hasPfEsi: boolean;
  hasTravelAllowance: boolean;
  employer: { companyName: string; kybStatus: string; industrialCluster: string };
};

export default function JobCard({ job }: { job: JobCardData }) {
  const trade = TRADE_LABELS[job.trade as TradeValue]?.en ?? job.trade;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold leading-snug">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h2>
          <p className="text-sm text-slate-600">
            {job.employer.companyName} · {job.employer.industrialCluster}, {job.city}, {job.state}
          </p>
        </div>
        {job.employer.kybStatus === "VERIFIED" ? (
          <Badge tone="green">Verified factory</Badge>
        ) : (
          <Badge tone="amber">Verification pending</Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-amber-50 p-3 text-center">
        <div>
          <div className="text-xs font-medium text-slate-600">In-hand / month</div>
          <div className="text-xl font-extrabold text-slate-900">{rupees(job.inHandSalaryMonthly)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">Overtime</div>
          <div className="text-xl font-extrabold text-slate-900">{rupees(job.overtimeRatePerHour)}/hr</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">Shift</div>
          <div className="text-xl font-extrabold text-slate-900">{job.shiftHours} hrs</div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Gross {rupees(job.grossSalaryMonthly)} · take-home is{" "}
        {takeHomePercent(job.grossSalaryMonthly, job.inHandSalaryMonthly)}% of gross
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{trade}</Badge>
        <Badge>{job.openings} {job.openings === 1 ? "opening" : "openings"}</Badge>
        {job.hasHostel && <Badge tone="green">Free hostel</Badge>}
        {job.hasCanteen && <Badge tone="green">Canteen</Badge>}
        {job.hasPfEsi && <Badge tone="green">PF / ESIC</Badge>}
        {job.hasTravelAllowance && <Badge tone="green">Travel allowance</Badge>}
      </div>

      <Link
        href={`/jobs/${job.id}`}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        View details & apply
      </Link>
    </article>
  );
}
