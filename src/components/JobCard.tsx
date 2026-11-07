import React from 'react';
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Lock,
  Building2,
  Bus,
  CheckCircle2,
  Clock,
  GraduationCap,
  Home,
  MapPin,
  MessageSquare,
  Navigation,
  PhoneCall,
  Send,
  ShieldCheck,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { JobApplication, JobListing } from '../types';
import type { TFunction } from '../data/translations';
import { computeLabourCodeBreakdown } from '../modules/domain';
import { Disclosure } from './ui/Disclosure';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
  job: JobListing;
  t: TFunction;
  /** Signed-in worker's own application to this job, if any. */
  application?: JobApplication;
  isSaved: boolean;
  savePending: boolean;
  matchScore: number | null;
  matchReasons: string[];
  distanceKm: number;
  workerCity?: string;
  /** Only true when the worker is signed in, so the distance is measured from a real city. */
  showDistance: boolean;
  /** True for visitors: Call HR and WhatsApp ask them to log in first. */
  contactLocked?: boolean;
  isAudioPlaying: boolean;
  listenLabel: string;
  stopLabel: string;
  onToggleSave: () => void;
  onApply: () => void;
  onOpenApplication: () => void;
  onCallHr: () => void;
  onWhatsApp: () => void;
  onToggleAudio: () => void;
  onReport: () => void;
}

/**
 * One job. Reading order matches what a worker decides on: what is it (title, company),
 * what do I earn (in-hand pay), where and when, what is asked of me, then the Apply button.
 * Pay-slip maths, relocation help and reporting live under one "details" section.
 */
export const JobCard: React.FC<Props> = ({
  job,
  t,
  application,
  isSaved,
  savePending,
  matchScore,
  matchReasons,
  distanceKm,
  workerCity,
  showDistance,
  contactLocked = false,
  isAudioPlaying,
  listenLabel,
  stopLabel,
  onToggleSave,
  onApply,
  onOpenApplication,
  onCallHr,
  onWhatsApp,
  onToggleAudio,
  onReport,
}) => {
  const breakdown =
    job.labourCodeBreakdown || computeLabourCodeBreakdown(job.takeHomeSalary, job.grossSalary);
  const headingId = `job-${job.id}-title`;

  return (
    <article aria-labelledby={headingId} className="card space-y-3 p-4 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 id={headingId} className="text-lg font-extrabold leading-snug text-slate-900">
            {job.title}
          </h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {job.companyName}
            </span>
            <span className="badge badge-verified">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('gstinVerified')}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleSave}
          disabled={savePending}
          aria-pressed={isSaved}
          aria-label={isSaved ? t('unsaveJobAria', { title: job.title }) : t('saveJobAria', { title: job.title })}
          className={`btn btn-sm shrink-0 !min-w-11 !px-2 ${isSaved ? 'btn-worker' : 'btn-secondary'}`}
        >
          {isSaved ? (
            <BookmarkCheck className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Pay first: this is the number a worker compares. */}
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-extrabold tabular-nums text-[var(--sk-green-text)]">
          {t('inHandPerMonth', { amount: job.takeHomeSalary.toLocaleString('en-IN') })}
        </span>
        <span className="text-body font-semibold tabular-nums text-slate-700">
          {t('otPerHour', { rate: job.overtimeHourlyRate })}
        </span>
      </p>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-body text-slate-700">
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {job.industrialHub} ({job.state})
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {job.shiftPattern}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {t('qualificationLine', { q: job.minQualification })}
        </li>
        <li className="font-semibold tabular-nums text-[var(--sk-blue-text)]">
          {t('seatsOpen', { open: job.vacanciesLeft, total: job.openingsCount })}
        </li>
      </ul>

      <ul className="flex flex-wrap gap-1.5">
        {job.noCertificateRequired && (
          <li className="badge badge-verified">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('noCertBadge')}
          </li>
        )}
        {job.facilities.hasHostel && (
          <li className="badge">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            {job.roomRentDeduction || t('hostel')}
          </li>
        )}
        {job.facilities.hasSubsidizedMess && (
          <li className="badge">
            <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
            {job.canteenCostPerMeal || t('mess')}
          </li>
        )}
        {job.facilities.hasBusPickup && (
          <li className="badge">
            <Bus className="h-3.5 w-3.5" aria-hidden="true" />
            {t('bus')}
          </li>
        )}
        {showDistance && (
          <li className="badge badge-employer tabular-nums">
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            {t('distanceFrom', { km: distanceKm, city: workerCity || t('yourCity') })}
          </li>
        )}
        {matchScore !== null && (
          <li className="badge badge-worker tabular-nums">{t('matchPct', { n: matchScore })}</li>
        )}
      </ul>

      {/* One primary action. Everything else is visibly secondary. */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
        {application ? (
          <button
            type="button"
            onClick={onOpenApplication}
            title={t('viewApplication')}
            className="btn btn-secondary border-[var(--sk-green-text)] text-[var(--sk-green-text)] sm:min-w-44"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{t(`stage_${application.status}`)}</span>
          </button>
        ) : (
          <button type="button" onClick={onApply} className="btn btn-worker sm:min-w-44">
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{t('applyNow')}</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={onCallHr}
            aria-label={contactLocked ? t('contactLockedAria') : undefined}
            className="btn btn-secondary"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            <span>{t('directCall')}</span>
          </button>
          <button type="button" onClick={onWhatsApp} className="btn btn-secondary">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{t('applyWhatsapp')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleAudio}
          aria-pressed={isAudioPlaying}
          className="btn btn-ghost sm:ml-auto"
        >
          {isAudioPlaying ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isAudioPlaying ? stopLabel : listenLabel}</span>
        </button>
      </div>

      {contactLocked && (
        <p className="flex items-center gap-1.5 text-meta text-slate-700">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t('contactLockedHint')}
        </p>
      )}

      <Disclosure label={t('jobDetails')} openLabel={t('hideJobDetails')}>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <section aria-label={t('salaryBreakdownTitle')}>
            <h4 className="mb-2 text-body font-bold text-slate-900">{t('salaryBreakdownTitle')}</h4>
            <dl className="grid grid-cols-2 gap-3 text-body sm:grid-cols-5">
              {[
                [t('basicDa'), inr(breakdown.basicAndDa)],
                [t('allowancesHra'), inr(breakdown.allowances)],
                [t('employeePf'), inr(breakdown.pfEmployee)],
                [t('esicMedical'), inr(breakdown.esicEmployee)],
                [t('guaranteedInHand'), `${inr(job.takeHomeSalary)}${t('perMonthShort')}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-meta text-slate-600">{label}</dt>
                  <dd className="font-bold tabular-nums text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {job.relocation && (
            <section aria-label={t('relocationTitle')}>
              <h4 className="mb-2 text-body font-bold text-slate-900">{t('relocationTitle')}</h4>
              <dl className="grid gap-3 text-body sm:grid-cols-3">
                <div>
                  <dt className="text-meta text-slate-600">{t('wageAdvance')}</dt>
                  <dd className="tabular-nums text-slate-900">
                    {job.relocation.wageAdvanceAvailable
                      ? t('advanceUpTo', { amount: job.relocation.maxAdvanceAmount.toLocaleString('en-IN') })
                      : t('standardPayout')}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-slate-600">{t('travelSupport')}</dt>
                  <dd className="text-slate-900">
                    {job.relocation.travelTicketReimbursed ? t('ticketReimbursed') : t('selfTravel')}
                    {' · '}
                    {t('supervisorSpeaks', { langs: job.relocation.supervisorLanguages.join(', ') })}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-slate-600">{t('railhead')}</dt>
                  <dd className="text-slate-900">
                    {job.relocation.nearestRailwayStation} · {t('bringChecklist')}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {(matchReasons.length > 0 || job.promiseKeptScorePct || job.expiresAt) && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-slate-700">
              {matchReasons.length > 0 && (
                <li>
                  <span className="font-semibold">{t('matchBecause')}:</span> {matchReasons.slice(0, 3).join(' · ')}
                </li>
              )}
              {job.promiseKeptScorePct ? (
                <li className="tabular-nums">{t('promiseKept', { pct: job.promiseKeptScorePct })}</li>
              ) : null}
              {job.expiresAt ? <li className="tabular-nums">{t('expiresOn', { date: job.expiresAt })}</li> : null}
            </ul>
          )}

          <button
            type="button"
            onClick={onReport}
            className="btn btn-ghost btn-sm !text-[var(--sk-red-text)]"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>{t('reportCut')}</span>
          </button>
        </div>
      </Disclosure>
    </article>
  );
};
