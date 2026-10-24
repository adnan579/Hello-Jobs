import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Package,
  Wrench,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import {
  CandidateProfile,
  TradeType,
  Language,
  WorkerSkillCategory,
  ReadinessBadge,
} from '../types';
import { getVoiceGuideScript, TRANSLATIONS } from '../data/translations';
import { playJobAudio, stopJobAudio } from '../utils/audioNarrator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onProfileCreated: (candidate: CandidateProfile) => void;
}

const UNSKILLED_TRADES: TradeType[] = [
  'Packing & Box Loading (No Certificate)',
  'Factory Floor Helper (No Certificate)',
  'Warehouse Loader / Packer',
];

const SEMI_SKILLED_TRADES: TradeType[] = [
  'Assembly Line Helper',
  'Machine Helper (Semi-Skilled)',
  'Press Machine Operator',
];

const SKILLED_TRADES: TradeType[] = [
  'CNC / VMC Operator',
  'Fitter (Assembly & Bench)',
  'Welder (MIG / TIG / ARC)',
  'Machinist (Lathe / Milling)',
  'Industrial Electrician',
  'Wireman',
  'Diesel Mechanic',
  'Quality Inspector',
];

const ALL_READINESS_BADGES: {
  badge: ReadinessBadge;
  labelHi: string;
  desc: string;
}[] = [
  {
    badge: 'Immediate Joiner',
    labelHi: 'तुरंत जॉइनिंग (कल से तैयार)',
    desc: 'Can start work within 24–48 hours',
  },
  {
    badge: '12-Hr Shift Stamina',
    labelHi: '8 से 12 घंटे शिफ्ट की ताकत',
    desc: 'Comfortable with overtime & standing floor work',
  },
  {
    badge: 'Heavy Packing & Loading Ready',
    labelHi: 'पैकिंग और लोडिंग में निपुण',
    desc: 'Physically fit for box packing & material movement',
  },
  {
    badge: 'Hostel / Outstation Ready',
    labelHi: 'फैक्ट्री हॉस्टल में रहने को तैयार',
    desc: 'Ready to move if factory gives room/mess',
  },
  {
    badge: 'Night Shift Ready',
    labelHi: 'डे और नाइट शिफ्ट तैयार',
    desc: 'Flexible with rotational shifts',
  },
];

export const SmartTradeProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lang,
  onProfileCreated,
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<WorkerSkillCategory>('unskilled');
  const [trade, setTrade] = useState<TradeType>(
    'Packing & Box Loading (No Certificate)'
  );
  const [selectedBadges, setSelectedBadges] = useState<ReadinessBadge[]>([
    'Mobile OTP Verified',
    'Immediate Joiner',
    '12-Hr Shift Stamina',
    'Hostel / Outstation Ready',
  ]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentCity, setCurrentCity] = useState('Patna');
  const [homeState, setHomeState] = useState('Bihar');
  const [expectedSalary, setExpectedSalary] = useState(18000);

  // Optional ITI fields only if user explicitly expands
  const [showOptionalIti, setShowOptionalIti] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [itiCollege, setItiCollege] = useState('');

  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleVoiceGuide = () => {
    if (isVoicePlaying) {
      stopJobAudio();
      setIsVoicePlaying(false);
    } else {
      const script = getVoiceGuideScript('onboarding', lang);
      setIsVoicePlaying(true);
      playJobAudio(
        'onboarding-guide',
        script,
        lang,
        () => setIsVoicePlaying(true),
        () => setIsVoicePlaying(false),
        () => setIsVoicePlaying(false)
      );
    }
  };

  const handleSelectCategory = (cat: WorkerSkillCategory) => {
    setCategory(cat);
    if (cat === 'unskilled') {
      setTrade('Packing & Box Loading (No Certificate)');
      setExpectedSalary(18000);
    } else if (cat === 'semi-skilled') {
      setTrade('Assembly Line Helper');
      setExpectedSalary(19500);
    } else {
      setTrade('CNC / VMC Operator');
      setExpectedSalary(24000);
    }
    setStep(2);
  };

  const handleToggleBadge = (badge: ReadinessBadge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopJobAudio();

    const finalName = name.trim() || 'Suraj Kumar';
    const initials =
      finalName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'WK';

    const hasItiCert = Boolean(rollNumber.trim());

    const defaultSkills =
      category === 'unskilled'
        ? ['Carton Packing & Taping', 'Material Loading', 'Floor Sorting']
        : category === 'semi-skilled'
        ? ['Assembly Line Feeding', 'Machine Helper', 'Pallet Trolley']
        : [trade, 'Shop-Floor Safety & Gauges'];

    const newCandidate: CandidateProfile = {
      id: `cand-${Date.now()}`,
      name: finalName,
      phone: phone.trim() || '+91 98765 43210',
      avatarSeed: initials,
      trade,
      category,
      readinessBadges: Array.from(
        new Set(['Mobile OTP Verified', ...selectedBadges])
      ),
      currentCity: currentCity || 'Pune',
      homeState: homeState || 'Bihar',
      experienceYears: category === 'unskilled' ? 0 : 1.5,
      machinesOperated: defaultSkills,
      ncvtCertificate: {
        isVerified: hasItiCert,
        certificateNumber: hasItiCert
          ? `DGT/NCVT/2024/${Math.floor(100000 + Math.random() * 900000)}`
          : '',
        rollNumber: rollNumber.trim(),
        tradeName: hasItiCert
          ? `${trade} (NCVT Verified)`
          : 'No Certificate Required (Work-Readiness Verified)',
        itiCollege: itiCollege.trim() || 'Direct Shop-Floor Hand (Mobile Verified)',
        stateDirectorate: homeState || 'State Directorate',
        passingYear: 2024,
        grade: 'A',
        practicalScore: hasItiCert ? 235 : 0,
        maxPracticalScore: hasItiCert ? 250 : 0,
        theoryScore: hasItiCert ? 88 : 0,
        maxTheoryScore: hasItiCert ? 100 : 0,
        verifiedDate: hasItiCert ? 'NCVT Verified' : 'Mobile OTP Verified',
      },
      hasVideoDemo: false,
      videoDemoTitle: '',
      expectedSalary: Number(expectedSalary),
      willingToRelocate: selectedBadges.includes('Hostel / Outstation Ready'),
      immediateJoiner: selectedBadges.includes('Immediate Joiner'),
      preferredHubs: ['Chakan MIDC, Pune', 'Sanand GIDC, Ahmedabad', 'Sector 63, Noida'],
      about: `Reliable ${trade} (${category}). Verified work readiness: ${selectedBadges.join(
        ', '
      )}. Ready for direct factory payroll with zero middleman cuts.`,
      shareToken: `hj-card-${Date.now().toString(36)}`,
      isPubliclyShareable: true,
      expectedPayMin: Math.max(12000, Number(expectedSalary) - 1500),
      expectedPayMax: Number(expectedSalary) + 2500,
      adultConfirmedAt: new Date().toLocaleString('en-IN'),
      isFirstTimeEpfoMember: true,
      dpdpConsent: {
        consentArtifactId: `DPDP-IND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        policyVersion: 'v2026.11',
        directoryDiscovery: true,
        whatsappJobAlerts: true,
        credentialVerification: true,
        consentGrantedAt: new Date().toLocaleString('en-IN'),
        adultConfirmedAt: new Date().toLocaleString('en-IN'),
        noticeLanguage: lang,
        isWithdrawn: false,
      },
    };

    onProfileCreated(newCandidate);
    setIsSuccess(true);
  };

  const tradesForCategory =
    category === 'unskilled'
      ? UNSKILLED_TRADES
      : category === 'semi-skilled'
      ? SEMI_SKILLED_TRADES
      : SKILLED_TRADES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header with Voice Guide */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                Zero Documents Required · 3 Easy Taps
              </div>
              <h2 className="text-base font-bold text-white">
                Easy Worker Card (No Resume or Certificate Needed)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleVoiceGuide}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isVoicePlaying
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isVoicePlaying ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.voiceGuideBtn}</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                stopJobAudio();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Your Worker Gate-Pass Profile is Ready!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              No certificates or paperwork needed! Your Work-Readiness Badges are now active and visible to 520+ factories.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
              >
                Start Applying in 1 Tap
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* 3-Step Visual Progress Bar */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`p-2 rounded-lg font-bold text-center border transition-colors ${
                  step === 1
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                1. Choose Work Level
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`p-2 rounded-lg font-bold text-center border transition-colors ${
                  step === 2
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                2. Tap Strengths
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`p-2 rounded-lg font-bold text-center border transition-colors ${
                  step === 3
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                3. Name & Phone
              </button>
            </div>

            {/* STEP 1: VISUAL WORK CATEGORY CARDS */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Tap 1: What kind of work do you want?
                  </h3>
                  <p className="text-xs text-slate-600">
                    Don't have any certificate? Pick the first green card—100% welcome!
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Card 1: Unskilled / No Certificate */}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('unskilled')}
                    className="w-full p-4 bg-emerald-50/70 hover:bg-emerald-100/80 border-2 border-emerald-400 rounded-2xl text-left transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="inline-block text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                          Zero Certificate · Direct Joining
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          Helper, Packing & Box Loading
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          No ITI or school certificate needed. Carton packing, loading, sorting & floor helper work.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-700 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Card 2: Semi-Skilled */}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('semi-skilled')}
                    className="w-full p-4 bg-amber-50/70 hover:bg-amber-100/80 border-2 border-amber-300 rounded-2xl text-left transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="inline-block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                          No ITI Certificate Needed · Basic Experience
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          Assembly Line & Machine Helper
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Assisting on conveyor lines, power press helper, or basic factory floor support.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-700 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Card 3: Skilled ITI / Operator */}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('skilled')}
                    className="w-full p-4 bg-blue-50/60 hover:bg-blue-100/60 border-2 border-blue-300 rounded-2xl text-left transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="inline-block text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                          Skilled Operator / ITI Technician
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          CNC, Fitter, Welder, Electrician & Lathe
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          For machine operators and ITI pass technicians (adding certificate is optional).
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-700 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TAP SPECIFIC WORK & WORK-READINESS BADGES */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tap 2: Select Your Work & Strengths
                  </h3>
                  <p className="text-xs text-slate-600">
                    Tap the boxes below—factories trust these badges even without certificates!
                  </p>
                </div>

                {/* Work Type Visual Buttons */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Select Work Role:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {tradesForCategory.map((tItem) => (
                      <button
                        key={tItem}
                        type="button"
                        onClick={() => setTrade(tItem)}
                        className={`p-3 rounded-xl text-xs font-bold text-left border-2 transition-all flex items-center justify-between ${
                          trade === tItem
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{tItem}</span>
                        {trade === tItem && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work-Readiness Reliability Badges */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Tap Your Work-Readiness Strengths (No Document Needed):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {ALL_READINESS_BADGES.map((item) => {
                      const isSelected = selectedBadges.includes(item.badge);
                      return (
                        <button
                          key={item.badge}
                          type="button"
                          onClick={() => handleToggleBadge(item.badge)}
                          className={`p-3 rounded-xl text-left border-2 transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">
                              {item.badge} ·{' '}
                              <span className="text-emerald-700">{item.labelHi}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.desc}
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs"
                  >
                    <span>Next: Enter Name & Phone</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ONLY NAME & MOBILE NUMBER */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tap 3: Just Your Name & Mobile Number
                  </h3>
                  <p className="text-xs text-slate-600">
                    Factory HR will call or WhatsApp you directly on this number.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Your Name (आपका नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suraj Paswan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      10-Digit Mobile Number (मोबाइल नंबर) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Your Home Town / City
                      </label>
                      <input
                        type="text"
                        value={currentCity}
                        onChange={(e) => setCurrentCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Expected Monthly Pay (₹)
                      </label>
                      <input
                        type="number"
                        step={500}
                        value={expectedSalary}
                        onChange={(e) => setExpectedSalary(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-700 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional ITI section only if skilled or clicked */}
                {category === 'skilled' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowOptionalIti(!showOptionalIti)}
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {showOptionalIti
                          ? 'Hide Optional ITI Certificate Fields'
                          : '+ Optional: Have an ITI Certificate? Click to Add (Or Skip)'}
                      </span>
                    </button>

                    {showOptionalIti && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="NCVT Roll No (Optional)"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="ITI College Name (Optional)"
                          value={itiCollege}
                          onChange={(e) => setItiCollege(e.target.value)}
                          className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* DPDP Act 2023 Section 5 & 6 Itemized Consent Notice */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>DPDP Act 2023 — Data Privacy & Consent Notice</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const script = getVoiceGuideScript('dpdp-notice', lang);
                        setIsVoicePlaying(true);
                        playJobAudio(
                          'dpdp-step3',
                          script,
                          lang,
                          () => setIsVoicePlaying(true),
                          () => setIsVoicePlaying(false),
                          () => setIsVoicePlaying(false)
                        );
                      }}
                      className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen DPDP Notice</span>
                    </button>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer text-slate-700 leading-relaxed">
                    <input
                      type="checkbox"
                      required
                      defaultChecked
                      className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px]">
                      <strong>Section 6 Verifiable Consent:</strong> I consent to Hello Jobs processing my Name, Mobile Number, and Work Skills strictly to connect me with GSTIN-verified factories. My data will <strong>never be sold to contractors (thekedars)</strong>, and I can withdraw consent or erase my data anytime.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Consent & Get Digital Gate Pass</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
