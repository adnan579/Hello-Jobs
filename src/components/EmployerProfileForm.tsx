"use client";

import { useActionState } from "react";
import { saveEmployerProfileAction } from "@/app/actions/employer";
import type { FormState } from "@/app/actions/worker";
import { Field, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/ui";
import { INDIAN_STATES } from "@/lib/constants";

export type EmployerDefaults = {
  companyName?: string;
  contactPerson?: string;
  hrPhone?: string;
  industrialCluster?: string;
  city?: string;
  state?: string;
  gstin?: string | null;
  udyamNumber?: string | null;
};

export default function EmployerProfileForm({ defaults = {} }: { defaults?: EmployerDefaults }) {
  const [state, action] = useActionState<FormState, FormData>(saveEmployerProfileAction, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      <Field label="Company / factory name" name="companyName" error={e.companyName}>
        <TextInput name="companyName" defaultValue={defaults.companyName} required error={e.companyName} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="HR contact person" name="contactPerson" error={e.contactPerson}>
          <TextInput name="contactPerson" defaultValue={defaults.contactPerson} required error={e.contactPerson} />
        </Field>
        <Field label="HR phone" name="hrPhone" error={e.hrPhone} hint="Verified workers can call this number.">
          <TextInput name="hrPhone" type="tel" inputMode="numeric" defaultValue={defaults.hrPhone} required error={e.hrPhone} />
        </Field>
      </div>
      <Field label="Industrial area" name="industrialCluster" error={e.industrialCluster} hint="e.g. Noida Sector 63, Pimpri-Chinchwad, Manesar">
        <TextInput name="industrialCluster" defaultValue={defaults.industrialCluster} required error={e.industrialCluster} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" error={e.city}>
          <TextInput name="city" defaultValue={defaults.city} required error={e.city} />
        </Field>
        <Field label="State" name="state" error={e.state}>
          <SelectInput name="state" options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Choose state" defaultValue={defaults.state} required error={e.state} />
        </Field>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        <h2 className="font-bold">Get verified</h2>
        <p className="mt-1 text-sm text-slate-700">
          Add your GSTIN or Udyam number. Verified factories get the green badge and can use Talent Hunt. Changing these resets verification.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="GSTIN" name="gstin" error={e.gstin}>
            <TextInput name="gstin" defaultValue={defaults.gstin ?? ""} autoCapitalize="characters" maxLength={15} error={e.gstin} />
          </Field>
          <Field label="Udyam registration" name="udyamNumber" error={e.udyamNumber}>
            <TextInput name="udyamNumber" defaultValue={defaults.udyamNumber ?? ""} autoCapitalize="characters" placeholder="UDYAM-UP-00-0000000" error={e.udyamNumber} />
          </Field>
        </div>
      </div>

      <FormMessage error={state.error ?? (Object.keys(e).length ? "Please fix the highlighted fields." : undefined)} />
      <SubmitButton className="w-full sm:w-auto" pendingText="Saving…">
        Save factory profile
      </SubmitButton>
    </form>
  );
}
