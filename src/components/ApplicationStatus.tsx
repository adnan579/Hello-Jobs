import React from 'react';
import { Check, XCircle } from 'lucide-react';
import type { PipelineStage } from '../types';
import type { TFunction } from '../data/translations';
import { WORKER_STEPS, workerStatus } from '../modules/workerHome';

interface Props {
  stage: PipelineStage;
  jobTitle: string;
  t: TFunction;
}

/**
 * Where an application stands, in four steps and plain words: Applied, Shortlisted, Interview,
 * Offer, with Joined as the end. Ended applications show one line instead of the internal outcome.
 */
export const ApplicationStatus: React.FC<Props> = ({ stage, jobTitle, t }) => {
  const status = workerStatus(stage);

  if (status.closed) {
    const text = t(status.closed === 'notSelected' ? 'status_notSelected' : 'status_closedByYou');
    return (
      <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-[var(--sk-body)]">
        <XCircle className="h-5 w-5 shrink-0 text-[var(--sk-muted)]" aria-hidden="true" />
        <span>{text}</span>
        <span className="sr-only">{t('whStatusAria', { job: jobTitle, status: text })}</span>
      </p>
    );
  }

  const current = status.joined ? t('step_joined') : t(`step_${status.current}`);
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1.5" aria-label={t('whStatusAria', { job: jobTitle, status: current })}>
        {WORKER_STEPS.map((step, i) => {
          const done = i < status.reached;
          const isCurrent = status.current === step;
          return (
            <li key={step} className="space-y-1" aria-current={isCurrent ? 'step' : undefined}>
              <div className={`h-2 rounded-full ${done ? 'bg-emerald-600' : 'bg-[var(--sk-border)]'}`} aria-hidden="true" />
              <span
                className={`block text-meta leading-tight ${
                  isCurrent || status.joined ? 'font-extrabold text-[var(--sk-ink)]' : 'font-semibold text-[var(--sk-body)]'
                }`}
              >
                {t(`step_${step}`)}
                <span className="sr-only">
                  {' '}
                  {t('whStepAria', { n: i + 1, label: t(`step_${step}`) })}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {(status.joined || status.offerAccepted) && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.9375rem] font-bold text-[var(--sk-green-text)]">
          <Check className="h-5 w-5" aria-hidden="true" />
          {status.joined ? t('step_joined') : t('status_offerAccepted')}
        </p>
      )}
    </div>
  );
};
