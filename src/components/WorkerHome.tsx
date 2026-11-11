import React, { useMemo } from 'react';
import { ArrowRight, Briefcase, IdCard, LogOut, UserRound } from 'lucide-react';
import type { CandidateProfile, JobApplication, Language, OfferLetter } from '../types';
import { makeT } from '../data/translations';
import { nextStepFor, type NextStep } from '../modules/workerHome';
import { SpeakButton } from './SpeakButton';
import { ApplicationStatus } from './ApplicationStatus';
import { STEP_FOR_PROFILE_KEY, type StepId } from './ProfileStepper';

export type HomeTarget = 'inbox' | 'profile' | 'idcard';

interface Props {
  worker: CandidateProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  lang: Language;
  onOpenTab: (tab: HomeTarget) => void;
  /** Opens the one-question-at-a-time profile, at a given question. */
  onStartProfile: (step?: StepId) => void;
  onBrowseJobs: () => void;
  onLogout: () => void;
}

const MAX_LINES = 5;

/**
 * The first screen a signed-in worker sees: a greeting with a speaker button, one next step with
 * one button, then the applications in short lines. Everything else is one tap away.
 */
export const WorkerHome: React.FC<Props> = ({
  worker,
  applications,
  offers,
  lang,
  onOpenTab,
  onStartProfile,
  onBrowseJobs,
  onLogout,
}) => {
  const t = useMemo(() => makeT(lang), [lang]);
  const mine = applications.filter((a) => a.candidateId === worker.id);
  const next = nextStepFor(worker, applications, offers);
  const firstName = worker.name.trim().split(/\s+/)[0] || worker.name;

  const copy = (n: NextStep): { text: string; button: string; run: () => void } => {
    switch (n.kind) {
      case 'respondOffer':
        return { text: t('whNextOffer'), button: t('whNextOfferBtn'), run: () => onOpenTab('inbox') };
      case 'interview':
        return {
          text: t('whNextInterview', { job: n.jobTitle }),
          button: t('whNextInterviewBtn'),
          run: () => onOpenTab('inbox'),
        };
      case 'profile':
        return {
          text: t(`whNextProfile_${n.step}`),
          button: t('whNextProfileBtn'),
          run: () => onStartProfile(STEP_FOR_PROFILE_KEY[n.step]),
        };
      case 'video':
        return { text: t('whNextVideo'), button: t('whNextVideoBtn'), run: () => onStartProfile('video') };
      case 'waiting':
        return { text: t('whNextWaiting'), button: t('whNextWaitingBtn'), run: () => onOpenTab('inbox') };
      case 'browse':
      default:
        return { text: t('whNextBrowse'), button: t('whNextBrowseBtn'), run: onBrowseJobs };
    }
  };
  const card = copy(next);
  const greeting = t('whGreeting', { name: firstName });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-[var(--sk-ink)]">{greeting}</h1>
        <SpeakButton id="worker-home" text={`${greeting}. ${card.text}`} lang={lang} t={t} />
      </header>

      <section aria-labelledby="next-step-title" className="card space-y-4 border-2 !border-[var(--sk-amber)] p-5">
        <h2 id="next-step-title" className="eyebrow">
          {t('whNextStepTitle')}
        </h2>
        <p className="text-lg font-bold leading-snug text-[var(--sk-ink)]">{card.text}</p>
        <button type="button" onClick={card.run} className="btn btn-worker !min-h-14 w-full !text-lg">
          <span>{card.button}</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </section>

      <section aria-labelledby="my-apps-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="my-apps-title" className="text-lg font-extrabold text-[var(--sk-ink)]">
            {t('whMyApps')}
          </h2>
          {mine.length > MAX_LINES && (
            <button type="button" onClick={() => onOpenTab('inbox')} className="btn btn-ghost btn-sm">
              {t('whSeeAll')}
            </button>
          )}
        </div>
        {mine.length === 0 ? (
          <p className="panel p-4 text-[0.9375rem] text-[var(--sk-body)]">{t('whNoApps')}</p>
        ) : (
          <ul className="space-y-3">
            {mine.slice(0, MAX_LINES).map((app) => (
              <li key={app.id} className="panel space-y-3 p-4">
                <div>
                  <p className="text-base font-bold text-[var(--sk-ink)]">{app.jobTitle}</p>
                  <p className="text-[0.9375rem] text-[var(--sk-body)]">{app.companyName}</p>
                </div>
                <ApplicationStatus stage={app.status} jobTitle={app.jobTitle} t={t} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav aria-label={t('whMyProfile')} className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => onOpenTab('inbox')} className="btn btn-secondary !min-h-14">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          <span>{t('navApplications')}</span>
        </button>
        <button type="button" onClick={() => onOpenTab('profile')} className="btn btn-secondary !min-h-14">
          <UserRound className="h-5 w-5" aria-hidden="true" />
          <span>{t('whMyProfile')}</span>
        </button>
        <button type="button" onClick={() => onOpenTab('idcard')} className="btn btn-secondary !min-h-14">
          <IdCard className="h-5 w-5" aria-hidden="true" />
          <span>{t('whIdCard')}</span>
        </button>
      </nav>

      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-[0.9375rem] text-[var(--sk-body)]">{t('whSharedPhone')}</p>
        <button type="button" onClick={onLogout} className="btn btn-secondary">
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>{t('navLogout')}</span>
        </button>
      </div>
    </div>
  );
};
