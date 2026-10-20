import WorkerProfileForm from "@/components/WorkerProfileForm";
import { requireWorker } from "@/lib/auth";

export const metadata = { title: "Your Trade Card" };
export const dynamic = "force-dynamic";

export default async function WorkerOnboardingPage() {
  const user = await requireWorker("/worker/onboarding");
  const p = user.workerProfile;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{p ? "Edit your Trade Card" : "Build your Trade Card"}</h1>
      <p className="mt-2 text-slate-600">About two minutes. No resume needed.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <WorkerProfileForm defaults={p ?? undefined} />
      </div>
    </div>
  );
}
