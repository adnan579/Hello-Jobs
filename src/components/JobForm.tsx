"use client";

import { useActionState } from "react";
import { createJobAction } from "@/app/actions/employer";
import type { FormState } from "@/app/actions/worker";
import { Checkbox, Field, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABELS, INDIAN_STATES, TRADES, TRADE_LABELS } from "@/lib/constants";

export default function JobForm({ defaultCity, defaultState }: { defaultCity?: string; defaultState?: string }) {
  const [state, action] = useActionState<FormState, FormData>(createJobAction, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-xl font-bold">The role</h2>
        <Field label="Job title" name="title" error={e.title} hint="e.g. ITI Fitter, Assembly Line">
          <TextInput name="title" required error={e.title} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trade" name="trade" error={e.trade}>
            <SelectInput name="trade" options={TRADES.map((t) => ({ value: t, label: TRADE_LABELS[t].en }))} placeholder="Choose trade" required error={e.trade} />
          </Field>
          <Field label="Category" name="category" error={e.category}>
            <SelectInput name="category" options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} placeholder="Choose category" required error={e.category} />
          </Field>
          <Field label="Number of openings" name="openings" error={e.openings}>
            <TextInput name="openings" type="number" inputMode="numeric" min={1} defaultValue={1} required error={e.openings} />
          </Field>
          <Field label="Minimum experience (years)" name="minExperienceYears" error={e.minExperienceYears}>
            <TextInput name="minExperienceYears" type="number" inputMode="numeric" min={0} defaultValue={0} required error={e.minExperienceYears} />
          </Field>
          <Field label="City" name="city" error={e.city}>
            <TextInput name="city" defaultValue={defaultCity} required error={e.city} />
          </Field>
          <Field label="State" name="state" error={e.state}>
            <SelectInput name="state" options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Choose state" defaultValue={defaultState} required error={e.state} />
          </Field>
        </div>
        <Field label="Description (optional)" name="description" error={e.description}>
          <textarea id="description" name="description" rows={4} maxLength={2000} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Pay (required)</h2>
        <p className="text-sm text-slate-600">Workers see these exact numbers. Clear pay gets more joiners who stay.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gross salary per month (₹)" name="grossSalaryMonthly" error={e.grossSalaryMonthly}>
            <TextInput name="grossSalaryMonthly" type="number" inputMode="numeric" min={5000} step={500} required error={e.grossSalaryMonthly} />
          </Field>
          <Field label="In-hand salary per month (₹)" name="inHandSalaryMonthly" error={e.inHandSalaryMonthly} hint="After PF, ESIC and other deductions">
            <TextInput name="inHandSalaryMonthly" type="number" inputMode="numeric" min={5000} step={500} required error={e.inHandSalaryMonthly} />
          </Field>
          <Field label="Overtime rate (₹ per hour)" name="overtimeRatePerHour" error={e.overtimeRatePerHour}>
            <TextInput name="overtimeRatePerHour" type="number" inputMode="numeric" min={0} required error={e.overtimeRatePerHour} />
          </Field>
          <Field label="Shift length (hours)" name="shiftHours" error={e.shiftHours}>
            <TextInput name="shiftHours" type="number" inputMode="numeric" min={4} max={12} defaultValue={8} required error={e.shiftHours} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Facilities</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox name="hasHostel" label="Free hostel / room" />
          <Checkbox name="hasCanteen" label="Subsidised canteen" />
          <Checkbox name="hasPfEsi" label="PF and ESIC" />
          <Checkbox name="hasTravelAllowance" label="Travel allowance" />
        </div>
      </section>

      <FormMessage error={state.error ?? (Object.keys(e).length ? "Please fix the highlighted fields." : undefined)} />
      <SubmitButton className="w-full sm:w-auto" pendingText="Posting…">
        Post job
      </SubmitButton>
    </form>
  );
}
