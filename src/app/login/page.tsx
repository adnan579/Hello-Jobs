import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser, homeFor, safeNext } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const { role, next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next, homeFor(user)));

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold">Log in or sign up</h1>
      <p className="mt-2 text-slate-600">
        Just your mobile number. No resume, no password, and <strong>never any fee</strong>.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <LoginForm initialRole={role === "EMPLOYER" ? "EMPLOYER" : "WORKER"} next={next ? safeNext(next, "") || undefined : undefined} />
      </div>
    </div>
  );
}
