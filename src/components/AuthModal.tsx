import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Factory,
  KeyRound,
  CheckCircle2,
  Copy,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { TradeType, WorkerSkillCategory } from '../types';
import { sendOtpApi, signInApi } from '../utils/api';

interface Props {
  isOpen: boolean;
  initialTab?: 'worker' | 'employer';
  initialMode?: 'login' | 'register';
  onClose: () => void;
  /** Called after the server has signed the person in (cookie set). */
  onLoginSuccess: () => void;
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
  onLoginSuccess,
  onOpenLegalModal,
}) => {
  const [roleTab, setRoleTab] = useState<'worker' | 'employer'>(initialTab);
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // OTP Verification State
  const [phoneInput, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [busy, setBusy] = useState(false);

  // Registration Terms & Privacy Consent (nothing is pre-ticked: consent must be a choice)
  const [confirmAdult18Plus, setConfirmAdult18Plus] = useState(false);
  const [acceptTermsAndPrivacy, setAcceptTermsAndPrivacy] = useState(false);
  const [consentDirectoryDiscovery, setConsentDirectoryDiscovery] = useState(false);

  // Worker Registration Fields
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState<TradeType>(
    'Packing & Box Loading (No Certificate)'
  );
  const [newWorkerCity, setNewWorkerCity] = useState('');
  const [newWorkerState, setNewWorkerState] = useState('');
  const [newWorkerExpectedPay, setNewWorkerExpectedPay] = useState<number | ''>('');

  // Employer Registration Fields
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newUdyam, setNewUdyam] = useState('');
  const [newHrName, setNewHrName] = useState('');
  const [newHub, setNewHub] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoleTab(initialTab);
      setAuthMode(initialMode);
      setOtpSent(false);
      setAuthError('');
      setDemoCode('');
      setEnteredOtp('');
    }
  }, [isOpen, initialTab, initialMode]);

  if (!isOpen) return null;

  const activePhone = phoneInput;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');

    const digits = activePhone.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (authMode === 'register') {
      if (roleTab === 'worker' && (!newWorkerName.trim() || !newWorkerCity.trim() || !newWorkerState.trim())) {
        setAuthError('Please enter your full name, city and home state to register.');
        return;
      }
      if (roleTab === 'employer' && (!newCompanyName.trim() || !newHrName.trim() || !newGstin.trim() || !newHub.trim())) {
        setAuthError('Please enter the company name, GSTIN, HR manager name and industrial hub.');
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

    setBusy(true);
    const res = await sendOtpApi(digits, roleTab);
    setBusy(false);
    if (!res.ok) {
      setAuthError(res.error);
      return;
    }
    setDemoCode(res.demoCode ?? '');
    setEnteredOtp('');
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const digits = activePhone.replace(/\D/g, '').slice(-10);
    setBusy(true);
    const res = await signInApi(
      roleTab === 'worker'
        ? {
            role: 'worker',
            phone: digits,
            code: enteredOtp.trim(),
            mode: authMode,
            adultConfirmed: confirmAdult18Plus,
            termsAccepted: acceptTermsAndPrivacy,
            consent: {
              directoryDiscovery: consentDirectoryDiscovery,
              whatsappJobAlerts: false,
              credentialVerification: true,
              marketingCommunications: false,
              noticeLanguage: 'en',
            },
            registration:
              authMode === 'register'
                ? {
                    name: newWorkerName.trim(),
                    trade: newWorkerTrade,
                    currentCity: newWorkerCity.trim(),
                    homeState: newWorkerState.trim(),
                    expectedSalary: newWorkerExpectedPay === '' ? undefined : Number(newWorkerExpectedPay),
                  }
                : undefined,
          }
        : {
            role: 'employer',
            phone: digits,
            code: enteredOtp.trim(),
            mode: authMode,
            adultConfirmed: confirmAdult18Plus,
            termsAccepted: acceptTermsAndPrivacy,
            registration:
              authMode === 'register'
                ? {
                    companyName: newCompanyName.trim(),
                    gstin: newGstin.trim().toUpperCase(),
                    udyamNumber: newUdyam.trim().toUpperCase() || undefined,
                    hrManagerName: newHrName.trim(),
                    industrialHub: newHub.trim(),
                  }
                : undefined,
          }
    );
    setBusy(false);
    if (!res.ok) {
      setAuthError(res.error);
      return;
    }
    onLoginSuccess();
    onClose();
  };

  const handleCopyOtp = () => {
    navigator.clipboard?.writeText(demoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
        {(
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
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Login vs Register Mode Switcher */}
          {(
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
          )}

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {!otpSent ? (
            <form
              onSubmit={handleRequestOtp}
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
                        placeholder="Your name as on your ID"
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
                        min={0}
                        placeholder="Optional"
                        value={newWorkerExpectedPay}
                        onChange={(e) =>
                          setNewWorkerExpectedPay(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
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
                        required
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
                        required
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
                        placeholder="Registered company name"
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
                        placeholder="e.g. 27AAPFU0939F1ZV"
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
                        placeholder="HR manager full name"
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
                        required
                        placeholder="e.g. Chakan MIDC, Pune"
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
                    placeholder="10-digit mobile"
                    onChange={(e) => setPhoneInput(e.target.value)}
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

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {busy
                    ? 'Sending...'
                    : authMode === 'register'
                    ? 'Send WhatsApp OTP to Register'
                    : 'Send WhatsApp OTP'}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {demoCode
                        ? `Test site: your code is shown here instead of WhatsApp`
                        : `Verification code sent on WhatsApp to +91 ${activePhone}`}
                    </span>
                  </div>
                  {demoCode && (
                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] hover:bg-emerald-100"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode ? 'Copied!' : `Code: ${demoCode}`}</span>
                    </button>
                  )}
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
                  onClick={() => handleRequestOtp()}
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
                disabled={busy}
                className="w-full py-3 px-4 disabled:opacity-60 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
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
