import React, { useState } from 'react';
import {
  CandidateProfile,
  JobListing,
  Language,
  EmployerFactoryProfile,
  AuthSession,
} from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  Factory,
  Search,
  Plus,
  ShieldCheck,
  Video,
  FileText,
  Building2,
  MapPin,
  Layers,
  Award,
  Bookmark,
  BookmarkCheck,
  Package,
  Lock,
  Unlock,
  Coins,
} from 'lucide-react';

interface Props {
  candidates: CandidateProfile[];
  jobs: JobListing[];
  currentLang: Language;
  authSession: AuthSession | null;
  employerProfile: EmployerFactoryProfile;
  shortlistedIds: string[];
  onToggleShortlist: (candidateId: string) => void;
  onUnlockCandidateContact?: (candidateId: string) => Promise<void>;
  onOpenEmployerProfile: () => void;
  onOpenAuthModal: () => void;
  onOpenPostJob: () => void;
  onInspectCertificate: (candidate: CandidateProfile) => void;
  onOpenVideoDemo: (candidate: CandidateProfile) => void;
  onOpenIssueOffer: (candidate: CandidateProfile) => void;
}

export const EmployerPortal: React.FC<Props> = ({
  candidates,
  jobs,
  currentLang,
  authSession,
  employerProfile,
  shortlistedIds,
  onToggleShortlist,
  onUnlockCandidateContact,
  onOpenEmployerProfile,
  onOpenAuthModal,
  onOpenPostJob,
  onInspectCertificate,
  onOpenVideoDemo,
  onOpenIssueOffer,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [activeTab, setActiveTab] = useState<'hunt' | 'inbound'>('hunt');
  const [skillFilter, setSkillFilter] = useState<'all' | 'helper' | 'iti'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [ncvtOnly, setNcvtOnly] = useState(false);
  const [relocationOnly, setRelocationOnly] = useState(false);
  const [maxExpectedSalary, setMaxExpectedSalary] = useState(32000);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const unlockedSet = new Set(employerProfile.unlockedCandidateIds || ['cand-1', 'cand-2']);

  const allTrades = [
    'all',
    'Packing & Box Loading (No Certificate)',
    'Factory Floor Helper (No Certificate)',
    'Assembly Line Helper',
    'CNC / VMC Operator',
    'Fitter (Assembly & Bench)',
    'Welder (MIG / TIG / ARC)',
    'Machinist (Lathe / Milling)',
    'Industrial Electrician',
  ];

  const filteredCandidates = candidates.filter((c) => {
    if (c.dpdpConsent?.isWithdrawn || c.dpdpConsent?.directoryDiscovery === false) {
      return false;
    }

    const matchesSkillFilter =
      skillFilter === 'all' ||
      (skillFilter === 'helper' && c.category !== 'skilled') ||
      (skillFilter === 'iti' && c.category === 'skilled');

    const matchesTrade = selectedTrade === 'all' || c.trade === selectedTrade;
    const matchesNcvt = !ncvtOnly || c.ncvtCertificate.isVerified;
    const matchesReloc = !relocationOnly || c.willingToRelocate;
    const matchesSalary = c.expectedSalary <= maxExpectedSalary;
    const matchesSearch =
      searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.currentCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.homeState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.machinesOperated.some((m) =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return (
      matchesSkillFilter &&
      matchesTrade &&
      matchesNcvt &&
      matchesReloc &&
      matchesSalary &&
      matchesSearch
    );
  });

  const handleUnlockClick = async (candidateId: string) => {
    if (!onUnlockCandidateContact) return;
    setUnlockingId(candidateId);
    try {
      await onUnlockCandidateContact(candidateId);
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Employer Top Header */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-blue-300 text-xs font-semibold">
            <Factory className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {employerProfile.companyName} · GSTIN: {employerProfile.gstin}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-extrabold tabular-nums flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {employerProfile.huntCredits ?? 0} Contact Credits Available
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Candidate Directory — Search, Shortlist & Invite Workers
          </h2>
          <p className="text-xs text-slate-300">
            Search verified helpers, packers, and ITI machine operators. Candidate phone numbers remain masked (<span className="tabular-nums">+91 98•••••210</span>) until they apply or you unlock & invite them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {authSession?.role === 'employer' ? (
            <button
              onClick={onOpenEmployerProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>
                Employer Dashboard ({shortlistedIds.length} Shortlisted)
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Employer Login / Register</span>
            </button>
          )}

          <button
            onClick={onOpenPostJob}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.postRequirement}</span>
          </button>
        </div>
      </div>

      {/* Dual Mode Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('hunt')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'hunt'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>
              {t.candidateDirectory} ({filteredCandidates.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inbound')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'inbound'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Plant Job Postings ({jobs.length})</span>
          </button>
        </div>

        <button
          onClick={onOpenEmployerProfile}
          className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Go to Employer Dashboard & Shortlist →</span>
        </button>
      </div>

      {activeTab === 'hunt' ? (
        <div className="space-y-6">
          {/* Quick Workforce Category Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSkillFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                skillFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Workers ({candidates.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSkillFilter('helper');
                setNcvtOnly(false);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                skillFilter === 'helper'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Helpers, Packers & Loaders (Work-Readiness Verified)</span>
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter('iti')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                skillFilter === 'iti'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>ITI & Skilled Machine Operators</span>
            </button>
          </div>

          {/* Outbound Industrial Filter Panel */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchCandidatePlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                {t.filterTrade}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allTrades.map((trade) => (
                  <button
                    key={trade}
                    onClick={() => setSelectedTrade(trade)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      selectedTrade === trade
                        ? 'bg-blue-700 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {trade === 'all' ? t.filterAllTrades : trade}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={ncvtOnly}
                    onChange={(e) => setNcvtOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>NCVT / SCVT Verified Only</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={relocationOnly}
                    onChange={(e) => setRelocationOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Willing to Relocate Inter-State</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-500">Max Wage:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  ₹{maxExpectedSalary.toLocaleString('en-IN')}/mo
                </span>
                <input
                  type="range"
                  min={15000}
                  max={35000}
                  step={1000}
                  value={maxExpectedSalary}
                  onChange={(e) => setMaxExpectedSalary(Number(e.target.value))}
                  className="w-28 accent-blue-600 cursor-pointer"
                />
                <span className="text-slate-400">·</span>
                <span className="tabular-nums text-slate-500">
                  {filteredCandidates.length} Candidates
                </span>
              </div>
            </div>
          </div>

          {/* Candidates Grid with M2 Masked Phone & M7/M12 1-Credit Contact Unlock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCandidates.map((candidate) => {
              const isShortlisted = shortlistedIds.includes(candidate.id);
              const isUnlocked = unlockedSet.has(candidate.id);
              const rawDigits = candidate.phone.replace(/\D/g, '').slice(-10);
              const maskedPhone = `+91 ${rawDigits.slice(0, 2)}•••••${rawDigits.slice(-3)}`;

              return (
                <div
                  key={candidate.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-150"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {candidate.avatarSeed}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 tracking-tight">
                            {candidate.name}
                          </h4>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">
                              {candidate.trade}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{candidate.experienceYears} Yrs Exp</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleShortlist(candidate.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
                            isShortlisted
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isShortlisted ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Shortlisted</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Shortlist</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Location, Pay Range & Masked/Unlocked Phone Row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {candidate.ncvtCertificate.isVerified ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          NCVT Grade {candidate.ncvtCertificate.grade}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Work-Readiness Verified
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.currentCity} ({candidate.homeState})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        ₹{(candidate.expectedPayMin || candidate.expectedSalary).toLocaleString('en-IN')}–₹{(candidate.expectedPayMax || candidate.expectedSalary + 2000).toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    {/* M2 & M7 Phone Number Masking Bar */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {isUnlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-emerald-800 tabular-nums">
                              Direct Mobile: {candidate.phone}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-semibold text-slate-700 tabular-nums">
                              Phone Masked: {maskedPhone}
                            </span>
                          </>
                        )}
                      </div>

                      {!isUnlocked && onUnlockCandidateContact && (
                        <button
                          type="button"
                          disabled={unlockingId === candidate.id}
                          onClick={() => handleUnlockClick(candidate.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1"
                        >
                          <Coins className="w-3 h-3" />
                          <span>
                            {unlockingId === candidate.id
                              ? 'Unlocking...'
                              : 'Unlock & Invite (1 Credit)'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Machines / Tasks Handled */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {t.machinesHandled}:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.machinesOperated.map((machine, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs"
                          >
                            {machine}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Candidate Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {candidate.ncvtCertificate.isVerified && (
                        <button
                          onClick={() => onInspectCertificate(candidate)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>View NCVT Card</span>
                        </button>
                      )}

                      {candidate.hasVideoDemo && (
                        <button
                          onClick={() => onOpenVideoDemo(candidate)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          <Video className="w-3.5 h-3.5 text-slate-500" />
                          <span>30s Practical Demo</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenIssueOffer(candidate)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Issue Locked-Pay Offer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Inbound Postings Overview */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Active Production Line Postings ({jobs.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenEmployerProfile}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                Manage Applicants in Factory Workspace
              </button>
              <button
                onClick={onOpenPostJob}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Opening</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="grid grid-cols-12 bg-slate-100 p-3 text-xs font-semibold text-slate-700 border-b border-slate-200">
              <span className="col-span-4">Job Designation & Plant</span>
              <span className="col-span-3">Industrial Trade</span>
              <span className="col-span-2 text-right">In-Hand Salary</span>
              <span className="col-span-3 text-right">Vacancies / Status</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-12 p-3 items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="col-span-4 space-y-0.5">
                    <div className="font-bold text-slate-900">{job.title}</div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {job.companyName} · {job.industrialHub}
                    </div>
                  </div>

                  <div className="col-span-3 font-medium text-slate-800">
                    {job.trade}
                  </div>

                  <div className="col-span-2 text-right font-bold text-emerald-700 tabular-nums">
                    ₹{job.takeHomeSalary.toLocaleString('en-IN')}/mo
                  </div>

                  <div className="col-span-3 text-right tabular-nums">
                    <span className="font-bold text-blue-700">
                      {job.vacanciesLeft} left
                    </span>{' '}
                    of {job.openingsCount} ·{' '}
                    <span className="text-emerald-700 font-semibold">
                      {job.isActive === false ? 'Closed' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
