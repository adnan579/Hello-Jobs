"use client";

import { useActionState } from "react";
import { deleteWorkerAccountAction, type FormState } from "@/app/actions/worker";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui";

export default function DeleteAccountForm() {
  const [state, action] = useActionState<FormState, FormData>(deleteWorkerAccountAction, {});

  return (
    <form action={action} className="space-y-4">
      <Field label="Type DELETE to confirm" name="confirm" error={state.errors?.confirm}>
        <TextInput name="confirm" autoComplete="off" autoCapitalize="characters" required error={state.errors?.confirm} />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton
        className="w-full bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-700 sm:w-auto"
        pendingText="Deleting…"
      >
        Permanently delete my account
      </SubmitButton>
    </form>
  );
}
