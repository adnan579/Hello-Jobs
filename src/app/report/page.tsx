import ReportForm from "@/components/ReportForm";

export const metadata = { title: "Report an agent or fee demand" };

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Report an agent</h1>
      <p className="mt-2 text-slate-600">
        Hello Jobs is free for workers. If anyone asked you for a registration fee, a joining fee, or a cut of your salary,
        tell us what happened. You do not need to log in.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <ReportForm jobId={jobId} />
      </div>
    </div>
  );
}
