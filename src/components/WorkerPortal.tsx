import React, { useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Calendar,
  Bookmark,
  CheckCircle2,
  PhoneCall,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  CandidateProfile,
  HiringDrive,
  JobApplication,
  JobListing,
  Language,
  OfferLetter,
} from '../types';
import { getAudioNarrationScript, getVoiceGuideScript, makeT } from '../data/translations';
import { playJobAudio, stopJobAudio } from '../utils/audioNarrator';
import {
  calculateTransparentMatchScore,
  estimateClusterDistanceKm,
  SHOP_FLOOR_PRACTICE_QUIZ,
} from '../modules/domain';
import {
  ALL,
  DEFAULT_JOB_FILTERS,
  countActiveJobFilters,
  feedCounts,
  savedJobIdSet,
  selectJobs,
  type FeedMode,
  type JobFilters,
  type JobSort,
} from '../modules/discovery';
import { JobCard } from './JobCard';
import { Dialog } from './ui/Dialog';
import { Disclosure } from './ui/Disclosure';
import { EmptyState } from './ui/EmptyState';
import { ActiveFilters, type ActiveFilterItem } from './ui/ActiveFilters';

interface Props {
  jobs: JobListing[];
  currentLang: Language;
  activeWorker?: CandidateProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  hiringDrives?: HiringDrive[];
  /** Which category tab to open on. The app uses the default; tests and deep links can set it. */
  initialFeedMode?: FeedMode;
  onApplyJob: (job: JobListing) => void;
  onOpenWorkerProfile: () => void;
  onOpenAuthModal: () => void;
  onOpenCreateProfile: () => void;
  onOpenReport: (companyName?: string) => void;
  onRegisterDrive?: (driveId: string) => void;
  /** Saves or un-saves a job on the signed-in worker's profile. */
  onToggleSaveJob?: (jobId: string) => Promise<void> | void;
}

// Filter vocabularies. These are data values (they match what jobs are stored with), not UI copy.
const TRADES = [
  'Packing & Box Loading (No Certificate)',
  'Factory Floor Helper (No Certificate)',
  'Warehouse Loader / Packer',
  'Assembly Line Helper',
  'Press Machine Operator',
  'CNC / VMC Operator',
  'Fitter (Assembly & Bench)',
  'Welder (MIG / TIG / ARC)',
  'Machinist (Lathe / Milling)',
  'Industrial Electrician',
  'Quality Inspector',
];

const HUBS = [
  'Chakan MIDC, Pune',
  'Sector 63, Noida',
  'Sanand GIDC, Ahmedabad',
  'Peenya Industrial Area, Bengaluru',
  'Sriperumbudur, Chennai',
  'Adityapur, Jamshedpur',
  'Bhiwadi Industrial Zone, Rajasthan',
];

export const WorkerPortal: React.FC<Props> = ({
  jobs,
  currentLang,
  activeWorker,
  applications,
  hiringDrives = [],
  initialFeedMode = 'all',
  onApplyJob,
  onOpenWorkerProfile,
  onOpenAuthModal,
  onOpenCreateProfile,
  onOpenReport,
  onRegisterDrive,
  onToggleSaveJob,
}) => {
  const t = useMemo(() => makeT(currentLang), [currentLang]);

  const [feedMode, setFeedMode] = useState<FeedMode>(initialFeedMode);
  const [sortBy, setSortBy] = useState<JobSort>('best-match');
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_JOB_FILTERS);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [callingJob, setCallingJob] = useState<JobListing | null>(null);
  const [pendingSaveIds, setPendingSaveIds] = useState<string[]>([]);

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Saved jobs come only from the signed-in worker's own profile. Signed out means none.
  const savedIds = useMemo(() => savedJobIdSet(activeWorker), [activeWorker]);
  const counts = useMemo(() => feedCounts(jobs, savedIds, hiringDrives), [jobs, savedIds, hiringDrives]);

  const matches = useMemo(
    () =>
      new Map(
        jobs.map((j) => [j.id, activeWorker ? calculateTransparentMatchScore(activeWorker, j) : null])
      ),
    [jobs, activeWorker]
  );

  const visibleJobs = useMemo(() => {
    const list = selectJobs(jobs, feedMode, filters, savedIds);
    const sort: JobSort = !activeWorker && sortBy === 'nearest' ? 'highest-pay' : sortBy;
    return [...list].sort((a, b) => {
      if (sort === 'highest-pay') return b.takeHomeSalary - a.takeHomeSalary;
      if (sort === 'nearest' && activeWorker) {
        return (
          estimateClusterDistanceKm(activeWorker.currentCity, a.industrialHub) -
          estimateClusterDistanceKm(activeWorker.currentCity, b.industrialHub)
        );
      }
      const sa = matches.get(a.id)?.score ?? 0;
      const sb = matches.get(b.id)?.score ?? 0;
      return sb - sa || b.takeHomeSalary - a.takeHomeSalary;
    });
  }, [jobs, feedMode, filters, savedIds, sortBy, activeWorker, matches]);

  const activeFilterCount = countActiveJobFilters(filters);
  // Filters that live under "More filters", so the closed section can still say something is on.
  const hiddenFilterCount = (filters.hub !== ALL ? 1 : 0) + (filters.hostelOnly ? 1 : 0);

  const filterItems: ActiveFilterItem[] = [
    ...(filters.query.trim() ? [{ key: 'query', label: `“${filters.query.trim()}”` }] : []),
    ...(filters.trade !== ALL ? [{ key: 'trade', label: filters.trade }] : []),
    ...(filters.hub !== ALL ? [{ key: 'hub', label: filters.hub }] : []),
    ...(filters.hostelOnly ? [{ key: 'hostel', label: t('hostelOnly') }] : []),
  ];

  const removeFilter = (key: string) =>
    setFilters((f) =>
      key === 'query'
        ? { ...f, query: '' }
        : key === 'trade'
          ? { ...f, trade: ALL }
          : key === 'hub'
            ? { ...f, hub: ALL }
            : { ...f, hostelOnly: false }
    );
  const resetFilters = () => setFilters(DEFAULT_JOB_FILTERS);

  const toggleSave = async (jobId: string) => {
    if (!activeWorker) {
      onOpenAuthModal();
      return;
    }
    setPendingSaveIds((p) => [...p, jobId]);
    try {
      await onToggleSaveJob?.(jobId);
    } finally {
      setPendingSaveIds((p) => p.filter((id) => id !== jobId));
    }
  };

  const playAudio = (id: string, script: string) => {
    if (activeAudioId === id) {
      stopJobAudio();
      setActiveAudioId(null);
      return;
    }
    setActiveAudioId(id);
    playJobAudio(
      id,
      script,
      currentLang,
      () => setActiveAudioId(id),
      () => setActiveAudioId(null),
      () => setActiveAudioId(null)
    );
  };

  const applyViaWhatsApp = (job: JobListing) => {
    onApplyJob(job);
    // This text is sent to the factory's HR, so it stays in plain English.
    const certNote = job.noCertificateRequired
      ? 'I am ready for immediate joining (No Certificate Needed).'
      : 'My trade profile is verified.';
    const text = encodeURIComponent(
      `Namaste, I am applying directly for the ${job.trade} position at ${job.companyName} (${job.industrialHub}) via Shramkart. ${certNote} Please let me know the walk-in / gate pass details.`
    );
    window.open(`https://wa.me/${job.whatsappApplyNumber}?text=${text}`, '_blank', 'noopener');
  };

  const quizScore = SHOP_FLOOR_PRACTICE_QUIZ.reduce(
    (acc, q) => acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0),
    0
  );

  const modes: { id: FeedMode; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: t('modeAll'), count: counts.all, icon: <Briefcase className="h-4 w-4" aria-hidden="true" /> },
    { id: 'no-cert', label: t('modeNoCert'), count: counts.noCert, icon: null },
    { id: 'iti', label: t('modeIti'), count: counts.iti, icon: null },
    { id: 'saved', label: t('modeSaved'), count: counts.saved, icon: <Bookmark className="h-4 w-4" aria-hidden="true" /> },
    { id: 'drives', label: t('modeDrives'), count: counts.drives, icon: <Calendar className="h-4 w-4" aria-hidden="true" /> },
  ];

  const firstName = activeWorker?.name.split(' ')[0] ?? '';
  const showingJobs = feedMode !== 'drives';

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      {/* Page heading + the one thing to do here: find and apply. */}
      {activeWorker ? (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight text-slate-900">
              {t('wfWelcome', { name: firstName })}
            </h1>
            <p className="text-body text-slate-600">
              {activeWorker.trade} · {activeWorker.currentCity}, {activeWorker.homeState}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setQuizOpen(true)} className="btn btn-secondary btn-sm">
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>{t('wfSkillQuiz')}</span>
            </button>
            <button
              type="button"
              aria-pressed={activeAudioId === 'page-voice-guide'}
              onClick={() => playAudio('page-voice-guide', getVoiceGuideScript('worker-feed', currentLang))}
              className="btn btn-secondary btn-sm"
            >
              {activeAudioId === 'page-voice-guide' ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{activeAudioId === 'page-voice-guide' ? t('stopAudio') : t('voiceGuideBtn')}</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="card flex flex-col gap-4 border-amber-300 bg-[var(--sk-amber-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <p className="badge badge-worker">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('wfGuestBadge')}
            </p>
            <h1 className="text-2xl font-extrabold leading-tight text-slate-900">{t('wfGuestTitle')}</h1>
            <p className="text-body text-slate-700">{t('wfGuestBody')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:shrink-0">
            <button type="button" onClick={onOpenCreateProfile} className="btn btn-worker">
              {t('wfRegister')}
            </button>
            <button type="button" onClick={onOpenAuthModal} className="btn btn-secondary">
              {t('wfLogin')}
            </button>
          </div>
        </header>
      )}

      {/* Category switcher: five clear choices, current one marked in text and style. */}
      <div role="group" aria-label={t('modeTabsAria')} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className="tab"
            aria-pressed={feedMode === m.id}
            onClick={() => setFeedMode(m.id)}
          >
            {m.icon}
            <span>{m.label}</span>
            <span className="tab-count">{m.count}</span>
          </button>
        ))}
      </div>

      {feedMode === 'drives' ? (
        <section aria-labelledby="drives-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">{t('drivesEyebrow')}</p>
              <h2 id="drives-heading" className="text-xl font-extrabold text-slate-900">
                {t('drivesTitle')}
              </h2>
            </div>
            <button type="button" onClick={() => setFeedMode('all')} className="btn btn-ghost btn-sm">
              ← {t('backToJobs')}
            </button>
          </div>

          {hiringDrives.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title={t('emptyDrivesTitle')}
              body={t('emptyDrivesBody')}
              actions={
                <button type="button" onClick={() => setFeedMode('all')} className="btn btn-worker">
                  {t('browseAllJobs')}
                </button>
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {hiringDrives.map((drive) => {
                const registered = drive.registeredWorkerIds || drive.registeredCandidateIds || [];
                const isRegistered = Boolean(activeWorker && registered.includes(activeWorker.id));
                return (
                  <li key={drive.id} className="card space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="badge badge-employer">{drive.itiInstituteName || t('driveDirectWalkIn')}</p>
                        <h3 className="mt-1 text-lg font-extrabold leading-snug text-slate-900">{drive.title}</h3>
                        <p className="text-body text-slate-600">{drive.companyName}</p>
                      </div>
                      {typeof drive.inHandSalary === 'number' && (
                        <p className="badge badge-verified shrink-0 tabular-nums">
                          ₹{drive.inHandSalary.toLocaleString('en-IN')}
                          {t('perMonthShort')}
                        </p>
                      )}
                    </div>
                    <dl className="space-y-1 text-body text-slate-700">
                      <div>
                        <dt className="inline font-semibold">{t('driveDateVenue')}: </dt>
                        <dd className="inline">
                          {drive.date} · {drive.venueAddress || drive.venue}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">{t('driveTrades')}: </dt>
                        <dd className="inline">
                          {drive.trades.join(', ')}
                          {typeof drive.seatsAvailable === 'number' && ` (${t('driveSeats', { n: drive.seatsAvailable })})`}
                        </dd>
                      </div>
                    </dl>
                    {isRegistered ? (
                      <p className="badge badge-verified w-full justify-center !py-2.5 text-body">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {t('driveReserved')}
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-worker w-full"
                        onClick={() => (activeWorker ? onRegisterDrive?.(drive.id) : onOpenAuthModal())}
                      >
                        {t('driveReserve')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <>
          <section aria-label={t('filterRegionLabel')} className="card space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1.3fr]">
              <div>
                <label htmlFor="job-search" className="field-label">
                  {t('searchJobsLabel')}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    id="job-search"
                    type="search"
                    value={filters.query}
                    placeholder={t('searchWorkerPlaceholder')}
                    onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                    className="field !pl-9"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="job-trade" className="field-label">
                  {t('filterTrade')}
                </label>
                <select
                  id="job-trade"
                  className="field"
                  value={filters.trade}
                  onChange={(e) => setFilters((f) => ({ ...f, trade: e.target.value }))}
                >
                  <option value={ALL}>{t('filterAllTrades')}</option>
                  {TRADES.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="job-sort" className="field-label">
                  {t('sortBy')}
                </label>
                <select
                  id="job-sort"
                  className="field"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as JobSort)}
                >
                  <option value="best-match">{t('sortBest')}</option>
                  <option value="highest-pay">{t('sortPay')}</option>
                  {activeWorker && <option value="nearest">{t('sortNearest')}</option>}
                </select>
              </div>
            </div>

            <Disclosure
              label={t('moreFilters')}
              openLabel={t('fewerFilters')}
              hint={hiddenFilterCount > 0 ? t('filtersActive', { n: hiddenFilterCount }) : undefined}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="job-hub" className="field-label">
                    {t('filterHub')}
                  </label>
                  <select
                    id="job-hub"
                    className="field"
                    value={filters.hub}
                    onChange={(e) => setFilters((f) => ({ ...f, hub: e.target.value }))}
                  >
                    <option value={ALL}>{t('filterAllHubs')}</option>
                    {HUBS.map((hub) => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex min-h-11 items-center gap-2 self-end text-body text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.hostelOnly}
                    onChange={(e) => setFilters((f) => ({ ...f, hostelOnly: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-400 accent-[var(--sk-amber)]"
                  />
                  <span>{t('hostelOnly')}</span>
                </label>
              </div>
            </Disclosure>

            <ActiveFilters
              items={filterItems}
              onRemove={removeFilter}
              onReset={resetFilters}
              resetLabel={t('resetFilters')}
              removeLabel={(label) => t('removeFilter', { label })}
            />
          </section>

          <p role="status" aria-live="polite" className="text-body font-semibold tabular-nums text-slate-700">
            {t('jobsFound', { n: visibleJobs.length })}
          </p>

          {visibleJobs.length > 0 ? (
            <ul className="space-y-4">
              {visibleJobs.map((job) => {
                const match = matches.get(job.id) ?? null;
                const application = activeWorker
                  ? applications.find((a) => a.jobId === job.id && a.candidateId === activeWorker.id)
                  : undefined;
                return (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      t={t}
                      application={application}
                      isSaved={savedIds.has(job.id)}
                      savePending={pendingSaveIds.includes(job.id)}
                      matchScore={match ? match.score : null}
                      matchReasons={match ? match.reasons : []}
                      distanceKm={
                        job.clusterDistanceKm ??
                        (activeWorker ? estimateClusterDistanceKm(activeWorker.currentCity, job.industrialHub) : 0)
                      }
                      workerCity={activeWorker?.currentCity}
                      showDistance={Boolean(activeWorker)}
                      isAudioPlaying={activeAudioId === job.id}
                      listenLabel={t('listenAudio')}
                      stopLabel={t('stopAudio')}
                      onToggleSave={() => toggleSave(job.id)}
                      onApply={() => onApplyJob(job)}
                      onOpenApplication={onOpenWorkerProfile}
                      onCallHr={() => setCallingJob(job)}
                      onWhatsApp={() => applyViaWhatsApp(job)}
                      onToggleAudio={() => playAudio(job.id, getAudioNarrationScript(job, currentLang))}
                      onReport={() => onOpenReport(job.companyName)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <JobsEmptyState
              t={t}
              mode={feedMode}
              signedIn={Boolean(activeWorker)}
              totalLive={counts.all}
              filtersActive={activeFilterCount > 0}
              onReset={resetFilters}
              onBrowseAll={() => setFeedMode('all')}
              onLogin={onOpenAuthModal}
            />
          )}
        </>
      )}

      <Dialog
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        eyebrow={t('quizEyebrow')}
        title={t('quizTitle')}
        closeLabel={t('close')}
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setQuizOpen(false)} className="btn btn-secondary">
              {t('close')}
            </button>
            <button type="button" onClick={() => setQuizSubmitted(true)} className="btn btn-worker">
              {t('quizSubmit')}
            </button>
          </>
        }
      >
        <ol className="space-y-4">
          {SHOP_FLOOR_PRACTICE_QUIZ.map((q, idx) => (
            <li key={q.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-body font-bold text-slate-900">
                {idx + 1}. {currentLang === 'hi' ? q.questionHi : q.questionEn}
              </p>
              <div role="group" aria-label={`${idx + 1}`} className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, optIndex) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={quizAnswers[q.id] === optIndex}
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers((prev) => ({ ...prev, [q.id]: optIndex }));
                    }}
                    className="tab !justify-start !text-left"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <p role="status" aria-live="polite" className="mt-4">
          {quizSubmitted && (
            <span className="badge badge-verified !text-body">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t('quizResult', { score: quizScore, total: SHOP_FLOOR_PRACTICE_QUIZ.length })}
            </span>
          )}
        </p>
      </Dialog>

      <Dialog
        open={callingJob !== null}
        onClose={() => setCallingJob(null)}
        title={t('callTitle')}
        closeLabel={t('close')}
        footer={
          callingJob && (
            <>
              <button type="button" onClick={() => setCallingJob(null)} className="btn btn-secondary">
                {t('close')}
              </button>
              <a href={`tel:${callingJob.hrContactPhone}`} className="btn btn-worker">
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                {t('callNow')}
              </a>
            </>
          )
        }
      >
        {callingJob && (
          <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-meta text-slate-600">{t('callOfficial')}</p>
            <p className="text-lg font-bold text-slate-900">{callingJob.hrContactName}</p>
            <p className="text-body text-slate-700">
              {callingJob.companyName} · {callingJob.industrialHub}
            </p>
            <a
              href={`tel:${callingJob.hrContactPhone}`}
              className="inline-flex min-h-11 items-center gap-2 text-lg font-bold tabular-nums text-[var(--sk-blue-text)] underline"
            >
              {callingJob.hrContactPhone}
            </a>
          </div>
        )}
      </Dialog>
    </div>
  );
};

interface JobsEmptyProps {
  t: ReturnType<typeof makeT>;
  mode: FeedMode;
  signedIn: boolean;
  totalLive: number;
  filtersActive: boolean;
  onReset: () => void;
  onBrowseAll: () => void;
  onLogin: () => void;
}

/** Explains why the list is empty and offers the one step that fixes it. */
const JobsEmptyState: React.FC<JobsEmptyProps> = ({
  t,
  mode,
  signedIn,
  totalLive,
  filtersActive,
  onReset,
  onBrowseAll,
  onLogin,
}) => {
  const resetButton = (
    <button type="button" onClick={onReset} className="btn btn-worker">
      {t('resetFilters')}
    </button>
  );
  const browseButton = (
    <button type="button" onClick={onBrowseAll} className="btn btn-worker">
      {t('browseAllJobs')}
    </button>
  );

  if (mode === 'saved' && !signedIn) {
    return (
      <EmptyState
        icon={<Bookmark className="h-6 w-6" />}
        title={t('emptySavedGuestTitle')}
        body={t('emptySavedGuestBody')}
        actions={
          <button type="button" onClick={onLogin} className="btn btn-worker">
            {t('wfLogin')}
          </button>
        }
      />
    );
  }
  if (filtersActive) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title={t('noJobsMatchTitle')}
        body={t('noJobsMatchBody')}
        actions={resetButton}
      />
    );
  }
  if (mode === 'saved') {
    return (
      <EmptyState
        icon={<Bookmark className="h-6 w-6" />}
        title={t('emptySavedTitle')}
        body={t('emptySavedBody')}
        actions={browseButton}
      />
    );
  }
  if (totalLive === 0) {
    return (
      <EmptyState icon={<Briefcase className="h-6 w-6" />} title={t('emptyJobsTitle')} body={t('emptyJobsBody')} />
    );
  }
  // A category (helper / ITI) with nothing in it while other jobs exist.
  return (
    <EmptyState
      icon={<Briefcase className="h-6 w-6" />}
      title={t('noJobsMatchTitle')}
      body={t('noJobsMatchBody')}
      actions={browseButton}
    />
  );
};
