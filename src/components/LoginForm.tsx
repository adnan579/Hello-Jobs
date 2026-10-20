"use client";

import { useActionState } from "react";
import {
  requestOtpAction,
  verifyOtpAction,
  type AuthState,
} from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui";

export default function LoginForm({
  initialRole,
  next,
}: {
  initialRole: "WORKER" | "EMPLOYER";
  next?: string;
}) {
  const [requestState, requestAction] = useActionState<AuthState, FormData>(requestOtpAction, {
    step: "phone",
    next,
  });
  const [verifyState, verifyAction] = useActionState<AuthState, FormData>(verifyOtpAction, {
    step: "code",
  });

  // Once a code was requested, show the code step. Verify errors replace its state.
  const onCodeStep = requestState.step === "code";
  const codeState = verifyState.error || verifyState.errors ? verifyState : requestState;

  if (onCodeStep) {
    return (
      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="phone" value={requestState.phone} />
        <input type="hidden" name="role" value={requestState.role} />
        {next && <input type="hidden" name="next" value={next} />}

        <p className="text-slate-700">
          We sent a 4-digit code to <strong>{requestState.phone}</strong>.
        </p>
        {requestState.devCode && (
          <p className="rounded-lg border border-dashed border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
            Development mode — your code is <strong className="text-lg tracking-widest">{requestState.devCode}</strong>
          </p>
        )}

        <Field label="4-digit code" name="code" error={codeState.errors?.code}>
          <TextInput
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            pattern="\d{4}"
            placeholder="••••"
            required
            autoFocus
            className="text-center text-2xl tracking-[0.5em]"
            error={codeState.errors?.code}
          />
        </Field>
        <FormMessage error={verifyState.error} />
        <SubmitButton className="w-full" pendingText="Checking…">
          Verify and continue
        </SubmitButton>
      </form>
    );
  }

  return (
    <form action={requestAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-800">I am a</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["WORKER", "Worker", "ITI / helper / operator"],
              ["EMPLOYER", "Factory", "Hiring for a plant"],
            ] as const
          ).map(([value, title, sub]) => (
            <label
              key={value}
              className="cursor-pointer rounded-lg border-2 border-slate-200 bg-white p-3 text-center has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50"
            >
              <input
                type="radio"
                name="role"
                value={value}
                defaultChecked={initialRole === value}
                className="sr-only"
              />
              <span className="block text-base font-bold">{title}</span>
              <span className="block text-xs text-slate-500">{sub}</span>
            </label>
          ))}
        </div>
        {requestState.errors?.role && (
          <p role="alert" className="mt-1 text-sm font-medium text-red-700">
            {requestState.errors.role}
          </p>
        )}
      </fieldset>

      <Field label="Mobile number" name="phone" error={requestState.errors?.phone} hint="We will send a 4-digit code.">
        <TextInput
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98765 43210"
          required
          error={requestState.errors?.phone}
        />
      </Field>
      <FormMessage error={requestState.error} />
      <SubmitButton className="w-full" pendingText="Sending code…">
        Send code
      </SubmitButton>
    </form>
  );
}
