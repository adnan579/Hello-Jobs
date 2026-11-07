import React from 'react';
import { Factory, LogIn, ShieldCheck, EyeOff, BadgeIndianRupee } from 'lucide-react';
import type { TFunction } from '../data/translations';

interface Props {
  t: TFunction;
  onRegister: () => void;
  onLogin: () => void;
  onSeeHow: () => void;
}

/**
 * What a visitor (or a worker) sees at "For employers". The talent directory and the Post-job
 * form belong to a signed-in factory, so nothing here is a form or a list of people.
 */
export const EmployerPitch: React.FC<Props> = ({ t, onRegister, onLogin, onSeeHow }) => {
  const points = [
    { icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />, text: t('pitchPoint1') },
    { icon: <EyeOff className="h-5 w-5" aria-hidden="true" />, text: t('pitchPoint2') },
    { icon: <BadgeIndianRupee className="h-5 w-5" aria-hidden="true" />, text: t('pitchPoint3') },
  ];
  return (
    <div data-role="employer" className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="card space-y-4 border-l-4 border-l-[var(--sk-blue)] p-6">
        <p className="inline-flex items-center gap-2 text-meta font-bold uppercase tracking-wider text-[var(--sk-blue-text)]">
          <Factory className="h-4 w-4" aria-hidden="true" />
          {t('pitchEyebrow')}
        </p>
        <h1 className="text-3xl font-extrabold leading-tight text-slate-900">{t('pitchTitle')}</h1>
        <p className="max-w-2xl text-lg text-slate-700">{t('pitchLead')}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onRegister} className="btn btn-employer">
            <Factory className="h-4 w-4" aria-hidden="true" />
            {t('pitchRegister')}
          </button>
          <button type="button" onClick={onLogin} className="btn btn-secondary">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {t('pitchLogin')}
          </button>
          <button type="button" onClick={onSeeHow} className="btn btn-ghost">
            {t('pitchSeeHow')}
          </button>
        </div>
      </header>
      <ul className="grid gap-4 md:grid-cols-3">
        {points.map((p, i) => (
          <li key={i} className="card flex items-start gap-3 p-5 text-body text-slate-800">
            <span className="mt-0.5 text-[var(--sk-blue-text)]">{p.icon}</span>
            <span>{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
