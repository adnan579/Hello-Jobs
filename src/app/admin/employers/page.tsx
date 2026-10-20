import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { reviewEmployerAction } from "@/app/actions/employer";
import { Badge } from "@/components/ui";

export const metadata = { title: "Admin: factory verification" };
export const dynamic = "force-dynamic";

export default async function AdminEmployersPage() {
  await requireAdmin();
  const [pending, reports] = await Promise.all([
    db.employerProfile.findMany({
      where: { kybStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    db.agentFeeReport.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Factory verification</h1>
      <p className="mt-1 text-slate-600">
        Check each GSTIN / Udyam on the official portals before approving. Format checks alone prove nothing.
      </p>

      {pending.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Nothing waiting for review.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pending.map((e: (typeof pending)[number]) => (
            <li key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-lg font-bold">{e.companyName}</p>
              <p className="text-sm text-slate-600">
                {e.industrialCluster}, {e.city}, {e.state} · contact {e.contactPerson}
              </p>
              <p className="mt-2 text-sm">
                GSTIN: <code>{e.gstin ?? "—"}</code> · Udyam: <code>{e.udyamNumber ?? "—"}</code>
              </p>
              <div className="mt-3 flex gap-2">
                {(["VERIFIED", "REJECTED"] as const).map((d) => (
                  <form key={d} action={reviewEmployerAction}>
                    <input type="hidden" name="employerId" value={e.id} />
                    <input type="hidden" name="decision" value={d} />
                    <button
                      type="submit"
                      className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${d === "VERIFIED" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "text-red-700 hover:bg-red-50"}`}
                    >
                      {d === "VERIFIED" ? "Approve" : "Reject"}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-2xl font-bold">Recent agent / fee reports</h2>
      {reports.length === 0 ? (
        <p className="mt-3 text-slate-600">No reports.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {reports.map((r: (typeof reports)[number]) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge tone="red">Report</Badge>
                {r.createdAt.toISOString().slice(0, 10)}
                {r.jobId && <span>· job {r.jobId}</span>}
              </div>
              <p className="mt-2 whitespace-pre-line text-slate-800">{r.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
