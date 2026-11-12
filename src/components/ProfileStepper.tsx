import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Video } from 'lucide-react';
import type {
  CandidateProfile,
  Language,
  PastEmploymentItem,
  ReadinessBadge,
  TradeType,
  WorkerSkillCategory,
} from '../types';
import { makeT } from '../data/translations';
import { MACHINE_CATALOG } from '../modules/domain';
import { SpeakButton } from './SpeakButton';

export type StepId =
  | 'trade'
  | 'experience'
  | 'machines'
  | 'pastWork'
  | 'pay'
  | 'readiness'
  | 'relocate'
  | 'joiner'
  | 'video';

/** The order we ask in. The optional video is always last. */
export const STEP_ORDER: StepId[] = [
  'trade',
  'experience',
  'machines',
  'pastWork',
  'pay',
  'readiness',
  'relocate',
  'joiner',
  'video',
];

/** Which question closes each open step the home page can point to. */
export const STEP_FOR_PROFILE_KEY: Record<string, StepId> = {
  machines: 'machines',
  pastWork: 'pastWork',
  certificate: 'readiness',
  pay: 'pay',
  video: 'video',
};

const TRADE_CHOICES: { trade: TradeType; emoji: string; category: WorkerSkillCategory }[] = [
  { trade: 'Packing & Box Loading (No Certificate)', emoji: '📦', category: 'unskilled' },
  { trade: 'Factory Floor Helper (No Certificate)', emoji: '🧤', category: 'unskilled' },
  { trade: 'Warehouse Loader / Packer', emoji: '🚚', category: 'unskilled' },
  { trade: 'Assembly Line Helper', emoji: '🔩', category: 'unskilled' },
  { trade: 'Machine Helper (Semi-Skilled)', emoji: '⚙️', category: 'semi-skilled' },
  { trade: 'Press Machine Operator', emoji: '🏭', category: 'semi-skilled' },
  { trade: 'CNC / VMC Operator', emoji: '🖥️', category: 'skilled' },
  { trade: 'Fitter (Assembly & Bench)', emoji: '🔧', category: 'skilled' },
  { trade: 'Welder (MIG / TIG / ARC)', emoji: '🔥', category: 'skilled' },
  { trade: 'Machinist (Lathe / Milling)', emoji: '🛠️', category: 'skilled' },
  { trade: 'Industrial Electrician', emoji: '⚡', category: 'skilled' },
  { trade: 'Wireman', emoji: '🔌', category: 'skilled' },
  { trade: 'Diesel Mechanic', emoji: '🛢️', category: 'skilled' },
  { trade: 'Quality Inspector', emoji: '🔍', category: 'semi-skilled' },
];

const STEP_PICTURE: Record<StepId, string> = {
  trade: '👷',
  experience: '📅',
  machines: '⚙️',
  pastWork: '🏭',
  pay: '💰',
  readiness: '✅',
  relocate: '🚆',
  joiner: '🚀',
  video: '🎥',
};

const EXPERIENCE_CHOICES = [0, 1, 2, 3, 5, 8];
const PAY_CHOICES = [12000, 15000, 18000, 22000, 28000];

const BADGE_CHOICES: { badge: ReadinessBadge; key: string; emoji: string }[] = [
  { badge: 'Immediate Joiner', key: 'psBadge_joiner', emoji: '🚀' },
  { badge: '12-Hr Shift Stamina', key: 'psBadge_stamina', emoji: '⏱️' },
  { badge: 'Heavy Packing & Loading Ready', key: 'psBadge_packing', emoji: '📦' },
  { badge: 'Hostel / Outstation Ready', key: 'psBadge_hostel', emoji: '🛏️' },
  { badge: 'Night Shift Ready', key: 'psBadge_night', emoji: '🌙' },
];

interface Props {
  worker: CandidateProfile;
  lang: Language;
  /** Saves the worker. May be async; a rejection shows a retry message. */
  onSave: (updated: CandidateProfile) => void | Promise<void>;
  /** Called after the last question is saved, or when the worker leaves. */
  onDone: () => void;
  /** Which question to open first. */
  startAt?: StepId;
}

/**
 * One question per screen, each with a picture and a speaker button. Every "Next" saves what the
 * worker just answered, so leaving half way keeps the progress. The video question is optional and
 * last. The old long form stays available as "All my details".
 */
export const ProfileStepper: React.FC<Props> = ({ worker, lang, onSave, onDone, startAt }) => {
  const t = useMemo(() => makeT(lang), [lang]);
  const [index, setIndex] = useState(Math.max(0, STEP_ORDER.indexOf(startAt ?? 'trade')));
  const [draft, setDraft] = useState<CandidateProfile>(worker);
  const [pastCompany, setPastCompany] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'failed'>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = STEP_ORDER[index]!;
  const total = STEP_ORDER.length;
  const isLast = index === total - 1;
  const question = t(`psQ_${step}`);
  const hint =
    step === 'machines' ? t('psMachinesHint')
    : step === 'readiness' ? t('psReadinessHint')
    : step === 'video' ? t('psVideoHint')
    : '';

  // Move focus to the new question so a screen reader announces it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the question changes
  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const update = (patch: Partial<CandidateProfile>) => setDraft((d) => ({ ...d, ...patch }));

  const withPastWork = (d: CandidateProfile): CandidateProfile => {
    const name = pastCompany.trim();
    if (step !== 'pastWork' || !name) return d;
    const entry: PastEmploymentItem = { companyName: name, role: d.trade, durationMonths: 12 };
    return { ...d, pastEmployments: [...(d.pastEmployments ?? []), entry].slice(0, 3) };
  };

  const saveAndGo = async (dir: 1 | -1, skip = false) => {
    if (dir === -1) {
      setIndex((i) => Math.max(0, i - 1));
      return;
    }
    setState('saving');
    try {
      const next = skip ? draft : withPastWork(draft);
      if (!skip) {
        setDraft(next);
        await Promise.resolve(onSave(next));
      }
      setState('idle');
      if (isLast) onDone();
      else setIndex((i) => i + 1);
    } catch {
      setState('failed');
    }
  };

  const toggleMachine = (name: string) => {
    const has = draft.machinesOperated.includes(name);
    update({
      machinesOperated: has
        ? draft.machinesOperated.filter((m) => m !== name)
        : [...draft.machinesOperated, name],
    });
  };

  const toggleBadge = (badge: ReadinessBadge) => {
    const current = draft.readinessBadges ?? ['Mobile OTP Verified'];
    update({
      readinessBadges: current.includes(badge)
        ? current.filter((b) => b !== badge)
        : [...current, badge],
    });
  };

  const choose = 'tab !min-h-14 !text-base !justify-start !text-left';
  const paySelected = draft.expectedSalary;

  return (
    <section aria-labelledby="stepper-heading" className="card space-y-5 p-5 sm:p-8">
      <div className="space-y-2">
        <p className="text-meta font-bold text-[var(--sk-muted)]" aria-live="polite">
          {t('psProgress', { n: index + 1, total })}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--sk-border-soft)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--sk-amber)] transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--sk-amber-soft)] text-4xl" aria-hidden="true">
          {STEP_PICTURE[step]}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h2
            id="stepper-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-extrabold leading-snug text-[var(--sk-ink)] outline-none"
          >
            {question}
          </h2>
          {hint && <p className="text-[0.9375rem] text-[var(--sk-body)]">{hint}</p>}
          <SpeakButton id={`profile-step-${step}`} text={hint ? `${question} ${hint}` : question} lang={lang} t={t} />
        </div>
      </div>

      {step === 'trade' && (
        <fieldset className="m-0 min-w-0 border-0 p-0 grid grid-cols-2 gap-3 sm:grid-cols-3"><legend className="sr-only">{question}</legend>
          {TRADE_CHOICES.map((c, i) => (
            <button
              key={c.trade}
              type="button"
              aria-pressed={draft.trade === c.trade}
              onClick={() => update({ trade: c.trade, category: c.category })}
              className="tab !min-h-24 !flex-col !gap-1 !text-[0.9375rem]"
            >
              <span className="text-3xl" aria-hidden="true">{c.emoji}</span>
              <span>{t(`psTrade${i}`)}</span>
            </button>
          ))}
        </fieldset>
      )}

      {step === 'experience' && (
        <fieldset className="m-0 min-w-0 border-0 p-0 grid grid-cols-2 gap-3 sm:grid-cols-3"><legend className="sr-only">{question}</legend>
          {EXPERIENCE_CHOICES.map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={draft.experienceYears === y}
              onClick={() => update({ experienceYears: y })}
              className="tab !min-h-14 !text-base"
            >
              {y === 0 ? t('psNewToWork') : y === 8 ? t('psYearsMore', { n: y }) : t('psYears', { n: y })}
            </button>
          ))}
        </fieldset>
      )}

      {step === 'machines' && (
        <fieldset className="m-0 min-w-0 border-0 p-0 grid gap-3 sm:grid-cols-2"><legend className="sr-only">{question}</legend>
          {MACHINE_CATALOG.map((m) => (
            <button
              key={m.canonicalName}
              type="button"
              aria-pressed={draft.machinesOperated.includes(m.canonicalName)}
              onClick={() => toggleMachine(m.canonicalName)}
              className={choose}
            >
              <span aria-hidden="true">⚙️</span>
              <span>{lang === 'hi' ? m.hindiLabel : m.canonicalName}</span>
            </button>
          ))}
        </fieldset>
      )}

      {step === 'pastWork' && (
        <div className="space-y-3">
          <label htmlFor="past-work" className="sr-only">{question}</label>
          <input
            id="past-work"
            type="text"
            value={pastCompany}
            onChange={(e) => setPastCompany(e.target.value)}
            placeholder={t('psPastWorkPlaceholder')}
            maxLength={80}
            className="field !min-h-14"
          />
        </div>
      )}

      {step === 'pay' && (
        <fieldset className="m-0 min-w-0 border-0 p-0 grid grid-cols-1 gap-3 sm:grid-cols-2"><legend className="sr-only">{question}</legend>
          {PAY_CHOICES.map((p, i) => (
            <button
              key={p}
              type="button"
              aria-pressed={paySelected === p}
              onClick={() =>
                update({
                  expectedSalary: p,
                  expectedPayMin: Math.max(10000, p - 1500),
                  expectedPayMax: p + 2500,
                })
              }
              className="tab !min-h-14 !text-base"
            >
              {i === PAY_CHOICES.length - 1
                ? t('psPayMore', { amount: p.toLocaleString('en-IN') })
                : t('psPerMonth', { amount: p.toLocaleString('en-IN') })}
            </button>
          ))}
        </fieldset>
      )}

      {step === 'readiness' && (
        <fieldset className="m-0 min-w-0 border-0 p-0 grid gap-3"><legend className="sr-only">{question}</legend>
          {BADGE_CHOICES.map((b) => (
            <button
              key={b.badge}
              type="button"
              aria-pressed={(draft.readinessBadges ?? []).includes(b.badge)}
              onClick={() => toggleBadge(b.badge)}
              className={choose}
            >
              <span className="text-2xl" aria-hidden="true">{b.emoji}</span>
              <span>{t(b.key)}</span>
            </button>
          ))}
        </fieldset>
      )}

      {(step === 'relocate' || step === 'joiner') && (
        <fieldset className="m-0 min-w-0 border-0 p-0 grid grid-cols-2 gap-3"><legend className="sr-only">{question}</legend>
          {[true, false].map((yes) => {
            const value = step === 'relocate' ? draft.willingToRelocate : draft.immediateJoiner;
            return (
              <button
                key={String(yes)}
                type="button"
                aria-pressed={value === yes}
                onClick={() =>
                  update(step === 'relocate' ? { willingToRelocate: yes } : { immediateJoiner: yes })
                }
                className="tab !min-h-20 !flex-col !text-lg"
              >
                <span className="text-3xl" aria-hidden="true">{yes ? '👍' : '👎'}</span>
                <span>{yes ? t('psYes') : t('psNo')}</span>
              </button>
            );
          })}
        </fieldset>
      )}

      {step === 'video' && (
        <div className="space-y-3">
          <label className="btn btn-secondary !min-h-14 cursor-pointer">
            <Video className="h-5 w-5" aria-hidden="true" />
            <span>{t('psVideoChoose')}</span>
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                update({
                  hasVideoDemo: true,
                  videoDemoTitle: `30s Shop-Floor Demo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB · Pending Review)`,
                });
              }}
            />
          </label>
          {draft.hasVideoDemo && (
            <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-[var(--sk-green-text)]" role="status">
              <Check className="h-5 w-5" aria-hidden="true" />
              {t('psVideoChosen')}
            </p>
          )}
        </div>
      )}

      {state === 'failed' && (
        <p role="alert" className="rounded-lg bg-[var(--sk-red-soft)] p-3 text-[0.9375rem] font-semibold text-[var(--sk-red-text)]">
          {t('psSaveFailed')}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => saveAndGo(-1)}
          disabled={index === 0 || state === 'saving'}
          className="btn btn-ghost"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>{t('psBack')}</span>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          {(step === 'video' || step === 'pastWork') && (
            <button type="button" onClick={() => saveAndGo(1, true)} disabled={state === 'saving'} className="btn btn-ghost">
              {step === 'pastWork' ? t('psNoPastWork') : t('psSkip')}
            </button>
          )}
          <button type="button" onClick={() => saveAndGo(1)} disabled={state === 'saving'} className="btn btn-worker !min-h-12 !px-6">
            <span>{state === 'saving' ? t('psSaving') : isLast ? t('psFinish') : t('psNext')}</span>
            {!isLast && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </section>
  );
};
