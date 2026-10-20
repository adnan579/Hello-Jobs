import { redirect } from "next/navigation";
import JobForm from "@/components/JobForm";
import { requireEmployer } from "@/lib/auth";

export const metadata = { title: "Post a job" };
export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const user = await requireEmployer("/employer/jobs/new");
  if (!user.employerProfile) redirect("/employer/onboarding");
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Post a job</h1>
      <p className="mt-2 text-slate-600">Post bulk requirements in one go, e.g. 25 ITI Fitters.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <JobForm defaultCity={user.employerProfile.city} defaultState={user.employerProfile.state} />
      </div>
    </div>
  );
}
