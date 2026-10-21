import Link from "next/link";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import { requireWorker } from "@/lib/auth";

export const metadata = { title: "Delete my data" };
export const dynamic = "force-dynamic";

export default async function WorkerAccountPage() {
  await requireWorker("/worker/account");
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/worker" className="text-sm font-medium text-amber-800 hover:underline">
        ← Back to my applications
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">Delete my data</h1>
      <p className="mt-2 text-slate-700">This permanently removes:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
        <li>your account and mobile number</li>
        <li>your Trade Card (name, trade, experience, location, work video link)</li>
        <li>all your applications and factory invites</li>
      </ul>
      <p className="mt-3 text-slate-700">
        Factories will no longer see you. Reports you filed against agents stay, but are no longer linked to you.
        We keep a record that an account was deleted, with no personal details. This cannot be undone.
      </p>
      <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5">
        <DeleteAccountForm />
      </div>
    </div>
  );
}
