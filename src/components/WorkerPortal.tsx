import React, { useState } from 'react';
import {
  JobListing,
  Language,
  CandidateProfile,
  JobApplication,
  OfferLetter,
  HiringDrive,
} from '../types';
import {
  TRANSLATIONS,
  getAudioNarrationScript,
  getVoiceGuideScript,
} from '../data/translations';
import { playJobAudio, stopJobAudio } from '../utils/audioNarrator';
import {
  calculateTransparentMatchScore,
  computeLabourCodeBreakdown,
  estimateClusterDistanceKm,
  SHOP_FLOOR_PRACTICE_QUIZ,
} from '../modules/domain';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Building2,
  MapPin,
  Home,
  Utensils,
  Bus,
  Search,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Sparkles,
  QrCode,
  Send,
  Package,
  Wrench,
  Layers,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Award,
  Navigation,
  Calendar,
} from 'lucide-react';

interface Props {
  jobs: JobListing[];
  currentLang: Language;
  activeWorker?: CandidateProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  hiringDrives?: HiringDrive[];
  onApplyJob: (job: JobListing) => void;
  onOpenWorkerProfile: () => void;
  onOpenAuthModal: () => void;
  onOpenCreateProfile: () => void;
  onOpenReport: (companyName?: string) => void;
  onRegisterDrive?: (driveId: string) => void;
  onToggleSaveJob?: (jobId: string) => void;
}

export const WorkerPortal: React.FC<Props> = ({
  jobs,
  currentLang,
  activeWorker,
  applications,
  offers,
  hiringDrives = [],
  onApplyJob,
  onOpenWorkerProfile,
  onOpenAuthModal,
  onOpenCreateProfile,
  onOpenReport,
  onRegisterDrive,
  onToggleSaveJob,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [feedMode, setFeedMode] = useState<'all' | 'no-cert' | 'iti' | 'saved' | 'drives'>('all');
  const [sortBy, setSortBy] = useState<'best-match' | 'highest-pay' | 'nearest'>('best-match');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [hostelFilter, setHostelFilter] = useState(false);
  const [activeAudioJobId, setActiveAudioJobId] = useState<string | null>(null);
  const [callingJob, setCallingJob] = useState<JobListing | null>(null);
  const [expandedSalaryJobId, setExpandedSalaryJobId] = useState<string | null>(null);
  const [expandedRelocJobId, setExpandedRelocJobId] = useState<string | null>(null);
  const [localSavedIds, setLocalSavedIds] = useState<string[]>(activeWorker?.savedJobIds || ['job-1']);

  // M13 Timed 5-Question Shop-Floor Practice Quiz Modal State
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const savedSet = new Set(activeWorker?.savedJobIds || localSavedIds);

  const toggleSave = (jobId: string) => {
    if (onToggleSaveJob) {
      onToggleSaveJob(jobId);
    }
    setLocalSavedIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const workerOffersCount = activeWorker
    ? offers.filter((o) => o.candidateId === activeWorker.id).length
    : 0;

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

  const allHubs = [
    'all',
    'Chakan MIDC, Pune',
    'Sector 63, Noida',
    'Sanand GIDC, Ahmedabad',
    'Peenya Industrial Area, Bengaluru',
    'Sriperumbudur, Chennai',
    'Adityapur, Jamshedpur',
    'Bhiwadi Industrial Zone, Rajasthan',
  ];

  const noCertJobsCount = jobs.filter(
    (j) => j.isActive !== false && (j.noCertificateRequired || j.category !== 'skilled')
  ).length;

  const itiJobsCount = jobs.filter(
    (j) => j.isActive !== false && j.category === 'skilled'
  ).length;

  const filteredJobs = jobs
    .filter((job) => {
      if (job.isActive === false) return false;

      if (feedMode === 'saved' && !savedSet.has(job.id)) return false;
      const matchesFeedMode =
        feedMode === 'all' ||
        feedMode === 'saved' ||
        feedMode === 'drives' ||
        (feedMode === 'no-cert' &&
          (job.noCertificateRequired || job.category !== 'skilled')) ||
        (feedMode === 'iti' && job.category === 'skilled');

      const matchesTrade = selectedTrade === 'all' || job.trade === selectedTrade;
      const matchesHub = selectedHub === 'all' || job.industrialHub === selectedHub;
      const matchesHostel = !hostelFilter || job.facilities.hasHostel;
      const matchesSearch =
        searchQuery === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.industrialHub.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchesFeedMode &&
        matchesTrade &&
        matchesHub &&
        matchesHostel &&
        matchesSearch
      );
    })
    .sort((a, b) => {
      if (sortBy === 'highest-pay') {
        return b.takeHomeSalary - a.takeHomeSalary;
      }
      if (sortBy === 'nearest') {
        const distA = estimateClusterDistanceKm(
          activeWorker?.currentCity || 'Patna',
          a.industrialHub
        );
        const distB = estimateClusterDistanceKm(
          activeWorker?.currentCity || 'Patna',
          b.industrialHub
        );
        return distA - distB;
      }
      // Default: Best Match %
      if (activeWorker) {
        const scoreA = calculateTransparentMatchScore(activeWorker, a).score;
        const scoreB = calculateTransparentMatchScore(activeWorker, b).score;
        return scoreB - scoreA;
      }
      return b.takeHomeSalary - a.takeHomeSalary;
    });

  const handleToggleAudio = (job: JobListing) => {
    if (activeAudioJobId === job.id) {
      stopJobAudio();
      setActiveAudioJobId(null);
    } else {
      const script = getAudioNarrationScript(job, currentLang);
      setActiveAudioJobId(job.id);
      playJobAudio(
        job.id,
        script,
        currentLang,
        () => setActiveAudioJobId(job.id),
        () => setActiveAudioJobId(null),
        () => setActiveAudioJobId(null)
      );
    }
  };

  const handleTogglePageVoiceGuide = () => {
    if (activeAudioJobId === 'page-voice-guide') {
      stopJobAudio();
      setActiveAudioJobId(null);
    } else {
      const script = getVoiceGuideScript('worker-feed', currentLang);
      setActiveAudioJobId('page-voice-guide');
      playJobAudio(
        'page-voice-guide',
        script,
        currentLang,
        () => setActiveAudioJobId('page-voice-guide'),
        () => setActiveAudioJobId(null),
        () => setActiveAudioJobId(null)
      );
    }
  };

  const handleApplyWhatsApp = (job: JobListing) => {
    onApplyJob(job);
    const certNote = job.noCertificateRequired
      ? 'I am ready for immediate joining (No Certificate Needed).'
      : 'My trade profile is verified.';
    const text = encodeURIComponent(
      `Namaste, I am applying directly for the ${job.trade} position at ${job.companyName} (${job.industrialHub}) via Hello Jobs. ${certNote} Please let me know the walk-in / gate pass details.`
    );
    window.open(`https://wa.me/${job.whatsappApplyNumber}?text=${text}`, '_blank');
  };

  const quizScore = SHOP_FLOOR_PRACTICE_QUIZ.reduce((acc, q) => {
    return acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Top Worker Welcome & Profile Navigation Banner */}
      {activeWorker ? (
        <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
              {activeWorker.avatarSeed}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Logged in as {activeWorker.name} · {activeWorker.trade}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                  {activeWorker.currentCity}, {activeWorker.homeState}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Jobs Feed — Search & Apply for Suitable Factory Jobs
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {(
                  activeWorker.readinessBadges || [
                    'Mobile OTP Verified',
                    'Immediate Joiner',
                  ]
                ).map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-emerald-300 border border-slate-700 rounded-md"
                  >
                    ✓ {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setQuizOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>Skill Quiz</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePageVoiceGuide}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-colors ${
                activeAudioJobId === 'page-voice-guide'
                  ? 'bg-amber-400 text-slate-950 border-amber-500'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {activeAudioJobId === 'page-voice-guide' ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{t.stopAudio}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>{t.voiceGuideBtn}</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenWorkerProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                My Profile & Edit Info ({workerOffersCount} Offers)
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-amber-900 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>100% Free for Workers · Direct Factory Payroll</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Direct Factory Jobs — Helper, Packing & ITI Operators
            </h2>
            <p className="text-xs text-slate-700 max-w-2xl">
              Search verified factory openings with clear monthly in-hand salary, shift hours, and hostel/mess facilities. Log in or register to apply and manage your profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenCreateProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              <Package className="w-4 h-4" />
              <span>Register as Worker</span>
            </button>

            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>Worker Login</span>
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED CATEGORY SWITCHER + SAVED JOBS + WALK-IN DRIVES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFeedMode('all')}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
            feedMode === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold">{t.tabAllJobs}</div>
            <div className="text-[11px] opacity-75 tabular-nums">{jobs.length} Active</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFeedMode('no-cert')}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
            feedMode === 'no-cert'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
              : 'bg-emerald-50/70 text-emerald-950 border-emerald-300 hover:bg-emerald-100/70'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold">No-Cert / Helper</div>
            <div className="text-[11px] opacity-80 tabular-nums">{noCertJobsCount} Jobs</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFeedMode('iti')}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
            feedMode === 'iti'
              ? 'bg-blue-700 text-white border-blue-700 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold">ITI / CNC / Welder</div>
            <div className="text-[11px] opacity-75 tabular-nums">{itiJobsCount} Jobs</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFeedMode('saved')}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
            feedMode === 'saved'
              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold">Saved Jobs</div>
            <div className="text-[11px] opacity-75 tabular-nums">{savedSet.size} Saved</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFeedMode('drives')}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
            feedMode === 'drives'
              ? 'bg-indigo-700 text-white border-indigo-700 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold">ITI Campus Drives</div>
            <div className="text-[11px] opacity-75 tabular-nums">{hiringDrives.length} Drives</div>
          </div>
        </button>
      </div>

      {/* M13 Walk-in & Government ITI Campus Drives View */}
      {feedMode === 'drives' && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                Walk-In Gate Pass & ITI Campus Recruitment Drives
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Upcoming Walk-In & ITI Placement Mela Schedule
              </h3>
            </div>
            <button
              onClick={() => setFeedMode('all')}
              className="text-xs font-bold text-indigo-700 hover:underline self-start"
            >
              ← Back to All Jobs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hiringDrives.map((drive) => {
              const registeredList =
                drive.registeredWorkerIds || drive.registeredCandidateIds || [];
              const isRegistered =
                activeWorker && registeredList.includes(activeWorker.id);
              return (
                <div
                  key={drive.id}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                        {drive.itiInstituteName || 'Direct Plant Walk-In'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {drive.title}
                      </h4>
                      <p className="text-xs text-slate-600">{drive.companyName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs tabular-nums">
                      ₹{(drive.inHandSalary ?? 22000).toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <strong>Date & Venue:</strong> {drive.date} · {drive.venueAddress}
                    </div>
                    <div>
                      <strong>Trades:</strong> {drive.trades.join(', ')} ({drive.seatsAvailable} seats)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRegisterDrive && onRegisterDrive(drive.id)}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-extrabold transition-colors ${
                      isRegistered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    {isRegistered
                      ? '✓ Walk-In Gate Pass Reserved'
                      : 'Reserve Free Walk-In Gate Pass'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter, Search & Sort Bar (M5) */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchWorkerPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
            >
              <option value="best-match">Best Skill & Pay Match</option>
              <option value="highest-pay">Highest In-Hand Pay First</option>
              <option value="nearest">Nearest Industrial Cluster (km)</option>
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
            <span className="font-semibold text-slate-700">{t.filterHub}:</span>
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
            >
              {allHubs.map((hub) => (
                <option key={hub} value={hub}>
                  {hub === 'all' ? t.filterAllHubs : hub}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-medium">Free/Subsidized Hostel Only</span>
            </label>

            <span className="text-slate-400">·</span>
            <span className="tabular-nums font-semibold text-slate-600">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'Job Found' : 'Jobs Found'}
            </span>
          </div>
        </div>
      </div>

      {/* M5 PAY-FIRST JOB FEED CARDS */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const isAudioPlaying = activeAudioJobId === job.id;
          const existingApp = applications.find(
            (a) =>
              a.jobId === job.id &&
              (activeWorker ? a.candidateId === activeWorker.id : false)
          );
          const isSaved = savedSet.has(job.id);
          const distanceKm =
            job.clusterDistanceKm ??
            estimateClusterDistanceKm(
              activeWorker?.currentCity || 'Patna',
              job.industrialHub
            );
          const matchResult = activeWorker
            ? calculateTransparentMatchScore(activeWorker, job)
            : null;
          const labourBreakdown =
            job.labourCodeBreakdown ||
            computeLabourCodeBreakdown(job.takeHomeSalary, job.grossSalary);

          return (
            <div
              key={job.id}
              className={`bg-white border-2 rounded-2xl p-5 sm:p-6 transition-all duration-150 shadow-xs space-y-4 relative ${
                job.noCertificateRequired
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* M5 PAY-FIRST HEADER: Leads with "₹18,500 in hand/mo" FIRST */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums tracking-tight">
                      ₹{job.takeHomeSalary.toLocaleString('en-IN')} in hand/mo
                    </span>
                    <span className="text-xs font-bold text-slate-700 tabular-nums bg-slate-100 px-2.5 py-1 rounded-md">
                      + ₹{job.overtimeHourlyRate}/hr OT ({job.overtimeMultiplierLabel || '2x Statutory'})
                    </span>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1 tabular-nums">
                      <Navigation className="w-3 h-3" />
                      {distanceKm} km from {activeWorker?.currentCity || 'your city'}
                    </span>
                  </div>

                  {/* Role & Shift Title */}
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {job.title} · <span className="text-amber-700">{job.shiftPattern}</span>
                  </h3>

                  {/* Secondary: Company Name, GSTIN, Cluster & Promise Kept % */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.companyName}
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      GSTIN Verified
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.industrialHub} ({job.state})
                    </span>
                    {job.promiseKeptScorePct && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold tabular-nums">
                        Promise Kept: {job.promiseKeptScorePct}%
                      </span>
                    )}
                    <span className="text-slate-400 tabular-nums">
                      Expires {job.expiresAt || 'in 30 days'}
                    </span>
                  </div>
                </div>

                {/* Right: Transparent Match Badge + Save + Audio */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {matchResult && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-right">
                      <div className="text-xs font-extrabold text-amber-950 tabular-nums">
                        {matchResult.score}% Match
                      </div>
                      <div className="text-[10px] font-medium text-amber-800">
                        {matchResult.reasons.slice(0, 3).join(' · ')}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSave(job.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isSaved
                        ? 'bg-amber-400 text-slate-950 border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Save Job"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleAudio(job)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${
                      isAudioPlaying
                        ? 'bg-amber-400 text-slate-950 border-amber-500'
                        : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {isAudioPlaying ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>{t.stopAudio}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-amber-700" />
                        <span>{t.listenAudio}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Facilities & Welfare Perks Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                {job.noCertificateRequired && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    {t.noCertBadge}
                  </span>
                )}
                {job.facilities.hasHostel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                    <Home className="w-3.5 h-3.5 text-amber-600" />
                    {job.roomRentDeduction || t.hostel}
                  </span>
                )}
                {job.facilities.hasSubsidizedMess && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    {job.canteenCostPerMeal || t.mess}
                  </span>
                )}
                {job.facilities.hasBusPickup && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                    {t.bus}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-blue-700 font-bold tabular-nums ml-auto">
                  {job.vacanciesLeft} of {job.openingsCount} seats open
                </span>
              </div>

              {/* Expandable M5 New Labour Code PF/ESIC Breakdown & M14 Relocation Checklist */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSalaryJobId(
                      expandedSalaryJobId === job.id ? null : job.id
                    )
                  }
                  className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900"
                >
                  <span>New Labour Code Salary & PF/ESIC Breakdown</span>
                  {expandedSalaryJobId === job.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {job.relocation && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRelocJobId(
                        expandedRelocJobId === job.id ? null : job.id
                      )
                    }
                    className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900"
                  >
                    <span>Relocation & Hostel Support Details</span>
                    {expandedRelocJobId === job.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {expandedSalaryJobId === job.id && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs tabular-nums">
                  <div>
                    <span className="text-slate-500 block">Basic + DA (≥50%)</span>
                    <span className="font-bold text-slate-900">
                      ₹{labourBreakdown.basicAndDa.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Allowances / HRA</span>
                    <span className="font-bold text-slate-900">
                      ₹{labourBreakdown.allowances.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Employee PF (12%)</span>
                    <span className="font-bold text-slate-700">
                      ₹{labourBreakdown.pfEmployee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ESIC Medical (0.75%)</span>
                    <span className="font-bold text-slate-700">
                      ₹{labourBreakdown.esicEmployee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Guaranteed In-Hand</span>
                    <span className="font-extrabold text-emerald-700">
                      ₹{job.takeHomeSalary.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                </div>
              )}

              {expandedRelocJobId === job.id && job.relocation && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-indigo-950 font-bold block">
                      First-Month Wage Advance
                    </span>
                    <span className="text-slate-700 tabular-nums">
                      {job.relocation.wageAdvanceAvailable
                        ? `Up to ₹${job.relocation.maxAdvanceAmount.toLocaleString('en-IN')} on joining`
                        : 'Standard monthly payout'}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-950 font-bold block">
                      Travel Ticket & Language Support
                    </span>
                    <span className="text-slate-700">
                      {job.relocation.travelTicketReimbursed
                        ? '2nd Class Train/Bus Reimbursed'
                        : 'Self travel'}{' '}
                      · Floor Supervisor speaks{' '}
                      {job.relocation.supervisorLanguages.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-950 font-bold block">
                      Nearest Railhead & Move Checklist
                    </span>
                    <span className="text-slate-700">
                      {job.relocation.nearestRailwayStation} (Bring Bank Passbook & 2 Photos)
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-medium text-slate-700">
                    Qualification: {job.minQualification}
                  </span>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => onOpenReport(job.companyName)}
                    className="text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {t.reportCut}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCallingJob(job)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t.directCall}</span>
                  </button>

                  {existingApp ? (
                    <button
                      onClick={onOpenWorkerProfile}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied ({existingApp.status})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onApplyJob(job)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>1-Tap Direct Apply</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleApplyWhatsApp(job)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.applyWhatsapp}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* M13 5-Question Shop-Floor Trade Practice Quiz Modal */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                  5-Question Trade & Shop-Floor Safety Practice Quiz
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Earn Your Shop-Floor Practice Badge
                </h3>
              </div>
              <button
                onClick={() => setQuizOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {SHOP_FLOOR_PRACTICE_QUIZ.map((q, idx) => (
                <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-900">
                    {idx + 1}. {currentLang === 'hi' ? q.questionHi : q.questionEn}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIndex) => {
                      const chosen = quizAnswers[q.id] === optIndex;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: optIndex }))
                          }
                          className={`p-2 rounded-lg text-left text-xs font-semibold border transition-colors ${
                            chosen
                              ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {quizSubmitted && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center justify-between">
                <span>
                  Score: {quizScore} / {SHOP_FLOOR_PRACTICE_QUIZ.length} Correct — Shop-Floor Safety & Trade Practice Verified!
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuizOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setQuizSubmitted(true)}
                className="px-5 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
              >
                Submit Practice Answers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call HR Direct Dialog */}
      {callingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <PhoneCall className="w-5 h-5 text-emerald-600" />
                Direct HR Phone Contact
              </div>
              <button
                onClick={() => setCallingJob(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="text-xs text-slate-500">Official Factory Contact:</div>
              <div className="text-sm font-bold text-slate-900">{callingJob.hrContactName}</div>
              <div className="text-xs text-slate-600">
                {callingJob.companyName} · {callingJob.industrialHub}
              </div>
              <div className="pt-2">
                <a
                  href={`tel:${callingJob.hrContactPhone}`}
                  className="inline-flex items-center gap-2 text-lg tabular-nums font-bold text-blue-700 hover:underline"
                >
                  <PhoneCall className="w-4 h-4" />
                  {callingJob.hrContactPhone}
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCallingJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded"
              >
                Close
              </button>
              <a
                href={`tel:${callingJob.hrContactPhone}`}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
