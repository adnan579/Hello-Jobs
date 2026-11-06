import React, { useState } from 'react';
import {
  CandidateProfile,
  JobListing,
  Language,
  AuthSession,
  EmployerFactoryProfile,
} from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  Briefcase,
  MapPin,
  Search,
  PhoneCall,
  FileText,
  QrCode,
  Award,
  Heart,
  ShieldCheck,
  Phone,
  Lock,
  Package,
  UserCheck,
  Building2,
  Users,
  Layers,
} from 'lucide-react';

interface Props {
  candidates: CandidateProfile[];
  jobs: JobListing[];
  currentLang: Language;
  authSession: AuthSession | null;
  employerProfile: EmployerFactoryProfile;
  shortlistedIds: string[];
  onToggleShortlist: (candidateId: string) => void;
  onUnlockCandidateContact: (candidateId: string) => void;
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

  const [tab, setTab] = useState<'candidates' | 'jobs'>('candidates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedExp, setSelectedExp] = useState<string>('all');
  const [selectedSalaryMin, setSelectedSalaryMin] = useState<string>('all');
  const [selectedCertificateFilter, setSelectedCertificateFilter] =
    useState<'all' | 'certified' | 'iti-graduate' | 'ncvt-verified'>('all');

  const isPremium = employerProfile.subscriptionTier === 'premium';
  const isPaid = employerProfile.isPaid;
  const isEnterprise = employerProfile.subscriptionTier === 'enterprise';

  const allTrades = [
    'all',
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

  const allCities = [
    'all',
    ...Array.from(new Set(candidates.map((c) => c.currentCity))),
  ];

  const allExpRanges = [
    'all',
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-7 years',
    '7+ years',
  ];

  const allSalaryMins = [
    'all',
    '10000',
    '12000',
    '15000',
    '18000',
    '22000',
    '25000',
    '30000',
  ];

  const unlockedSet = new Set(employerProfile.unlockedCandidateIds || []);
  const shortlistSet = new Set(shortlistedIds);

  const displayCandidates = candidates
    .filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.currentCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.previousCompanies.some((co) =>
          co.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesTrade = selectedTrade === 'all' || c.trade === selectedTrade;
      const matchesCity = selectedCity === 'all' || c.currentCity === selectedCity;
      const matchesExp =
        selectedExp === 'all' ||
        (c.totalExperienceYears >= parseInt(selectedExp.split('-')[0]) &&
          (selectedExp.includes('+')
            ? c.totalExperienceYears >= parseInt(selectedExp.split('+')[0])
            : c.totalExperienceYears <= parseInt(selectedExp.split('-')[1] || '999')));
      const matchesSalary =
        selectedSalaryMin === 'all' ||
        c.expectedSalaryMin >= parseInt(selectedSalaryMin);
      const matchesCert =
        selectedCertificateFilter === 'all' ||
        (selectedCertificateFilter === 'certified' && c.isCertified) ||
        (selectedCertificateFilter === 'iti-graduate' && c.isItiGraduate) ||
        (selectedCertificateFilter === 'ncvt-verified' && !!c.ncvtCertificate);

      return (
        matchesSearch &&
        matchesTrade &&
        matchesCity &&
        matchesExp &&
        matchesSalary &&
        matchesCert
      );
    })
    .sort((a, b) => {
      // Premium + paid factories see best-matched first.
      const aScore =
        (a.skillsMatchScore || 0) * 0.4 +
        (a.isItiGraduate ? 10 : 0) +
        (a.isCertified ? 10 : 0) +
        (a.ncvtCertificate ? 10 : 0);
      const bScore =
        (b.skillsMatchScore || 0) * 0.4 +
        (b.isItiGraduate ? 10 : 0) +
        (b.isCertified ? 10 : 0) +
        (b.ncvtCertificate ? 10 : 0);
      return bScore - aScore;
    });

  const factoryJobs = jobs.filter((j) => j.factoryId === employerProfile.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Employer Welcome & Dashboard Banner */}
      {authSession?.role === 'employer' ? (
        <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
              {employerProfile.logoText || 'F'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400 font-semibold">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {employerProfile.companyName} · {employerProfile.industrialHub}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                  {employerProfile.onboardingStatus}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {t.candidateDirectory}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-emerald-300 border border-slate-700 rounded-md">
                  {factoryJobs.length} Active Job{factoryJobs.length === 1 ? '' : 's'}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-amber-300 border border-slate-700 rounded-md">
                  {shortlistedIds.length} Shortlisted
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-blue-300 border border-slate-700 rounded-md">
                  ₹{(employerProfile.balanceCredits || 0).toLocaleString('en-IN')} Credits
                </span>
                {isEnterprise && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-md">
                    Enterprise Plan
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenEmployerProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard & Edit Profile</span>
            </button>

            <button
              onClick={onOpenPostJob}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              <Briefcase className="w-4 h-4" />
              <span>{t.postRequirement}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-slate-900 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Post Free Job Requirements · Direct Candidate Contact</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Factory Employer Portal
            </h2>
            <p className="text-xs text-slate-700 max-w-2xl">
              Post job requirements, shortlist verified candidates with skill badges, issue digital offer letters, and manage payroll compliance. Log in or register to unlock full features.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>Employer Login</span>
            </button>

            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Register Factory</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setTab('candidates')}
          className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
            tab === 'candidates'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Verified Candidate Pool
          </span>
        </button>
        <button
          onClick={() => setTab('jobs')}
          className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
            tab === 'jobs'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            My Posted Jobs ({factoryJobs.length})
          </span>
        </button>
      </div>

      {tab === 'candidates' ? (
        <>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.searchCandidatePlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Certification:</span>
                <select
                  value={selectedCertificateFilter}
                  onChange={(e) =>
                    setSelectedCertificateFilter(e.target.value as typeof selectedCertificateFilter)
                  }
                  className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value="all">All Levels</option>
                  <option value="certified">Trade Certified</option>
                  <option value="iti-graduate">ITI Graduate</option>
                  <option value="ncvt-verified">NCVT Verified</option>
                </select>
              </div>
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
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {trade === 'all' ? t.filterAllTrades : trade}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">City:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                >
                  {allCities.map((city) => (
                    <option key={city} value={city}>
                      {city === 'all' ? t.filterAllCities : city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Experience:</span>
                <select
                  value={selectedExp}
                  onChange={(e) => setSelectedExp(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                >
                  {allExpRanges.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp === 'all' ? t.filterAllExperience : exp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Min Salary:</span>
                <select
                  value={selectedSalaryMin}
                  onChange={(e) => setSelectedSalaryMin(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                >
                  {allSalaryMins.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'Any' : `₹${parseInt(s).toLocaleString('en-IN')}`}
                    </option>
                  ))}
                </select>
              </div>

              <span className="tabular-nums font-semibold text-slate-600">
                {displayCandidates.length} Candidate{displayCandidates.length === 1 ? '' : 's'} Found
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {displayCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-slate-200 rounded-xl">
                <Search className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">{t.emptyStateNoCandidates}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {t.emptyStateNoCandidatesDesc}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTrade('all');
                    setSelectedCity('all');
                    setSelectedExp('all');
                    setSelectedSalaryMin('all');
                    setSelectedCertificateFilter('all');
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
                >
                  {t.resetFilters}
                </button>
              </div>
            ) : (
              displayCandidates.map((c) => {
                const isShortlisted = shortlistSet.has(c.id);
                const isUnlocked = unlockedSet.has(c.id);

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 transition-all hover:border-slate-300 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-black text-base shrink-0">
                          {c.avatarSeed}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">
                              {c.name}
                            </h3>
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-900 rounded-md">
                              {c.trade}
                            </span>
                            {c.isItiGraduate && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-900 rounded-md">
                                ITI Graduate
                              </span>
                            )}
                            {c.isCertified && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-900 rounded-md">
                                Trade Certified
                              </span>
                            )}
                            {c.ncvtCertificate && (
                              <button
                                onClick={() => onInspectCertificate(c)}
                                className="px-2 py-0.5 text-[11px] font-semibold bg-slate-900 text-amber-300 rounded-md hover:bg-slate-800 transition-colors"
                              >
                                NCVT Verified
                              </button>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {c.currentCity}, {c.homeState}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              {c.totalExperienceYears} years · Expected ₹{c.expectedSalaryMin.toLocaleString('en-IN')}/mo
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-slate-400" />
                              {c.skillsMatchScore || 0}% Match
                            </div>
                          </div>

                          {c.machinesHandled && c.machinesHandled.length > 0 && (
                            <div className="text-xs text-slate-600 pt-1">
                              <span className="font-semibold">{t.machinesHandled}:</span>{' '}
                              {c.machinesHandled.join(', ')}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {c.isImmediateJoiner && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                                Immediate Joiner
                              </span>
                            )}
                            {c.isWillingToRelocate && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md">
                                Willing to Relocate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => onToggleShortlist(c.id)}
                          aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                          aria-pressed={isShortlisted}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                            isShortlisted
                              ? 'bg-amber-400 text-slate-950 border-amber-500'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        </button>

                        <button
                          onClick={() => onOpenVideoDemo(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Demo Video
                        </button>

                        <button
                          onClick={() => onOpenIssueOffer(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Issue Offer
                        </button>

                        {isUnlocked ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {c.phone}
                          </a>
                        ) : (
                          <button
                            onClick={() => onUnlockCandidateContact(c.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                              isPaid || isEnterprise
                                ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            disabled={!isPaid && !isEnterprise}
                            title={
                              isPaid || isEnterprise
                                ? 'Unlock phone contact'
                                : 'Purchase credits to unlock contact'
                            }
                          >
                            <Lock className="w-3.5 h-3.5" />
                            {isPaid || isEnterprise ? 'Unlock Contact' : 'Locked'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {factoryJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-slate-200 rounded-xl">
              <Briefcase className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No jobs posted yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Post your first job requirement to start receiving applications.
              </p>
              <button
                onClick={onOpenPostJob}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Post a Job
              </button>
            </div>
          ) : (
            factoryJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:border-slate-300 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {job.title}
                      </h3>
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-900 rounded-md">
                        ₹{job.takeHomeSalary.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {job.trade} · {job.industrialHub} · {job.shiftPattern}
                    </p>
                    <p className="text-xs text-slate-500">
                      {job.openingsCount} openings · Expires {job.expiresAt || 'in 30 days'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                      {job.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
