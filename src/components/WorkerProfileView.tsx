import React, { useState } from 'react';
import {
  CandidateProfile,
  JobApplication,
  OfferLetter,
  TradeType,
  Language,
  WorkerSkillCategory,
  ReadinessBadge,
  PastEmploymentItem,
  RetentionCheckIn,
} from '../types';
import { getVoiceGuideScript, TRANSLATIONS } from '../data/translations';
import { playJobAudio, stopJobAudio } from '../utils/audioNarrator';
import {
  calculateProfileCompleteness,
  searchMachineCatalog,
} from '../modules/domain';
import { revokeSessionsApi } from '../utils/api';
import {
  ShieldCheck,
  Award,
  Wrench,
  Briefcase,
  FileText,
  QrCode,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  MapPin,
  LogOut,
  ArrowRight,
  Video,
  Save,
  Volume2,
  VolumeX,
  Check,
  Package,
  Camera,
  Share2,
  AlertTriangle,
  Clock,
  Smartphone,
} from 'lucide-react';

interface Props {
  worker: CandidateProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  currentLang: Language;
  retentionCheckIns?: RetentionCheckIn[];
  onUpdateWorker: (updated: CandidateProfile) => void;
  onUpdateOfferStatus: (
    offerId: string,
    status: OfferLetter['status'],
    declineReason?: string,
    workerConfirmedJoining?: boolean
  ) => void;
  onUpdateApplication?: (
    appId: string,
    updates: Partial<JobApplication>
  ) => void;
  onSubmitCheckIn?: (checkIn: RetentionCheckIn) => void;
  onInspectCertificate: (candidate: CandidateProfile) => void;
  onOpenVideoDemo: (candidate: CandidateProfile) => void;
  onBrowseJobs: () => void;
  onLogout: () => void;
  onOpenDpdpModal?: () => void;
}

const TRADES: TradeType[] = [
  'Packing & Box Loading (No Certificate)',
  'Factory Floor Helper (No Certificate)',
  'Warehouse Loader / Packer',
  'Assembly Line Helper',
  'Machine Helper (Semi-Skilled)',
  'Press Machine Operator',
  'CNC / VMC Operator',
  'Fitter (Assembly & Bench)',
  'Welder (MIG / TIG / ARC)',
  'Machinist (Lathe / Milling)',
  'Industrial Electrician',
  'Wireman',
  'Diesel Mechanic',
  'Quality Inspector',
];

const ALL_READINESS_BADGES: ReadinessBadge[] = [
  'Mobile OTP Verified',
  'Immediate Joiner',
  '12-Hr Shift Stamina',
  'Heavy Packing & Loading Ready',
  'Hostel / Outstation Ready',
  'Night Shift Ready',
];

const DECLINE_REASONS = [
  'Accepted higher in-hand salary elsewhere',
  'Hostel / accommodation not suitable',
  'Shift timing (12-hr / night) issue',
  'Distance from home state too far',
  'Family emergency / personal reason',
];

export const WorkerProfileView: React.FC<Props> = ({
  worker,
  applications,
  offers,
  currentLang,
  retentionCheckIns = [],
  onUpdateWorker,
  onUpdateOfferStatus,
  onUpdateApplication,
  onSubmitCheckIn,
  onInspectCertificate,
  onOpenVideoDemo,
  onBrowseJobs,
  onLogout,
  onOpenDpdpModal,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState<'profile' | 'inbox' | 'idcard'>('profile');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  // Form states synced with worker prop
  const [name, setName] = useState(worker.name);
  const [phone, setPhone] = useState(worker.phone);
  const [trade, setTrade] = useState<TradeType>(worker.trade);
  const [category, setCategory] = useState<WorkerSkillCategory>(worker.category);
  const [readinessBadges, setReadinessBadges] = useState<ReadinessBadge[]>(
    worker.readinessBadges || [
      'Mobile OTP Verified',
      'Immediate Joiner',
      '12-Hr Shift Stamina',
    ]
  );
  const [currentCity, setCurrentCity] = useState(worker.currentCity);
  const [homeState, setHomeState] = useState(worker.homeState);
  const [experienceYears, setExperienceYears] = useState(worker.experienceYears);
  const [expectedSalary, setExpectedSalary] = useState(worker.expectedSalary);
  const [expectedPayMin, setExpectedPayMin] = useState(
    worker.expectedPayMin || Math.max(12000, worker.expectedSalary - 1500)
  );
  const [expectedPayMax, setExpectedPayMax] = useState(
    worker.expectedPayMax || worker.expectedSalary + 2500
  );
  const [willingToRelocate, setWillingToRelocate] = useState(worker.willingToRelocate);
  const [immediateJoiner, setImmediateJoiner] = useState(worker.immediateJoiner);
  const [isFirstTimeEpfoMember, setIsFirstTimeEpfoMember] = useState(
    Boolean(worker.isFirstTimeEpfoMember)
  );
  const [isPubliclyShareable, setIsPubliclyShareable] = useState(
    worker.isPubliclyShareable !== false
  );
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(
    worker.languagesSpoken || ['Hindi', 'English']
  );
  const [about, setAbout] = useState(worker.about);
  const [videoDemoTitle, setVideoDemoTitle] = useState(worker.videoDemoTitle);
  const [hasVideoDemo, setHasVideoDemo] = useState(worker.hasVideoDemo);

  // M4 Controlled Machine Catalogue Typeahead with Hindi Synonyms
  const [machines, setMachines] = useState<string[]>(worker.machinesOperated);
  const [newMachineInput, setNewMachineInput] = useState('');

  // M4 Past Employers (up to 3)
  const [pastEmployments, setPastEmployments] = useState<PastEmploymentItem[]>(
    worker.pastEmployments || []
  );
  const [newEmpCompany, setNewEmpCompany] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpDuration, setNewEmpDuration] = useState('14');

  // Progressive disclosure for NCVT Credentials (M9: DigiLocker or Manual Upload, Zero Aadhaar)
  const [isNcvtVerified, setIsNcvtVerified] = useState(worker.ncvtCertificate.isVerified);
  const [showNcvtEditor, setShowNcvtEditor] = useState(
    worker.ncvtCertificate.isVerified || worker.category === 'skilled'
  );
  const [certNo, setCertNo] = useState(worker.ncvtCertificate.certificateNumber);
  const [rollNo, setRollNo] = useState(worker.ncvtCertificate.rollNumber);
  const [itiCollege, setItiCollege] = useState(worker.ncvtCertificate.itiCollege);
  const [stateDirectorate, setStateDirectorate] = useState(
    worker.ncvtCertificate.stateDirectorate
  );
  const [passingYear, setPassingYear] = useState(worker.ncvtCertificate.passingYear);
  const [grade, setGrade] = useState<'A+' | 'A' | 'B'>(worker.ncvtCertificate.grade);
  const [practicalScore, setPracticalScore] = useState(
    worker.ncvtCertificate.practicalScore
  );
  const [theoryScore, setTheoryScore] = useState(worker.ncvtCertificate.theoryScore);

  // M6 Decline Offer Reason Picklist & M15 Retention Check-in
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<Record<string, string>>({});
  const [checkInMilestone, setCheckInMilestone] = useState<'Day1' | 'Day7' | 'Day30' | 'Day90'>('Day30');
  const [checkInPayMatch, setCheckInPayMatch] = useState(true);
  const [checkInShiftMatch, setCheckInShiftMatch] = useState(true);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInToast, setCheckInToast] = useState(false);

  const [saveToast, setSaveToast] = useState(false);
  const [sessionRevokedToast, setSessionRevokedToast] = useState(false);

  const workerOffers = offers.filter((o) => o.candidateId === worker.id);
  const workerApps = applications.filter((a) => a.candidateId === worker.id);
  const pendingOffersCount = workerOffers.filter((o) => o.status === 'Issued').length;

  // M4 Profile Completeness Meter with Single Next Best Action
  const completeness = calculateProfileCompleteness({
    ...worker,
    name,
    trade,
    machinesOperated: machines,
    expectedPayMin,
    expectedPayMax,
    hasVideoDemo,
    pastEmployments,
    ncvtCertificate: {
      ...worker.ncvtCertificate,
      isVerified: isNcvtVerified,
      rollNumber: rollNo,
    },
  });

  const machineSuggestions = searchMachineCatalog(newMachineInput);

  const handleToggleVoiceGuide = () => {
    if (isVoicePlaying) {
      stopJobAudio();
      setIsVoicePlaying(false);
    } else {
      const script = getVoiceGuideScript('worker-profile', currentLang);
      setIsVoicePlaying(true);
      playJobAudio(
        'worker-profile-guide',
        script,
        currentLang,
        () => setIsVoicePlaying(true),
        () => setIsVoicePlaying(false),
        () => setIsVoicePlaying(false)
      );
    }
  };

  const handleToggleBadge = (badge: ReadinessBadge) => {
    if (readinessBadges.includes(badge)) {
      setReadinessBadges(readinessBadges.filter((b) => b !== badge));
    } else {
      setReadinessBadges([...readinessBadges, badge]);
    }
  };

  const handleAddMachine = (label?: string) => {
    const trimmed = (label ?? newMachineInput).trim();
    if (trimmed && !machines.includes(trimmed)) {
      setMachines([...machines, trimmed]);
      setNewMachineInput('');
    }
  };

  const handleRemoveMachine = (m: string) => {
    setMachines(machines.filter((item) => item !== m));
  };

  const handleAddPastEmployer = () => {
    if (!newEmpCompany.trim() || pastEmployments.length >= 3) return;
    setPastEmployments([
      ...pastEmployments,
      {
        companyName: newEmpCompany.trim(),
        role: newEmpRole.trim() || trade,
        durationMonths: Number(newEmpDuration) || 12,
      },
    ]);
    setNewEmpCompany('');
    setNewEmpRole('');
  };

  // M11 Real Phone Camera 30-Second Skill Video Upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHasVideoDemo(true);
    setVideoDemoTitle(
      `30s Shop-Floor Demo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB · Pending Review)`
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const initials =
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || worker.avatarSeed;

    const updated: CandidateProfile = {
      ...worker,
      name,
      phone,
      avatarSeed: initials,
      trade,
      category,
      readinessBadges,
      currentCity,
      homeState,
      experienceYears: Number(experienceYears),
      expectedSalary: Number(expectedSalary),
      expectedPayMin: Number(expectedPayMin),
      expectedPayMax: Number(expectedPayMax),
      willingToRelocate,
      immediateJoiner,
      isFirstTimeEpfoMember,
      isPubliclyShareable,
      languagesSpoken,
      pastEmployments,
      about,
      hasVideoDemo,
      videoDemoTitle,
      machinesOperated: machines,
      ncvtCertificate: {
        ...worker.ncvtCertificate,
        isVerified: isNcvtVerified,
        certificateNumber: certNo,
        rollNumber: rollNo,
        tradeName: isNcvtVerified
          ? `${trade} (Engineering Trade)`
          : 'No Certificate Required (Direct Work-Readiness Verified)',
        itiCollege: itiCollege || 'Direct Shop-Floor Hand (Mobile OTP Verified)',
        stateDirectorate,
        passingYear: Number(passingYear),
        grade,
        practicalScore: Number(practicalScore),
        theoryScore: Number(theoryScore),
      },
    };

    onUpdateWorker(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // M4 Shareable Worker Trade Card (Never Exposes Phone Number)
  const maskedPhone = `+91 ${worker.phone.replace(/\D/g, '').slice(-10, -8)}•••••${worker.phone.replace(/\D/g, '').slice(-3)}`;

  const handleDownloadTradeCard = () => {
    const content = [
      '======================================================',
      '   HELLO JOBS — SHAREABLE WORKER TRADE CARD           ',
      '   (Note: Skill Profile Only — Not a Government ID)   ',
      '======================================================',
      `Worker Name         : ${worker.name}`,
      `Share Token         : ${worker.shareToken || worker.id}`,
      `Primary Trade       : ${worker.trade}`,
      `Skill Category      : ${worker.category.toUpperCase()}`,
      `Phone Privacy       : ${maskedPhone} (Protected)`,
      `Location & Origin   : ${worker.currentCity} (${worker.homeState})`,
      `Floor Experience    : ${worker.experienceYears} Years`,
      `Expected In-Hand Pay: ₹${expectedPayMin.toLocaleString('en-IN')} – ₹${expectedPayMax.toLocaleString('en-IN')}/mo`,
      '------------------------------------------------------',
      'CREDENTIAL & SKILL VERIFICATION:',
      `Status              : ${
        worker.ncvtCertificate.isVerified
          ? 'VERIFIED ON NCVT / SKILL INDIA'
          : 'WORK-READINESS & MOBILE OTP VERIFIED'
      }`,
      `Readiness Badges    : ${(worker.readinessBadges || ['Mobile OTP Verified']).join(', ')}`,
      `Machines / Tasks    : ${worker.machinesOperated.join(', ')}`,
      '======================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HelloJobs_TradeCard_${worker.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareTradeCardWhatsApp = () => {
    const text = encodeURIComponent(
      `Namaste, view my verified Hello Jobs Worker Trade Card (${worker.trade}, ${worker.experienceYears} yrs exp, ${worker.currentCity}). Token: ${worker.shareToken || worker.id}. Phone number is protected until direct invite.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleLogOutEverywhere = async () => {
    await revokeSessionsApi({ all: true });
    setSessionRevokedToast(true);
    setTimeout(() => {
      setSessionRevokedToast(false);
      onLogout();
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Top Worker Identity Header Card + M4 Profile Completeness Meter */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
              {worker.avatarSeed}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  {worker.name}
                </h1>
                {worker.ncvtCertificate.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    NCVT Grade {worker.ncvtCertificate.grade} Certified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Work-Readiness Verified
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  6-Digit OTP Verified
                </span>
              </div>

              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                <span className="font-bold text-amber-400">{worker.trade}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {worker.currentCity}, {worker.homeState}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-emerald-300 font-semibold">
                  Public Card Phone Masked ({maskedPhone})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={handleToggleVoiceGuide}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors ${
                isVoicePlaying
                  ? 'bg-amber-400 text-slate-950 border-amber-500'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isVoicePlaying ? (
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

              {onOpenDpdpModal && (
              <button
                type="button"
                onClick={onOpenDpdpModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Privacy & Account Settings</span>
              </button>
            )}

            <button
              onClick={onBrowseJobs}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
            >
              <span>Browse Jobs Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleLogOutEverywhere}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-300 hover:text-white bg-red-950/50 hover:bg-red-900 border border-red-700/50 rounded-xl transition-colors"
              title="Sign out from all active devices"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Profile Completeness Meter */}
        <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider">
                Profile Completeness
              </span>
              <span className="font-extrabold text-white tabular-nums">
                {completeness.percentage}% Complete
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-slate-300 sm:max-w-sm">
            <span className="text-slate-400 block text-[11px]">Recommended Next Step:</span>
            <strong className="text-emerald-300">{completeness.nextBestAction}</strong>
          </div>
        </div>

        {sessionRevokedToast && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 font-bold">
            Signed out successfully.
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-500" />
          <span>Edit My Information & Skills</span>
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'inbox'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-500" />
          <span>
            My Applications ({workerApps.length}) & Job Offers ({workerOffers.length})
          </span>
          {pendingOffersCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded tabular-nums">
              {pendingOffersCount} NEW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('idcard')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'idcard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4 text-blue-500" />
          <span>Shareable Trade Card</span>
        </button>
      </div>

      {/* TAB 1: EDITABLE PROFILE, CONTROLLED MACHINE CATALOGUE & CAMERA VIDEO */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {saveToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Shareable Worker Trade Card updated and synced with the Employer Talent Hunter Directory!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* 1-Tap Work-Readiness Badges */}
              <div className="p-6 bg-emerald-50/50 border-2 border-emerald-300 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Zero Certificates Required · Show Your Reliability
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      1-Tap Work-Readiness & Stamina Badges
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                    {readinessBadges.length} Active Badges
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALL_READINESS_BADGES.map((badge) => {
                    const isSelected = readinessBadges.includes(badge);
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => handleToggleBadge(badge)}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-white border-emerald-600 text-slate-900 shadow-xs'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs font-bold">{badge}</span>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Details + Pay Range (M4) + First-Time EPFO (M13) */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Worker Identity, Expected In-Hand Pay Range & Languages
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name (आपका नाम)
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Verified Mobile Number (Masked on Public Card)
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs tabular-nums border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Work Role / Trade
                    </label>
                    <select
                      value={trade}
                      onChange={(e) => setTrade(e.target.value as TradeType)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    >
                      {TRADES.map((tItem) => (
                        <option key={tItem} value={tItem}>
                          {tItem}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Skill Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as WorkerSkillCategory)
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    >
                      <option value="unskilled">
                        Unskilled / Helper & Packing (No Certificate Needed)
                      </option>
                      <option value="semi-skilled">
                        Semi-Skilled (Assembly / Machine Helper)
                      </option>
                      <option value="skilled">
                        Skilled (Certified ITI / Machine Operator)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current City
                    </label>
                    <input
                      type="text"
                      value={currentCity}
                      onChange={(e) => setCurrentCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      step={0.5}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs tabular-nums border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min In-Hand (₹)
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={500}
                      value={expectedPayMin}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setExpectedPayMin(v);
                        setExpectedSalary(v);
                      }}
                      className="w-full px-3 py-2 text-xs tabular-nums font-bold text-emerald-700 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target In-Hand (₹)
                    </label>
                    <input
                      type="number"
                      min={12000}
                      step={500}
                      value={expectedPayMax}
                      onChange={(e) => setExpectedPayMax(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs tabular-nums font-bold text-emerald-700 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isFirstTimeEpfoMember}
                      onChange={(e) => setIsFirstTimeEpfoMember(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>
                      First-time EPFO / PF member (Eligible for PMVBRY Government Incentive)
                    </span>
                  </label>
                </div>
              </div>

              {/* Machine Catalogue & Skill Video */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Machines & Shop-Floor Tools Operated
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select the machines or tools you operate so employers can match you with suitable openings.
                    </p>
                  </div>
                  {hasVideoDemo && (
                    <button
                      type="button"
                      onClick={() => onOpenVideoDemo(worker)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg"
                    >
                      <Video className="w-3.5 h-3.5 text-amber-600" />
                      <span>Preview 30s Skill Video</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {machines.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMachine(m)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search machine in English or Hindi (e.g. Fanuc, खराद, वेल्डिंग, पैकिंग)..."
                      value={newMachineInput}
                      onChange={(e) => setNewMachineInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMachine()}
                      className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Controlled Catalogue Quick Picks */}
                  <div className="flex flex-wrap gap-1.5">
                    {machineSuggestions.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddMachine(item.label)}
                        className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-medium text-amber-950"
                      >
                        + {item.label} ({item.hindiSynonyms[0]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* M11 Phone Camera 30-Second Skill Video Upload */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-600" />
                      Record or Upload 30-Second Practical Skill Video
                    </span>
                    <p className="text-[11px] text-slate-600">
                      {videoDemoTitle || 'Record yourself operating a lathe, CNC panel, welding torch, or packing line (Max 30s).'}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer shrink-0">
                    <Camera className="w-4 h-4" />
                    <span>Open Camera / Upload Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* M4 Past Employers (Up to 3) */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Past Factory Experience (Up to 3 Employers — Optional)
                </h3>
                {pastEmployments.length > 0 && (
                  <div className="space-y-2">
                    {pastEmployments.map((emp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-900">{emp.companyName}</strong> · {emp.role} ({emp.durationMonths} mos)
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPastEmployments(pastEmployments.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {pastEmployments.length < 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Factory Name"
                      value={newEmpCompany}
                      onChange={(e) => setNewEmpCompany(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg sm:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. CNC Op)"
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAddPastEmployer}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg"
                    >
                      + Add Past Plant
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: NCVT Certificate (DigiLocker / Manual) & Save */}
            <div className="space-y-6">
              {!showNcvtEditor ? (
                <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Zero Aadhaar · Zero Documents Needed
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      No ITI Certificate Needed!
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your profile is verified through your <strong>6-Digit Mobile OTP</strong> and <strong>Work-Readiness Badges</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNcvtEditor(true)}
                    className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                  >
                    + Optional: Connect Skill India / NCVT Certificate
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-amber-50/40 border-2 border-amber-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        NCVT / Skill India Certificate
                      </h3>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNcvtVerified}
                        onChange={(e) => setIsNcvtVerified(e.target.checked)}
                        className="rounded border-amber-300 text-emerald-600"
                      />
                      <span>Verified</span>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        DGT Certificate Number
                      </label>
                      <input
                        type="text"
                        value={certNo}
                        onChange={(e) => setCertNo(e.target.value)}
                        className="w-full px-3 py-1.5 tabular-nums border border-amber-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        NCVT MIS Roll Number
                      </label>
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        className="w-full px-3 py-1.5 tabular-nums font-bold border border-amber-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        ITI Institute Name
                      </label>
                      <input
                        type="text"
                        value={itiCollege}
                        onChange={(e) => setItiCollege(e.target.value)}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save My Worker Trade Card</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: M6 10-STAGE PIPELINE, LOCKED PAY PROMISE OFFERS & M15 RETENTION CHECK-INS */}
      {activeTab === 'inbox' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Digital Offer Letters with Locked Pay Promise & Dual Joining Confirmation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Digital Offer Letters ({workerOffers.length})</span>
                </h3>
                <span className="text-xs text-emerald-700 font-semibold">
                  ₹0 Worker Fee Guarantee
                </span>
              </div>

              {workerOffers.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">No Offer Letters Yet</div>
                </div>
              ) : (
                workerOffers.map((offer) => {
                  const hasPayMismatch =
                    Boolean(offer.payPromiseWarning) ||
                    (typeof offer.jobPostedInHand === 'number' &&
                      offer.monthlyInHand < offer.jobPostedInHand);

                  return (
                    <div
                      key={offer.id}
                      className={`p-5 bg-white border-2 rounded-2xl shadow-xs space-y-4 ${
                        hasPayMismatch ? 'border-red-400' : 'border-emerald-200'
                      }`}
                    >
                      {/* M6 Locked Pay Promise Warning Banner */}
                      {hasPayMismatch && (
                        <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2 text-xs text-red-800 font-bold">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>
                            {offer.payPromiseWarning ||
                              `Locked Pay Promise Alert: Offer in-hand pay (₹${offer.monthlyInHand.toLocaleString('en-IN')}) is lower than advertised job card pay (₹${(offer.jobPostedInHand || 0).toLocaleString('en-IN')}).`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block">
                            Direct Factory Payroll Offer · Issued {offer.issuedDate}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5">
                            {offer.companyName}
                          </h4>
                          <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                            <span>{offer.plantLocation}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums text-slate-500">GSTIN: {offer.gstin}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            offer.status === 'Accepted' || offer.status === 'Joined Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : offer.status === 'Declined'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs tabular-nums">
                        <div>
                          <span className="text-slate-500 block">Locked In-Hand</span>
                          <span className="text-sm font-extrabold text-emerald-700">
                            ₹{offer.monthlyInHand.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Gross CTC</span>
                          <span className="text-sm font-bold text-slate-800">
                            ₹{offer.monthlyGross.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Overtime Rate</span>
                          <span className="text-sm font-bold text-slate-900">
                            ₹{offer.overtimeHourlyRate}/hr
                          </span>
                        </div>
                      </div>

                      {/* Accept / Decline with Reason Picklist / Dual Joining Confirmation */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        {offer.status === 'Issued' && (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Offer</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateOfferStatus(offer.id, 'Accepted')}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept Direct Offer</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={selectedDeclineReason[offer.id] || DECLINE_REASONS[0]}
                                onChange={(e) =>
                                  setSelectedDeclineReason((prev) => ({
                                    ...prev,
                                    [offer.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                              >
                                {DECLINE_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateOfferStatus(
                                    offer.id,
                                    'Declined',
                                    selectedDeclineReason[offer.id] || DECLINE_REASONS[0]
                                  )
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Decline with Reason</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {offer.status === 'Accepted' && !offer.workerConfirmedJoining && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-emerald-900">
                              Joining Confirmation: Have you reported to the plant gate?
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOfferStatus(
                                  offer.id,
                                  'Joined Confirmed',
                                  undefined,
                                  true
                                )
                              }
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              ✓ Confirm I Joined on Shop Floor
                            </button>
                          </div>
                        )}

                        {offer.workerConfirmedJoining && (
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {offer.status === 'Joined Confirmed'
                                ? 'Joining confirmed by you and the factory'
                                : 'You confirmed joining. Waiting for the factory to confirm.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: 4-Step Worker Progress Bar + InteractionEvent History Timeline */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>Applied Jobs & Status Timeline ({workerApps.length})</span>
              </h3>

              {workerApps.map((app) => {
                const steps = ['Applied', 'Shortlisted', 'Interview', 'Offer Issued', 'Joined'];
                const currentIdx = Math.max(0, steps.indexOf(app.status === 'Accepted' ? 'Offer Issued' : app.status));

                return (
                  <div
                    key={app.id}
                    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          Applied {app.appliedAt}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {app.jobTitle}
                        </h4>
                        <div className="text-xs text-slate-600">
                          {app.companyName} · {app.industrialHub}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900">
                        {app.status}
                      </span>
                    </div>

                    {/* 4-Step Worker Progress Bar */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {steps.map((st, idx) => (
                        <div key={st} className="text-center space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              idx <= currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                          <span className="text-[10px] font-semibold text-slate-600 block">
                            {st}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Interview Slot Confirmation (M6) */}
                    {app.interviewSlot && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div>
                          <strong className="text-blue-950 block">
                            Interview Slot ({app.interviewSlot.mode}):
                          </strong>
                          <span className="text-slate-700">
                            {app.interviewSlot.proposedTimes?.[0] ||
                              `${app.interviewSlot.date || ''} ${app.interviewSlot.time || ''}`}{' '}
                            · {app.interviewSlot.locationOrLink || app.interviewSlot.venueOrLink}
                          </span>
                        </div>
                        {!app.interviewSlot.confirmedSlot && onUpdateApplication && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateApplication(app.id, {
                                interviewSlot: {
                                  ...app.interviewSlot!,
                                  confirmedSlot:
                                    app.interviewSlot!.proposedTimes?.[0] ||
                                    app.interviewSlot!.time ||
                                    'Confirmed',
                                },
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-bold shrink-0"
                          >
                            Confirm Slot
                          </button>
                        )}
                      </div>
                    )}

                    {/* Timestamped InteractionEvent Timeline */}
                    {app.history && app.history.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          InteractionEvent History
                        </span>
                        {app.history.map((ev) => (
                          <div
                            key={ev.id}
                            className="text-[11px] text-slate-600 flex items-center justify-between"
                          >
                            <span>
                              <strong className="text-slate-800">{ev.toStage}</strong> — {ev.note}
                            </span>
                            <span className="text-slate-400 tabular-nums">{ev.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* M15 Post-Joining Retention Check-In (Day 1 / 7 / 30 / 90) */}
          <div className="p-6 bg-white border-2 border-indigo-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                  Post-Joining Workplace Check-In
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Day 1 / Day 7 / Day 30 / Day 90 Welfare Feedback
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Feeds anonymized factory "Promise Kept" badge ({retentionCheckIns.length} logged)
              </span>
            </div>

            {checkInToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900">
                ✓ Retention check-in recorded! Factory "Promise Kept %" updated.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Milestone</label>
                <select
                  value={checkInMilestone}
                  onChange={(e) => setCheckInMilestone(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="Day1">Day 1 Joining Check</option>
                  <option value="Day7">Day 7 Hostel & Mess Check</option>
                  <option value="Day30">Day 30 First Salary Check</option>
                  <option value="Day90">Day 90 Retention Milestone</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={checkInPayMatch}
                    onChange={(e) => setCheckInPayMatch(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>In-Hand Salary Matches Offer</span>
                </label>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={checkInShiftMatch}
                    onChange={(e) => setCheckInShiftMatch(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>Shift & Hostel Match Promise</span>
                </label>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSubmitCheckIn) {
                      onSubmitCheckIn({
                        id: `chk-${Date.now()}`,
                        workerId: worker.id,
                        workerName: worker.name,
                        companyName: workerOffers[0]?.companyName || 'Bharat Forge & Engineering Ltd.',
                        milestone: checkInMilestone,
                        stillEmployed: true,
                        promisedPayReceived: checkInPayMatch,
                        promisedShiftHonored: checkInShiftMatch,
                        feedbackNote: checkInNote || 'Salary and hostel facility matched offer.',
                        submittedAt: new Date().toLocaleDateString('en-IN'),
                      });
                    }
                    setCheckInToast(true);
                    setTimeout(() => setCheckInToast(false), 3000);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold"
                >
                  Submit Check-In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: M4 SHAREABLE WORKER TRADE CARD (RENAMED FROM GATE-PASS ID) */}
      {activeTab === 'idcard' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">
                Shareable Worker Trade Card Visibility
              </div>
              <p className="text-[11px] text-slate-500">
                Your skill profile card for factory recruitment. Your phone number stays hidden on public links.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isPubliclyShareable}
                onChange={(e) => setIsPubliclyShareable(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Public Share Link Active</span>
            </label>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl border-2 border-amber-400/80 shadow-2xl overflow-hidden">
            <div className="bg-amber-400 text-slate-950 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>HELLO JOBS — SHAREABLE WORKER TRADE CARD</span>
              </div>
              <span className="text-xs font-bold tabular-nums">
                TOKEN: {worker.shareToken || worker.id.toUpperCase()}
              </span>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-amber-400/40 text-amber-400 flex items-center justify-center font-black text-2xl">
                    {worker.avatarSeed}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      {worker.ncvtCertificate.isVerified
                        ? 'NCVT / Skill India Verified Technician'
                        : 'Work-Readiness & Mobile OTP Verified'}
                    </span>
                    <h2 className="text-2xl font-black text-white">{worker.name}</h2>
                    <p className="text-xs text-amber-300 font-semibold">{worker.trade}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block">Experience & Origin</span>
                    <span className="font-bold text-white">
                      {worker.experienceYears} Yrs · {worker.currentCity} ({worker.homeState})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Expected In-Hand Range</span>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      ₹{expectedPayMin.toLocaleString('en-IN')} – ₹{expectedPayMax.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Protected Contact</span>
                    <span className="font-bold text-slate-200 tabular-nums">
                      {maskedPhone} (Hidden on Public Card)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Languages Spoken</span>
                    <span className="font-bold text-white">
                      {languagesSpoken.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {machines.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-200"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white text-slate-900 p-4 rounded-xl text-center space-y-2">
                <QrCode className="w-28 h-28 mx-auto text-slate-900" />
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Scan at Factory HR Desk
                </div>
                <div className="text-[11px] font-extrabold text-emerald-700">
                  Zero Worker Fee Verified
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleShareTradeCardWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Trade Card on WhatsApp (Phone Hidden)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTradeCard}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
            >
              <Download className="w-4 h-4" />
              <span>Download Trade Card (.TXT)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
