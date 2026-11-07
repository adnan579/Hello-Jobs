import React, { useMemo, useState } from 'react';
import { Building2, Coins, Factory, Layers, Plus, Search, Users } from 'lucide-react';
import type {
  AuthSession,
  CandidateProfile,
  EmployerFactoryProfile,
  JobListing,
  Language,
} from '../types';
import { makeT } from '../data/translations';
import {
  ALL,
  DEFAULT_CANDIDATE_FILTERS,
  MAX_WAGE_CEILING,
  MIN_WAGE_FLOOR,
  countActiveCandidateFilters,
  directoryCandidates,
  selectCandidates,
  unlockedCandidateIdSet,
  type CandidateFilters,
  type SkillFilter,
} from '../modules/discovery';
import { CandidateCard } from './CandidateCard';
import { Disclosure } from './ui/Disclosure';
import { EmployerPitch } from './EmployerPitch';
import { EmptyState } from './ui/EmptyState';
import { ActiveFilters, type ActiveFilterItem } from './ui/ActiveFilters';

interface Props {
  candidates: CandidateProfile[];
  jobs: JobListing[];
  currentLang: Language;
  authSession: AuthSession | null;
  employerProfile: EmployerFactoryProfile;
  shortlistedIds: string[];
  /** Which section to open on. The app uses the default; tests and deep links can set it. */
  initialTab?: 'hunt' | 'inbound';
  onToggleShortlist: (candidateId: string) => void;
  onUnlockCandidateContact?: (candidateId: string) => Promise<void>;
  onOpenEmployerProfile: () => void;
  onOpenAuthModal: () => void;
  onOpenPostJob: () => void;
  /** Visitors can register a factory, and read how the platform works. */
  onRegisterFactory?: () => void;
  onSeeHow?: () => void;
  onInspectCertificate: (candidate: CandidateProfile) => void;
  onOpenVideoDemo: (candidate: CandidateProfile) => void;
  onOpenIssueOffer: (candidate: CandidateProfile) => void;
}

// Trade vocabulary for the filter. These are data values, not UI copy.
const TRADES = [
  'Packing & Box Loading (No Certificate)',
  'Factory Floor Helper (No Certificate)',
  'Assembly Line Helper',
  'CNC / VMC Operator',
  'Fitter (Assembly & Bench)',
  'Welder (MIG / TIG / ARC)',
  'Machinist (Lathe / Milling)',
  'Industrial Electrician',
];

export const EmployerPortal: React.FC<Props> = ({
  candidates,
  jobs,
  currentLang,
  authSession,
  employerProfile,
  shortlistedIds,
  initialTab = 'hunt',
  onToggleShortlist,
  onUnlockCandidateContact,
  onOpenEmployerProfile,
  onOpenAuthModal,
  onOpenPostJob,
  onRegisterFactory,
  onSeeHow,
  onInspectCertificate,
  onOpenVideoDemo,
  onOpenIssueOffer,
}) => {
  const t = useMemo(() => makeT(currentLang), [currentLang]);

  const [activeTab, setActiveTab] = useState<'hunt' | 'inbound'>(initialTab);
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_CANDIDATE_FILTERS);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Unlocked contacts are whatever the server says this factory unlocked. Nothing is pre-filled.
  const unlockedIds = useMemo(() => unlockedCandidateIdSet(employerProfile), [employerProfile]);
  const directoryTotal = useMemo(() => directoryCandidates(candidates).length, [candidates]);
  const visible = useMemo(() => selectCandidates(candidates, filters), [candidates, filters]);

  const activeFilterCount = countActiveCandidateFilters(filters);
  const wageChanged = filters.maxExpectedSalary !== DEFAULT_CANDIDATE_FILTERS.maxExpectedSalary;
  const hiddenFilterCount = (filters.ncvtOnly ? 1 : 0) + (filters.relocationOnly ? 1 : 0) + (wageChanged ? 1 : 0);

  const filterItems: ActiveFilterItem[] = [
    ...(filters.query.trim() ? [{ key: 'query', label: `“${filters.query.trim()}”` }] : []),
    ...(filters.trade !== ALL ? [{ key: 'trade', label: filters.trade }] : []),
    ...(filters.ncvtOnly ? [{ key: 'ncvt', label: t('ncvtOnly') }] : []),
    ...(filters.relocationOnly ? [{ key: 'reloc', label: t('relocOnly') }] : []),
    ...(wageChanged
      ? [{ key: 'wage', label: `${t('maxWage')}: ₹${filters.maxExpectedSalary.toLocaleString('en-IN')}${t('perMonthShort')}` }]
      : []),
  ];

  const removeFilter = (key: string) =>
    setFilters((f) => {
      switch (key) {
        case 'query':
          return { ...f, query: '' };
        case 'trade':
          return { ...f, trade: ALL };
        case 'ncvt':
          return { ...f, ncvtOnly: false };
        case 'reloc':
          return { ...f, relocationOnly: false };
        default:
          return { ...f, maxExpectedSalary: DEFAULT_CANDIDATE_FILTERS.maxExpectedSalary };
      }
    });
  const resetFilters = () => setFilters(DEFAULT_CANDIDATE_FILTERS);

  const unlock = async (candidateId: string) => {
    if (!onUnlockCandidateContact) return;
    setUnlockingId(candidateId);
    try {
      await onUnlockCandidateContact(candidateId);
    } finally {
      setUnlockingId(null);
    }
  };

  const isEmployer = authSession?.role === 'employer';
  // The directory and the posting form belong to a signed-in factory.
  if (!isEmployer) {
    return (
      <EmployerPitch
        t={t}
        onRegister={onRegisterFactory ?? onOpenAuthModal}
        onLogin={onOpenAuthModal}
        onSeeHow={onSeeHow ?? onOpenAuthModal}
      />
    );
  }

  const skillTabs: { id: SkillFilter; label: string }[] = [
    { id: 'all', label: t('skillAll') },
    { id: 'helper', label: t('skillHelper') },
    { id: 'iti', label: t('skillIti') },
  ];

  return (
    <div data-role="employer" className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="card flex flex-col gap-4 border-l-4 border-l-[var(--sk-blue)] p-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-1.5">
          <p className="flex flex-wrap items-center gap-2">
            {employerProfile.companyName && (
              <span className="badge badge-employer">
                <Factory className="h-3.5 w-3.5" aria-hidden="true" />
                {employerProfile.companyName}
              </span>
            )}
            <span className="badge badge-worker tabular-nums">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              {t('efCredits', { n: employerProfile.huntCredits ?? 0 })}
            </span>
          </p>
          <h1 className="text-2xl font-extrabold leading-tight text-slate-900">{t('efTitle')}</h1>
          <p className="text-body text-slate-700">{t('efDesc')}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
          {/* A signed-in factory's actions. Visitors never reach this view (see EmployerPitch). */}
              <button type="button" onClick={onOpenPostJob} className="btn btn-employer">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t('postRequirement')}</span>
              </button>
              <button type="button" onClick={onOpenEmployerProfile} className="btn btn-secondary">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>{t('efDashboard', { n: shortlistedIds.length })}</span>
              </button>
        </div>
      </header>

      <div role="group" aria-label={t('employerTabsAria')} className="grid grid-cols-2 gap-2 sm:max-w-lg">
        <button type="button" className="tab" aria-pressed={activeTab === 'hunt'} onClick={() => setActiveTab('hunt')}>
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>{t('tabCandidates', { n: directoryTotal })}</span>
        </button>
        <button type="button" className="tab" aria-pressed={activeTab === 'inbound'} onClick={() => setActiveTab('inbound')}>
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span>{t('tabJobs', { n: jobs.length })}</span>
        </button>
      </div>

      {activeTab === 'hunt' ? (
        <div className="space-y-4">
          <div role="group" aria-label={t('skillTabsAria')} className="grid gap-2 sm:grid-cols-3 sm:max-w-3xl">
            {skillTabs.map((s) => (
              <button
                key={s.id}
                type="button"
                className="tab"
                aria-pressed={filters.skill === s.id}
                onClick={() => setFilters((f) => ({ ...f, skill: s.id }))}
              >
                {s.label}
              </button>
            ))}
          </div>

          <section aria-label={t('filterRegionLabel')} className="card space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cand-search" className="field-label">
                  {t('searchCandidatesLabel')}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    id="cand-search"
                    type="search"
                    value={filters.query}
                    placeholder={t('searchCandidatePlaceholder')}
                    onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                    className="field !pl-9"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cand-trade" className="field-label">
                  {t('filterTrade')}
                </label>
                <select
                  id="cand-trade"
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
            </div>

            <Disclosure
              label={t('moreFilters')}
              openLabel={t('fewerFilters')}
              hint={hiddenFilterCount > 0 ? t('filtersActive', { n: hiddenFilterCount }) : undefined}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex min-h-11 items-center gap-2 text-body text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.ncvtOnly}
                    onChange={(e) => setFilters((f) => ({ ...f, ncvtOnly: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-400 accent-[var(--sk-blue)]"
                  />
                  <span>{t('ncvtOnly')}</span>
                </label>
                <label className="flex min-h-11 items-center gap-2 text-body text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.relocationOnly}
                    onChange={(e) => setFilters((f) => ({ ...f, relocationOnly: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-400 accent-[var(--sk-blue)]"
                  />
                  <span>{t('relocOnly')}</span>
                </label>
                <div>
                  <label htmlFor="cand-wage" className="field-label">
                    {t('maxWage')}:{' '}
                    <span className="tabular-nums text-slate-900">
                      ₹{filters.maxExpectedSalary.toLocaleString('en-IN')}
                      {t('perMonthShort')}
                    </span>
                  </label>
                  <input
                    id="cand-wage"
                    type="range"
                    min={MIN_WAGE_FLOOR}
                    max={MAX_WAGE_CEILING}
                    step={1000}
                    value={filters.maxExpectedSalary}
                    aria-valuetext={`₹${filters.maxExpectedSalary.toLocaleString('en-IN')}${t('perMonthShort')}`}
                    onChange={(e) => setFilters((f) => ({ ...f, maxExpectedSalary: Number(e.target.value) }))}
                    className="h-11 w-full cursor-pointer accent-[var(--sk-blue)]"
                  />
                </div>
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
            {t('candidatesFound', { n: visible.length })}
          </p>

          {visible.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {visible.map((candidate) => (
                <li key={candidate.id} className="flex">
                  <div className="flex-1">
                    <CandidateCard
                      candidate={candidate}
                      t={t}
                      isShortlisted={shortlistedIds.includes(candidate.id)}
                      isUnlocked={unlockedIds.has(candidate.id)}
                      isUnlocking={unlockingId === candidate.id}
                      canUnlock={Boolean(onUnlockCandidateContact)}
                      onToggleShortlist={() => onToggleShortlist(candidate.id)}
                      onUnlock={() => unlock(candidate.id)}
                      onInspectCertificate={() => onInspectCertificate(candidate)}
                      onOpenVideoDemo={() => onOpenVideoDemo(candidate)}
                      onOpenIssueOffer={() => onOpenIssueOffer(candidate)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : directoryTotal === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={t('emptyCandidatesTitle')}
              body={t('emptyCandidatesBody')}
              actions={
                <button type="button" onClick={onOpenPostJob} className="btn btn-employer">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('postRequirement')}
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title={t('noCandidatesMatchTitle')}
              body={t('noCandidatesMatchBody')}
              actions={
                activeFilterCount > 0 ? (
                  <button type="button" onClick={resetFilters} className="btn btn-employer">
                    {t('resetFilters')}
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      ) : (
        <section aria-labelledby="postings-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="postings-heading" className="text-xl font-extrabold text-slate-900">
              {t('tabJobs', { n: jobs.length })}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onOpenEmployerProfile} className="btn btn-secondary btn-sm">
                {t('manageApplicants')}
              </button>
              <button type="button" onClick={onOpenPostJob} className="btn btn-employer btn-sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t('createOpening')}</span>
              </button>
            </div>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title={t('emptyPostingsTitle')}
              body={t('emptyPostingsBody')}
              actions={
                <button type="button" onClick={onOpenPostJob} className="btn btn-employer">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('createOpening')}
                </button>
              }
            />
          ) : (
            <>
              {/* Phones: one card per posting, so nothing needs sideways scrolling. */}
              <ul className="space-y-3 md:hidden">
                {jobs.map((job) => (
                  <li key={job.id} className="card space-y-1 p-4">
                    <h3 className="text-base font-extrabold text-slate-900">{job.title}</h3>
                    <p className="text-body text-slate-600">
                      {job.companyName} · {job.industrialHub}
                    </p>
                    <p className="text-body text-slate-800">{job.trade}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body tabular-nums">
                      <span className="font-bold text-[var(--sk-green-text)]">
                        ₹{job.takeHomeSalary.toLocaleString('en-IN')}
                        {t('perMonthShort')}
                      </span>
                      <span className="font-semibold text-[var(--sk-blue-text)]">
                        {t('vacanciesLeft', { left: job.vacanciesLeft, total: job.openingsCount })}
                      </span>
                      <span className={`badge ${job.isActive === false ? '' : 'badge-verified'}`}>
                        {job.isActive === false ? t('statusClosed') : t('statusActive')}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>

              <div className="card hidden overflow-hidden md:block">
                <table className="w-full text-left text-body">
                  <caption className="sr-only">{t('postingsTableCaption')}</caption>
                  <thead className="bg-slate-100 text-meta font-bold text-slate-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">{t('thJob')}</th>
                      <th scope="col" className="px-4 py-3">{t('thTrade')}</th>
                      <th scope="col" className="px-4 py-3 text-right">{t('thPay')}</th>
                      <th scope="col" className="px-4 py-3 text-right">{t('thVacancies')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <th scope="row" className="px-4 py-3 font-normal">
                          <span className="block font-bold text-slate-900">{job.title}</span>
                          <span className="block text-meta text-slate-600">
                            {job.companyName} · {job.industrialHub}
                          </span>
                        </th>
                        <td className="px-4 py-3 text-slate-800">{job.trade}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-[var(--sk-green-text)]">
                          ₹{job.takeHomeSalary.toLocaleString('en-IN')}
                          {t('perMonthShort')}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="font-semibold text-[var(--sk-blue-text)]">
                            {t('vacanciesLeft', { left: job.vacanciesLeft, total: job.openingsCount })}
                          </span>{' '}
                          <span className={`badge ${job.isActive === false ? '' : 'badge-verified'}`}>
                            {job.isActive === false ? t('statusClosed') : t('statusActive')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};
