"use client";

import { useActionState } from "react";
import { inviteWorkerAction, type InviteState } from "@/app/actions/employer";
import { SubmitButton } from "@/components/ui";

export default function InviteForm({
  workerId,
  jobs,
  disabledReason,
}: {
  workerId: string;
  jobs: Array<{ id: string; title: string }>;
  disabledReason?: string;
}) {
  const [state, action] = useActionState<InviteState, FormData>(inviteWorkerAction, {});

  if (state.ok) {
    return (
      <p role="status" className="text-sm font-semibold text-emerald-800">
        Invite sent. Their number is now on your dashboard.
      </p>
    );
  }
  if (disabledReason) return <p className="text-sm text-slate-500">{disabledReason}</p>;
  if (jobs.length === 0) return <p className="text-sm text-slate-500">Post an open job to invite workers.</p>;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="workerId" value={workerId} />
      <label className="sr-only" htmlFor={`job-${workerId}`}>
        Job to invite for
      </label>
      <select
        id={`job-${workerId}`}
        name="jobId"
        defaultValue={jobs[0]?.id}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
      >
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </select>
      <SubmitButton className="min-h-11 px-4 py-2 text-sm" pendingText="Inviting…">
        Invite (1 credit)
      </SubmitButton>
      {state.error && (
        <p role="alert" className="w-full text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
