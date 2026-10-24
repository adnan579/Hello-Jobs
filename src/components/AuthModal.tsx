import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Factory,
  Smartphone,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Building2,
  Sparkles,
  Copy,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  LogIn,
} from 'lucide-react';
import {
  CandidateProfile,
  EmployerFactoryProfile,
  TradeType,
  AuthSession,
  WorkerSkillCategory,
  OtpChannelType,
} from '../types';
import { sendOtpChallengeApi, verifyOtpChallengeApi } from '../utils/api';

interface Props {
  isOpen: boolean;
  initialTab?: 'worker' | 'employer';
  initialMode?: 'login' | 'register';
  onClose: () => void;
  candidates: CandidateProfile[];
  employerProfile: EmployerFactoryProfile;
  onLoginSuccess: (
    session: AuthSession,
    newCandidate?: CandidateProfile,
    updatedEmployer?: EmployerFactoryProfile
  ) => void;
  onOpenLegalModal?: (tab: 'privacy' | 'terms') => void;
}

const QUICK_WORK_TYPES: {
  trade: TradeType;
  category: WorkerSkillCategory;
  label: string;
}[] = [
  {
    trade: 'Packing & Box Loading (No Certificate)',
    category: 'unskilled',
    label: 'Packing & Box Loading (No Certificate Needed)',
  },
  {
    trade: 'Factory Floor Helper (No Certificate)',
    category: 'unskilled',
    label: 'Factory Floor Helper (No Certificate Needed)',
  },
  {
    trade: 'Assembly Line Helper',
    category: 'semi-skilled',
    label: 'Assembly Line / Machine Helper (Semi-Skilled)',
  },
  {
    trade: 'CNC / VMC Operator',
    category: 'skilled',
    label: 'CNC / VMC Operator (Skilled / ITI)',
  },
  {
    trade: 'Fitter (Assembly & Bench)',
    category: 'skilled',
    label: 'Fitter (Assembly & Bench)',
  },
  {
    trade: 'Welder (MIG / TIG / ARC)',
    category: 'skilled',
    label: 'Welder (MIG / TIG / ARC)',
  },
  {
    trade: 'Industrial Electrician',
    category: 'skilled',
    label: 'Industrial Electrician',
  },
];

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialTab = 'worker',
  initialMode = 'login',
  onClose,
  candidates,
  employerProfile,
  onLoginSuccess,
  onOpenLegalModal,
}) => {
  const [roleTab, setRoleTab] = useState<'worker' | 'employer'>(initialTab);
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // OTP Verification State
  const [phoneInput, setPhoneInput] = useState('9546011234');
  const [otpChannel, setOtpChannel] = useState<OtpChannelType>('WHATSAPP_CLOUD');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('482910');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Registration Terms & Privacy Consent
  const [confirmAdult18Plus, setConfirmAdult18Plus] = useState(true);
  const [acceptTermsAndPrivacy, setAcceptTermsAndPrivacy] = useState(true);
  const [consentDirectoryDiscovery, setConsentDirectoryDiscovery] = useState(true);

  // Worker Registration Fields
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState<TradeType>(
    'Packing & Box Loading (No Certificate)'
  );
  const [newWorkerCity, setNewWorkerCity] = useState('Pune');
  const [newWorkerState, setNewWorkerState] = useState('Maharashtra');
  const [newWorkerExpectedPay, setNewWorkerExpectedPay] = useState(19500);

  // Employer Registration Fields
  const [empHrPhone, setEmpHrPhone] = useState('9823011490');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newGstin, setNewGstin] = useState('27AABCE8821K1Z5');
  const [newUdyam, setNewUdyam] = useState('UDYAM-MH-26-0091204');
  const [newHrName, setNewHrName] = useState('');
  const [newHub, setNewHub] = useState('Chakan MIDC, Pune');

  useEffect(() => {
    if (isOpen) {
      setRoleTab(initialTab);
      setAuthMode(initialMode);
      setOtpSent(false);
      setAuthError('');
    }
  }, [isOpen, initialTab, initialMode]);

  if (!isOpen) return null;

  const activePhone = roleTab === 'worker' ? phoneInput : empHrPhone;

  const handleRequestOtp = async (
    channel: OtpChannelType,
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault();
    setAuthError('');

    const digits = activePhone.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (authMode === 'register') {
      if (roleTab === 'worker' && !newWorkerName.trim()) {
        setAuthError('Please enter your full name to register.');
        return;
      }
      if (roleTab === 'employer' && !newCompanyName.trim()) {
        setAuthError('Please enter your company name to register.');
        return;
      }
      if (!confirmAdult18Plus) {
        setAuthError('Please confirm that you are 18 years of age or older.');
        return;
      }
      if (!acceptTermsAndPrivacy) {
        setAuthError(
          'Please accept the Privacy Policy and Terms & Conditions of Use to create an account.'
        );
        return;
      }
    }

    try {
      setOtpChannel(channel);
      const res = await sendOtpChallengeApi(digits, roleTab, channel);
      setGeneratedOtp(res.demoOtpCode);
      setEnteredOtp(res.demoOtpCode);
      setOtpSent(true);
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to send OTP verification code.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const digits = activePhone.replace(/\D/g, '').slice(-10);

    try {
      const verified = await verifyOtpChallengeApi(
        digits,
        enteredOtp.trim(),
        roleTab
      );
      const nowIso = new Date().toLocaleString('en-IN');

      if (roleTab === 'worker') {
        const existing = candidates.find(
          (c) => c.phone.replace(/\D/g, '').slice(-10) === digits
        );

        if (existing && authMode === 'login') {
          onLoginSuccess({
            role: 'worker',
            workerId: existing.id,
            sessionId: verified.session.sessionId,
          });
          onClose();
          return;
        }

        const matchedType =
          QUICK_WORK_TYPES.find((q) => q.trade === newWorkerTrade) ||
          QUICK_WORK_TYPES[0];
        const nameToUse = newWorkerName.trim() || existing?.name || 'Manoj Paswan';
        const initials =
          nameToUse
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'WK';

        const basePay =
          Number(newWorkerExpectedPay) ||
          (matchedType.category === 'unskilled' ? 18000 : 22500);

        const createdCandidate: CandidateProfile = {
          id: `cand-${Date.now()}`,
          shareToken: `hj-card-${Date.now().toString(36)}`,
          isPubliclyShareable: true,
          name: nameToUse,
          phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
          avatarSeed: initials,
          trade: newWorkerTrade,
          category: matchedType.category,
          readinessBadges: [
            'Mobile OTP Verified',
            '12-Hr Shift Stamina',
            'Immediate Joiner',
            'Hostel / Outstation Ready',
          ],
          currentCity: newWorkerCity || 'Pune',
          homeState: newWorkerState || 'Maharashtra',
          experienceYears: matchedType.category === 'unskilled' ? 1 : 2,
          machinesOperated:
            matchedType.category === 'unskilled'
              ? ['Carton Packing & Taping', 'Pallet Jack / Hand Trolley']
              : [newWorkerTrade, 'Vernier & Micrometer QC'],
          languagesSpoken: ['Hindi', 'English'],
          expectedSalary: basePay,
          expectedPayMin: Math.max(12000, basePay - 1500),
          expectedPayMax: basePay + 2500,
          willingToRelocate: true,
          immediateJoiner: true,
          preferredHubs: [
            'Chakan MIDC, Pune',
            'Sanand GIDC, Ahmedabad',
            'Sector 63, Noida',
          ],
          pastEmployments: [],
          ncvtCertificate: {
            isVerified: false,
            certificateNumber: '',
            rollNumber: '',
            tradeName: 'Work-Readiness Verified',
            itiCollege: 'Direct Shop-Floor Hand',
            stateDirectorate: 'Direct Entry',
            passingYear: 2025,
            grade: 'A',
            practicalScore: 0,
            maxPracticalScore: 0,
            theoryScore: 0,
            maxTheoryScore: 0,
            verifiedDate: 'Verified Today',
            verificationMethod: 'NONE',
          },
          hasVideoDemo: false,
          videoDemoTitle: '',
          about: `Reliable ${newWorkerTrade} professional ready for immediate factory joining.`,
          adultConfirmedAt: nowIso,
          isFirstTimeEpfoMember: true,
          savedJobIds: [],
          dpdpConsent: {
            consentArtifactId: `CONSENT-${Date.now()}`,
            policyVersion: 'v2026.11',
            directoryDiscovery: consentDirectoryDiscovery,
            whatsappJobAlerts: true,
            credentialVerification: true,
            consentGrantedAt: nowIso,
            adultConfirmedAt: nowIso,
            noticeLanguage: 'en',
            isWithdrawn: false,
          },
        };

        onLoginSuccess(
          {
            role: 'worker',
            workerId: createdCandidate.id,
            sessionId: verified.session.sessionId,
          },
          createdCandidate
        );
        onClose();
      } else {
        if (authMode === 'register' && newCompanyName.trim()) {
          const updatedEmp: EmployerFactoryProfile = {
            ...employerProfile,
            companyName: newCompanyName.trim(),
            gstin: newGstin.trim().toUpperCase() || employerProfile.gstin,
            udyamNumber:
              newUdyam.trim().toUpperCase() || employerProfile.udyamNumber,
            hrManagerName: newHrName.trim() || employerProfile.hrManagerName,
            hrPhone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
            industrialHub: newHub.trim() || employerProfile.industrialHub,
          };
          onLoginSuccess(
            {
              role: 'employer',
              employerId: updatedEmp.id,
              sessionId: verified.session.sessionId,
            },
            undefined,
            updatedEmp
          );
          onClose();
          return;
        }

        onLoginSuccess({
          role: 'employer',
          employerId: employerProfile.id,
          sessionId: verified.session.sessionId,
        });
        onClose();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid verification code.');
    }
  };

  const handleInstantWorkerLogin = (candidate: CandidateProfile) => {
    onLoginSuccess({ role: 'worker', workerId: candidate.id });
    onClose();
  };

  const handleCopyOtp = () => {
    navigator.clipboard?.writeText(generatedOtp);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const unskilledDemo =
    candidates.find((c) => c.category === 'unskilled') || candidates[0];
  const skilledDemo =
    candidates.find((c) => c.ncvtCertificate.isVerified) || candidates[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
              HJ
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {authMode === 'register'
                  ? roleTab === 'worker'
                    ? 'Register as a Worker'
                    : 'Register as an Employer'
                  : roleTab === 'worker'
                  ? 'Worker Login'
                  : 'Employer Login'}
              </h2>
              <p className="text-xs text-slate-400">
                {roleTab === 'worker'
                  ? 'Access the Jobs Feed, apply in 1 click, and manage your profile'
                  : 'Access your Employer Dashboard to post jobs and shortlist candidates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setRoleTab('worker');
              setAuthError('');
              setOtpSent(false);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'worker'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>I am a Worker</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab('employer');
              setAuthError('');
              setOtpSent(false);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'employer'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Factory className="w-4 h-4 text-blue-600" />
            <span>I am an Employer</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Login vs Register Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setOtpSent(false);
                setAuthError('');
              }}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                authMode === 'login'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setOtpSent(false);
                setAuthError('');
              }}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                authMode === 'register'
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {roleTab === 'worker'
                  ? 'New Worker Registration'
                  : 'New Employer Registration'}
              </span>
            </button>
          </div>

          {/* Quick Demo Account Access for Easy Testing */}
          {authMode === 'login' && roleTab === 'worker' && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Instant Worker Login (Try Existing Accounts)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unskilledDemo && (
                  <button
                    type="button"
                    onClick={() => handleInstantWorkerLogin(unskilledDemo)}
                    className="p-2.5 bg-white hover:bg-emerald-100/50 border border-emerald-300 rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                        Helper / Packing
                      </span>
                      <div className="text-xs font-extrabold text-slate-900">
                        {unskilledDemo.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  </button>
                )}
                {skilledDemo && (
                  <button
                    type="button"
                    onClick={() => handleInstantWorkerLogin(skilledDemo)}
                    className="p-2.5 bg-white hover:bg-amber-100/50 border border-amber-300 rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        ITI Operator
                      </span>
                      <div className="text-xs font-extrabold text-slate-900">
                        {skilledDemo.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          )}

          {authMode === 'login' && roleTab === 'employer' && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Instant Employer Login (Verified Factory Account)
              </span>
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({
                    role: 'employer',
                    employerId: employerProfile.id,
                  });
                  onClose();
                }}
                className="w-full p-2.5 bg-white hover:bg-blue-100/40 border border-blue-300 rounded-lg text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {employerProfile.companyName}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {employerProfile.hrManagerName} · {employerProfile.industrialHub}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {!otpSent ? (
            <form
              onSubmit={(e) => handleRequestOtp('WHATSAPP_CLOUD', e)}
              className="space-y-4"
            >
              {roleTab === 'worker' && authMode === 'register' && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Manoj Paswan"
                        value={newWorkerName}
                        onChange={(e) => setNewWorkerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Expected Monthly In-Hand Pay (₹)
                      </label>
                      <input
                        type="number"
                        step={500}
                        min={12000}
                        value={newWorkerExpectedPay}
                        onChange={(e) =>
                          setNewWorkerExpectedPay(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 text-xs font-bold text-emerald-700 tabular-nums border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current City / District
                      </label>
                      <input
                        type="text"
                        value={newWorkerCity}
                        onChange={(e) => setNewWorkerCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Home State
                      </label>
                      <input
                        type="text"
                        value={newWorkerState}
                        onChange={(e) => setNewWorkerState(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Trade / Work Role *
                    </label>
                    <select
                      value={newWorkerTrade}
                      onChange={(e) =>
                        setNewWorkerTrade(e.target.value as TradeType)
                      }
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                    >
                      {QUICK_WORK_TYPES.map((q) => (
                        <option key={q.trade} value={q.trade}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {roleTab === 'employer' && authMode === 'register' && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Manufacturing Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kalyani Precision Forge Ltd"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        15-Digit Plant GSTIN *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={15}
                        value={newGstin}
                        onChange={(e) => setNewGstin(e.target.value)}
                        className="w-full px-3 py-2 text-xs uppercase tabular-nums border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        HR Manager Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Kulkarni"
                        value={newHrName}
                        onChange={(e) => setNewHrName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Industrial Hub / Location
                      </label>
                      <input
                        type="text"
                        value={newHub}
                        onChange={(e) => setNewHub(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {roleTab === 'worker'
                    ? '10-Digit Mobile Number'
                    : 'HR Manager 10-Digit Mobile Number'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-700 tabular-nums">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={activePhone}
                    onChange={(e) =>
                      roleTab === 'worker'
                        ? setPhoneInput(e.target.value)
                        : setEmpHrPhone(e.target.value)
                    }
                    className="flex-1 px-3.5 py-2 text-sm font-bold tabular-nums border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Clean Legal & Privacy Consent during Registration */}
              {authMode === 'register' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmAdult18Plus}
                      onChange={(e) => setConfirmAdult18Plus(e.target.checked)}
                      className="mt-0.5 rounded border-slate-400 text-amber-600"
                    />
                    <span>
                      I confirm that I am at least <strong>18 years of age</strong>.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTermsAndPrivacy}
                      onChange={(e) =>
                        setAcceptTermsAndPrivacy(e.target.checked)
                      }
                      className="mt-0.5 rounded border-slate-400 text-emerald-600"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLegalModal && onOpenLegalModal('terms')
                        }
                        className="text-blue-700 font-semibold hover:underline"
                      >
                        Terms & Conditions of Use
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLegalModal && onOpenLegalModal('privacy')
                        }
                        className="text-blue-700 font-semibold hover:underline"
                      >
                        Privacy Policy
                      </button>
                      , and consent to processing my account details for direct hiring.
                    </span>
                  </label>

                  {roleTab === 'worker' && (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentDirectoryDiscovery}
                        onChange={(e) =>
                          setConsentDirectoryDiscovery(e.target.checked)
                        }
                        className="mt-0.5 rounded border-slate-400 text-emerald-600"
                      />
                      <span>
                        Allow verified employers to discover my profile in the Candidate Directory (my mobile number remains masked until I apply or am invited).
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {authMode === 'register'
                      ? 'Send OTP to Register'
                      : 'Send WhatsApp OTP'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestOtp('DLT_SMS')}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Send OTP via SMS</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Verification code sent to +91 {activePhone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] hover:bg-emerald-100"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode ? 'Copied!' : `Code: ${generatedOtp}`}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full px-4 py-2.5 text-center text-lg font-extrabold tracking-widest tabular-nums border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleRequestOtp(
                      otpChannel === 'WHATSAPP_CLOUD'
                        ? 'DLT_SMS'
                        : 'WHATSAPP_CLOUD'
                    )
                  }
                  className="text-blue-700 hover:underline font-semibold"
                >
                  Resend Verification Code
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Change Mobile Number
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {authMode === 'register'
                    ? roleTab === 'worker'
                      ? 'Complete Registration & Open Jobs Feed'
                      : 'Complete Registration & Open Employer Dashboard'
                    : roleTab === 'worker'
                    ? 'Verify & Go to Jobs Feed'
                    : 'Verify & Go to Employer Dashboard'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
