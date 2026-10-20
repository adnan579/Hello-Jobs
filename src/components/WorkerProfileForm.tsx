"use client";

import { useActionState } from "react";
import { saveWorkerProfileAction, type FormState } from "@/app/actions/worker";
import { Checkbox, Field, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABELS, INDIAN_STATES, TRADES, TRADE_LABELS } from "@/lib/constants";

export type WorkerProfileDefaults = {
  fullName?: string;
  category?: string;
  trade?: string;
  machineTags?: string[];
  experienceYears?: number;
  itiCertified?: boolean;
  ncvtRollNumber?: string | null;
  currentState?: string;
  currentDistrict?: string;
  willingToRelocate?: boolean;
  preferredStates?: string[];
  expectedSalaryMonthly?: number | null;
  availableImmediately?: boolean;
  skillVideoUrl?: string | null;
  visibleInDirectory?: boolean;
};

const stateOptions = INDIAN_STATES.map((s) => ({ value: s, label: s }));

export default function WorkerProfileForm({ defaults = {} }: { defaults?: WorkerProfileDefaults }) {
  const [state, action] = useActionState<FormState, FormData>(saveWorkerProfileAction, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-xl font-bold">About you</h2>
        <Field label="Full name" name="fullName" error={e.fullName}>
          <TextInput name="fullName" defaultValue={defaults.fullName} autoComplete="name" required error={e.fullName} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current state" name="currentState" error={e.currentState}>
            <SelectInput name="currentState" options={stateOptions} placeholder="Choose state" defaultValue={defaults.currentState} required error={e.currentState} />
          </Field>
          <Field label="District" name="currentDistrict" error={e.currentDistrict}>
            <TextInput name="currentDistrict" defaultValue={defaults.currentDistrict} required error={e.currentDistrict} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Your trade</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" name="category" error={e.category}>
            <SelectInput
              name="category"
              options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              placeholder="Choose category"
              defaultValue={defaults.category}
              required
              error={e.category}
            />
          </Field>
          <Field label="Trade" name="trade" error={e.trade}>
            <SelectInput
              name="trade"
              options={TRADES.map((t) => ({ value: t, label: `${TRADE_LABELS[t].en} (${TRADE_LABELS[t].hi})` }))}
              placeholder="Choose trade"
              defaultValue={defaults.trade}
              required
              error={e.trade}
            />
          </Field>
        </div>
        <Field label="Years of floor experience" name="experienceYears" error={e.experienceYears}>
          <TextInput name="experienceYears" type="number" inputMode="numeric" min={0} max={50} defaultValue={defaults.experienceYears ?? 0} required error={e.experienceYears} />
        </Field>
        <Field label="Machines and tools you can run" name="machineTags" error={e.machineTags} hint="Separate with commas, e.g. CNC, Lathe, MIG welding">
          <TextInput name="machineTags" defaultValue={defaults.machineTags?.join(", ")} error={e.machineTags} />
        </Field>
        <Checkbox name="itiCertified" label="I have an ITI certificate" defaultChecked={defaults.itiCertified} />
        <Field label="NCVT/SCVT roll number (optional)" name="ncvtRollNumber" error={e.ncvtRollNumber} hint="We check this against the certificate. A badge appears once verified.">
          <TextInput name="ncvtRollNumber" defaultValue={defaults.ncvtRollNumber ?? ""} autoCapitalize="characters" error={e.ncvtRollNumber} />
        </Field>
        <Field label="Link to your 30-second work video (optional)" name="skillVideoUrl" error={e.skillVideoUrl} hint="A video showing you running a machine or welding a joint. Paste an https link.">
          <TextInput name="skillVideoUrl" type="url" inputMode="url" placeholder="https://" defaultValue={defaults.skillVideoUrl ?? ""} error={e.skillVideoUrl} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">What you want</h2>
        <Field label="Expected in-hand salary per month, ₹ (optional)" name="expectedSalaryMonthly" error={e.expectedSalaryMonthly}>
          <TextInput name="expectedSalaryMonthly" type="number" inputMode="numeric" min={5000} step={500} defaultValue={defaults.expectedSalaryMonthly ?? ""} error={e.expectedSalaryMonthly} />
        </Field>
        <Checkbox name="willingToRelocate" label="I can move to another city or state for work" defaultChecked={defaults.willingToRelocate ?? true} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-800">States you would work in (optional)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INDIAN_STATES.map((s) => (
              <label key={s} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <input type="checkbox" name="preferredStates" value={s} defaultChecked={defaults.preferredStates?.includes(s)} className="h-4 w-4 accent-amber-600" />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <Checkbox name="availableImmediately" label="I can join immediately" defaultChecked={defaults.availableImmediately ?? true} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Privacy</h2>
        <Checkbox
          name="visibleInDirectory"
          label="Let verified factories find my Trade Card"
          hint="They see your name, trade, experience and district. They get your phone number only after they invite you for a job. You can turn this off any time."
          defaultChecked={defaults.visibleInDirectory ?? true}
        />
      </section>

      <FormMessage error={state.error ?? (Object.keys(e).length ? "Please fix the highlighted fields." : undefined)} />
      <SubmitButton className="w-full sm:w-auto" pendingText="Saving…">
        Save my Trade Card
      </SubmitButton>
    </form>
  );
}
