import EmployerProfileForm from "@/components/EmployerProfileForm";
import { requireEmployer } from "@/lib/auth";

export const metadata = { title: "Factory profile" };
export const dynamic = "force-dynamic";

export default async function EmployerOnboardingPage() {
  const user = await requireEmployer("/employer/onboarding");
  const p = user.employerProfile;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{p ? "Edit factory profile" : "Register your factory"}</h1>
      <p className="mt-2 text-slate-600">Hire workers directly. No contractor cut, no hidden fees.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <EmployerProfileForm defaults={p ?? undefined} />
      </div>
    </div>
  );
}
