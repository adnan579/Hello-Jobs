"use client";

import { useActionState } from "react";
import { reportAgentFeeAction, type FormState } from "@/app/actions/worker";
import { Field, FormMessage, SubmitButton } from "@/components/ui";

export default function ReportForm({ jobId }: { jobId?: string }) {
  const [state, action] = useActionState<FormState, FormData>(reportAgentFeeAction, {});

  if (state.ok) {
    return (
      <p role="status" className="text-lg font-semibold text-emerald-800">
        Thank you. Your report has been recorded. Please do not pay anyone.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {jobId && <input type="hidden" name="jobId" value={jobId} />}
      <Field label="What happened?" name="description" error={state.errors?.description} hint="Who asked, how much, and for what.">
        <textarea
          id="description"
          name="description"
          rows={6}
          required
          minLength={10}
          maxLength={2000}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton className="w-full" pendingText="Sending…">
        Send report
      </SubmitButton>
    </form>
  );
}
