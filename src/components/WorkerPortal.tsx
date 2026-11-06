import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  Building2,
  Phone,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Share2,
  Heart,
  CheckCircle,
  Filter,
  SlidersHorizontal,
  Search,
  Calendar,
  ArrowLeft,
  RotateCcw,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { Language, JobListing, NotificationEvent } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { SAMPLE_JOBS } from '../data/sampleJobs';
import { ITI_DRIVES } from '../data/itiDrives';

interface WorkerPortalProps {
  activeWorker: { id: string; name: string; phone: string; savedJobIds: string[] } | null;
  searchQuery: string;
  selectedTrade: string;
  selectedHub: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenProfile: () => void;
  onStartLogin: (phone?: string) => void;
  onRegister: () => void;
  onApplyJob: (jobId: string) => void;
  existingApplications: Record<string, { status: string; employerId: string }>;
  postedJobs: JobListing[];
  factoryProfiles: Record<string, { name: string; verified: boolean; rating: number }>;
  onAddNotification: (e: Omit<NotificationEvent, 'id' | 'timestamp'>) => void;
}

export default function WorkerPortal(props: WorkerPortalProps) {
  const t = TRANSLATIONS[props.language];
  const [searchInput, setSearchInput] = useState(props.searchQuery);
  const [selectedTrade, setSelectedTrade] = useState(props.selectedTrade);
  const [selectedHub, setSelectedHub] = useState(props.selectedHub);
  const [hostelFilter, setHostelFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'best-match' | 'highest-pay' | 'nearest'>('best-match');
  const [feedMode, setFeedMode] = useState<'all' | 'saved' | 'no-cert' | 'iti' | 'drives'>('all');
  const [savedJobIds, setSavedJobIds] = useState<string[]>(props.activeWorker?.savedJobIds || []);
  const [showSalaryModal, setShowSalaryModal] = useState<string | null>(null);
  const [showRelocateModal, setShowRelocateModal] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState<string | null>(null);
  const [showNcvtModal, setShowNcvtModal] = useState<string | null>(null);
  const [showFilterBar, setShowFilterBar] = useState(false);

  const allJobs = useMemo(() => [...SAMPLE_JOBS, ...props.postedJobs], [props.postedJobs]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchInput.trim() !== '' ||
      selectedTrade !== 'all' ||
      selectedHub !== 'all' ||
      hostelFilter ||
      sortBy !== 'best-match' ||
      feedMode !== 'all'
    );
  }, [searchInput, selectedTrade, selectedHub, hostelFilter, sortBy, feedMode]);

  const resetFilters = () => {
    setSearchInput('');
    setSelectedTrade('all');
    setSelectedHub('all');
    setHostelFilter(false);
    setSortBy('best-match');
    setFeedMode('all');
  };

  const toggleSave = (jobId: string) => {
    setSavedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleApply = (job: JobListing) => {
    if (!props.activeWorker) {
      props.onStartLogin();
      return;
    }
    props.onApplyJob(job.id);
    props.onAddNotification({
      title: '✅ Application Submitted',
      body: `You applied for ${job.title} at ${job.company}. The employer will contact you shortly.`,
      type: 'success',
      targetRole: 'worker',
    });
  };

  const filteredJobs = useMemo(() => {
    let jobs = allJobs;

    // Search
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.trade.toLowerCase().includes(q)
      );
    }

    // Trade filter
    if (selectedTrade !== 'all') {
      jobs = jobs.filter((j) => j.trade === selectedTrade);
    }

    // Hub filter
    if (selectedHub !== 'all') {
      jobs = jobs.filter((j) => j.hub === selectedHub);
    }

    // Hostel filter
    if (hostelFilter) {
      jobs = jobs.filter((j) => j.hostelProvided);
    }

    // Feed mode
    const matchesFeedMode =
      feedMode === 'all' ||
      feedMode === 'saved' ||
      (feedMode === 'no-cert' && (j.noCertificateRequired || j.category !== 'skilled')) ||
      (feedMode === 'iti' && j.category === 'skilled');

    jobs = jobs.filter((j) => {
      if (feedMode === 'all') return true;
      if (feedMode === 'saved') return savedJobIds.includes(j.id);
      if (feedMode === 'no-cert') return j.noCertificateRequired || j.category !== 'skilled';
      if (feedMode === 'iti') return j.category === 'skilled';
      return true;
    });

    // Sort
    if (sortBy === 'highest-pay') {
      jobs = [...jobs].sort((a, b) => b.salaryMax - a.salaryMax);
    }

    return jobs;
  }, [allJobs, searchInput, selectedTrade, selectedHub, hostelFilter, sortBy, feedMode, savedJobIds]);

  const trades = useMemo(() => ['all', ...Array.from(new Set(allJobs.map((j) => j.trade)))], [allJobs]);
  const hubs = useMemo(() => ['all', ...Array.from(new Set(allJobs.map((j) => j.hub)))], [allJobs]);

  const feedButtons = [
    { key: 'all', label: 'All Jobs' },
    { key: 'saved', label: 'Saved' },
    { key: 'no-cert', label: 'No Certificate' },
    { key: 'iti', label: 'ITI Skilled' },
    { key: 'drives', label: 'ITI Drives' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Welcome */}
      {!props.activeWorker && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="text-base font-extrabold text-amber-900">{t.landingTitle}</h2>
          <p className="text-sm text-amber-700 mt-1">{t.workerDesc}</p>
          <button
            onClick={() => props.onStartLogin()}
            className="mt-3 btn-amber"
          >
            {t.login}
          </button>
        </div>
      )}

      {/* Feed mode toggle */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {feedButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFeedMode(btn.key)}
            aria-pressed={feedMode === btn.key}
            className={
              'whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition ' +
              (feedMode === btn.key
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700')
            }
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      {feedMode !== 'drives' && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              onClick={() => setShowFilterBar((s) => !s)}
              aria-expanded={showFilterBar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t.moreFilters}
              {showFilterBar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showFilterBar && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t.filterTrade}</label>
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {trades.map((t) => (
                      <option key={t} value={t}>
                        {t === 'all' ? t.filterAll : t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t.filterHub}</label>
                  <select
                    value={selectedHub}
                    onChange={(e) => setSelectedHub(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {hubs.map((t) => (
                      <option key={t} value={t}>
                        {t === 'all' ? t.filterAll : t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hostelFilter}
                    onChange={(e) => setHostelFilter(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                  />
                  {t.hostelFilterLabel}
                </label>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.sortByLabel}</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { key: 'best-match', label: t.bestMatch },
                    { key: 'highest-pay', label: t.highestPay },
                    { key: 'nearest', label: t.nearest },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSortBy(s.key as any)}
                      className={
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition ' +
                        (sortBy === s.key
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                <RotateCcw className="w-3 h-3" />
                {t.resetFilters}
              </button>
            </div>
          )}

          {/* Results count */}
          <p className="text-xs text-slate-500">
            {filteredJobs.length} {filteredJobs.length === 1 ? t.jobFound : t.jobsFound}
          </p>

          {/* Job Cards */}
          {filteredJobs.length === 0 ? (
            <div className="empty-state">
              <Search className="empty-state-icon" />
              <h4 className="empty-state-title">{t.emptyStateNoJobs}</h4>
              <p className="empty-state-desc">{t.emptyStateNoJobsDesc}</p>
              <button onClick={resetFilters} className="btn-amber mt-2">
                {t.resetFilters}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.includes(job.id)}
                  isApplied={!!props.existingApplications[job.id]}
                  onToggleSave={() => toggleSave(job.id)}
                  onApply={() => handleApply(job)}
                  onShowSalary={() => setShowSalaryModal(job.id)}
                  onShowRelocate={() => setShowRelocateModal(job.id)}
                  onShowPhone={() => setShowPhoneModal(job.id)}
                  onShowQuiz={() => setShowQuizModal(job.id)}
                  onShowNcvt={() => setShowNcvtModal(job.id)}
                  language={props.language}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ITI Drives Section */}
      {feedMode === 'drives' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">{t.drivesTitle}</h3>
              <p className="text-xs text-slate-500">{t.drivesSubtitle}</p>
            </div>
          </div>

          {ITI_DRIVES.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-state-icon" />
              <h4 className="empty-state-title">{t.emptyStateNoDrives}</h4>
              <p className="empty-state-desc">{t.emptyStateNoDrivesDesc}</p>
              <button onClick={() => setFeedMode('all')} className="btn-amber mt-2">
                {t.backToAllJobs}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ITI_DRIVES.map((drive) => (
                <div
                  key={drive.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">{drive.instituteName}</h4>
                      <p className="text-xs text-slate-500">{drive.location}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {drive.trade}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(drive.driveDate).toLocaleDateString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5" />
                      {drive.expectedHires} hires
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!props.activeWorker) {
                        props.onStartLogin();
                        return;
                      }
                      props.onAddNotification({
                        title: '🎓 Drive Registered',
                        body: `You are registered for the drive at ${drive.instituteName}.`,
                        type: 'success',
                        targetRole: 'worker',
                      });
                    }}
                    className="mt-3 w-full btn-amber justify-center"
                  >
                    {t.reserveGatePass}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="salary-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSalaryModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="salary-modal-title" className="text-base font-extrabold text-slate-950">{t.salaryBreakdown}</h3>
              <button
                onClick={() => setShowSalaryModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Salary</span>
                <span className="font-bold">₹18,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">HRA</span>
                <span className="font-bold">₹2,500</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Conveyance</span>
                <span className="font-bold">₹1,200</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">PF (Employee)</span>
                <span className="font-bold text-red-600">-₹2,160</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ESI</span>
                <span className="font-bold text-red-600">-₹315</span>
              </div>
              <div className="flex justify-between py-2 bg-green-50 rounded-lg px-3">
                <span className="font-extrabold text-green-800">Take Home</span>
                <span className="font-extrabold text-green-800">₹19,225</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relocation Modal */}
      {showRelocateModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="relocate-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRelocateModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="relocate-modal-title" className="text-base font-extrabold text-slate-950">{t.relocationDetails}</h3>
              <button
                onClick={() => setShowRelocateModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-bold text-amber-800">Free Bus Service</p>
                <p className="text-xs text-amber-700">Company provides free pickup/drop within 15km radius</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-bold text-green-800">Hostel Available</p>
                <p className="text-xs text-green-700">₹1,500/month deducted from salary. Includes meals.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-bold text-blue-800">Relocation Bonus</p>
                <p className="text-xs text-blue-700">₹5,000 one-time bonus for outstation candidates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Modal */}
      {showPhoneModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPhoneModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="phone-modal-title" className="text-base font-extrabold text-slate-950">{t.directHrContact}</h3>
              <button
                onClick={() => setShowPhoneModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">+91 98765 43210</p>
                  <p className="text-xs text-slate-500">{t.officialFactoryContact}</p>
                </div>
              </div>
              <a
                href="tel:+919876543210"
                className="w-full btn-blue justify-center"
              >
                <Phone className="w-4 h-4" />
                {t.callNow}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQuizModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="quiz-modal-title" className="text-base font-extrabold text-slate-950">Skill Assessment</h3>
              <button
                onClick={() => setShowQuizModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">Answer 3 quick questions to improve your match score.</p>
            <div className="space-y-3">
              {[
                { q: 'How many years of experience do you have?', options: ['0-1', '1-3', '3-5', '5+'] },
                { q: 'Are you comfortable with night shifts?', options: ['Yes', 'No', 'Sometimes'] },
                { q: 'Do you have your own transportation?', options: ['Yes', 'No'] },
              ].map((item, idx) => (
                <div key={idx}>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{item.q}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.options.map((opt) => (
                      <button
                        key={opt}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-800 transition"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setShowQuizModal(null);
                  props.onAddNotification({
                    title: '✅ Assessment Complete',
                    body: 'Your profile has been updated with new skills.',
                    type: 'success',
                    targetRole: 'worker',
                  });
                }}
                className="w-full btn-amber justify-center"
              >
                Submit Answers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NCVT Modal */}
      {showNcvtModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ncvt-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNcvtModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="ncvt-modal-title" className="text-base font-extrabold text-slate-950">{t.ncvtCheckTitle}</h3>
              <button
                onClick={() => setShowNcvtModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">{t.ncvtNumber}</label>
                <input
                  placeholder="e.g. NCVT-2024-123456"
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                onClick={() => {
                  setShowNcvtModal(null);
                  props.onAddNotification({
                    title: '✅ NCVT Verified',
                    body: 'Your certificate has been verified successfully.',
                    type: 'success',
                    targetRole: 'worker',
                  });
                }}
                className="w-full btn-blue justify-center"
              >
                <ShieldCheck className="w-4 h-4" />
                {t.verify}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Job Card ──────────────────────────────────────────────────────────── */

function JobCard({
  job,
  isSaved,
  isApplied,
  onToggleSave,
  onApply,
  onShowSalary,
  onShowRelocate,
  onShowPhone,
  onShowQuiz,
  onShowNcvt,
  language,
}: {
  job: JobListing;
  isSaved: boolean;
  isApplied: boolean;
  onToggleSave: () => void;
  onApply: () => void;
  onShowSalary: () => void;
  onShowRelocate: () => void;
  onShowPhone: () => void;
  onShowQuiz: () => void;
  onShowNcvt: () => void;
  language: Language;
}) {
  const t = TRANSLATIONS[language];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white truncate">{job.title}</h3>
              {job.verified && (
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSave}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
              aria-pressed={isSaved}
              className={
                'p-1.5 rounded-lg transition ' +
                (isSaved ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50')
              }
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              aria-label="Share job"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">₹{job.salaryMin.toLocaleString('en-IN')}</span>
            <span className="text-slate-400">- ₹{job.salaryMax.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            {job.location}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Briefcase className="w-3.5 h-3.5 text-purple-500" />
            {job.experience} yrs
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-green-500" />
            {job.shift}
          </div>
        </div>

        {job.hostelProvided && (
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
            <Building2 className="w-3 h-3" />
            Hostel
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={onShowSalary}
            className="flex-1 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t.salaryBreakdown}
          </button>
          <button
            onClick={onShowRelocate}
            className="flex-1 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t.relocationDetails}
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          {job.category === 'skilled' && (
            <button
              onClick={onShowNcvt}
              className="flex-1 py-2 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
            >
              {t.viewNcvt}
            </button>
          )}
          {job.practicalDemo && (
            <button
              onClick={onShowQuiz}
              className="flex-1 py-2 text-xs font-bold bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
            >
              {t.practicalDemo}
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onShowPhone}
            className="flex-1 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            {t.callEmployer}
          </button>
          <button
            onClick={onApply}
            disabled={isApplied}
            className={
              'flex-1 py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ' +
              (isApplied
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950')
            }
          >
            {isApplied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                {t.applied}
              </>
            ) : (
              <>
                <Briefcase className="w-3.5 h-3.5" />
                {t.applyNow}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
