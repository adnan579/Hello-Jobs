import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Users,
  Calculator,
  GraduationCap,
  ShieldAlert,
  Globe,
  ArrowLeft,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Phone,
  MessageCircle,
  ChevronRight,
  Landmark,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Save,
} from 'lucide-react';
import type { Language, JobListing, NotificationEvent, UserRole, CandidateProfile } from './types';
import WorkerPortal from './components/WorkerPortal';
import EmployerPortal from './components/EmployerPortal';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DualLanding from './components/DualLanding';
import ProfileManager from './components/ProfileManager';
import { TRANSLATIONS, getVoiceGuideScript } from './data/translations';
import { THEKEDAR_CUTS } from './data/emptyState';

/* ── Component ─────────────────────────────────────────────────────────── */
export default function App() {
  const [role, setRole] = useState<UserRole>('landing');
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeWorker, setActiveWorker] = useState<{ id: string; name: string; phone: string; savedJobIds: string[] } | null>(null);
  const [employerProfile, setEmployerProfile] = useState<{ id: string; companyName: string; companyId: string; credits: number; unlockedCandidateIds?: string[] } | null>(null);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNcvtCheck, setShowNcvtCheck] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [postedJobs, setPostedJobs] = useState<JobListing[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, CandidateProfile>>({});
  const [existingApplications, setExistingApplications] = useState<Record<string, { status: string; employerId: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('all');
  const [selectedHub, setSelectedHub] = useState('all');
  const notificationDrawerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  /* Notifications */
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !readNotificationIds.has(n.id)).length;
  }, [notifications, readNotificationIds]);

  const addNotification = (e: Omit<NotificationEvent, 'id' | 'timestamp'>) => {
    const event: NotificationEvent = {
      ...e,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [event, ...prev]);
  };

  const markNotificationsRead = () => {
    const newRead = new Set(readNotificationIds);
    notifications.forEach((n) => newRead.add(n.id));
    setReadNotificationIds(newRead);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /* Drawer Escape key handling */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotifications) setShowNotifications(false);
        if (showCalculator) setShowCalculator(false);
        if (showNcvtCheck) setShowNcvtCheck(false);
        if (showReportModal) setShowReportModal(false);
        if (showProfile) setShowProfile(false);
        if (showLogin) setShowLogin(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotifications, showCalculator, showNcvtCheck, showReportModal, showProfile, showLogin]);

  /* Focus trap for notification drawer */
  useEffect(() => {
    if (showNotifications && notificationDrawerRef.current) {
      const focusable = notificationDrawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [showNotifications]);

  /* Login */
  const startLogin = (phone?: string) => {
    setShowLogin(true);
    setLoginStep('phone');
    setLoginOtp('');
    if (phone) setLoginPhone(phone);
  };

  const submitPhone = () => {
    if (loginPhone.length >= 10) {
      setLoginStep('otp');
      addNotification({
        title: '🔐 Login Code Sent',
        body: `Your 6-digit OTP has been sent to +91 ${loginPhone}.`,
        type: 'alert',
        targetRole: 'worker',
      });
    }
  };

  const submitOtp = () => {
    if (loginOtp.length === 6) {
      setActiveWorker({ id: 'worker-' + Math.random().toString(36).slice(2), name: 'Demo Worker', phone: loginPhone, savedJobIds: [] });
      setShowLogin(false);
      addNotification({
        title: '✅ Welcome to Shramkart!',
        body: 'You are now logged in. Start applying for jobs directly.',
        type: 'alert',
        targetRole: 'worker',
      });
    }
  };

  const applyJob = (jobId: string) => {
    setExistingApplications((prev) => ({
      ...prev,
      [jobId]: { status: 'Pending', employerId: 'emp-1' },
    }));
  };

  const unlockCandidate = (candidateId: string, cost: number) => {
    setEmployerProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        credits: prev.credits - cost,
        unlockedCandidateIds: [...(prev.unlockedCandidateIds || []), candidateId],
      };
    });
  };

  const postJob = (job: JobListing) => {
    setPostedJobs((prev) => [job, ...prev]);
  };

  /* Voice guide */
  const playVoiceGuide = (context: 'worker-feed' | 'onboarding' | 'worker-profile' | 'dpdp-notice') => {
    if (!audioEnabled) return;
    const text = getVoiceGuideScript(context, language);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  /* Role switch */
  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setShowProfile(false);
    setShowCalculator(false);
    setShowNcvtCheck(false);
    setShowReportModal(false);
    setShowLogin(false);
  };

  /* Render */
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <Navbar
        role={role}
        onRoleSwitch={switchRole}
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode((d) => !d)}
        unreadNotificationsCount={unreadNotificationsCount}
        onNotificationClick={() => {
          setShowNotifications(true);
          markNotificationsRead();
        }}
        onCalculatorClick={() => setShowCalculator(true)}
        onNcvtClick={() => setShowNcvtCheck(true)}
        onReportClick={() => setShowReportModal(true)}
        activeWorker={activeWorker}
        employerProfile={employerProfile}
        onLogin={() => startLogin()}
        onProfileClick={() => setShowProfile(true)}
        onPostJob={(job) => postJob(job)}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {role === 'landing' && (
          <DualLanding
            language={language}
            onWorkerClick={() => switchRole('worker')}
            onEmployerClick={() => {
              setEmployerProfile({ id: 'emp-' + Math.random().toString(36).slice(2), companyName: 'Demo Factory', companyId: 'DEMO001', credits: 10 });
              switchRole('employer');
            }}
          />
        )}

        {role === 'worker' && (
          <WorkerPortal
            activeWorker={activeWorker}
            searchQuery={searchQuery}
            selectedTrade={selectedTrade}
            selectedHub={selectedHub}
            language={language}
            onLanguageChange={setLanguage}
            onOpenProfile={() => setShowProfile(true)}
            onStartLogin={startLogin}
            onRegister={() => startLogin()}
            onApplyJob={applyJob}
            existingApplications={existingApplications}
            postedJobs={postedJobs}
            factoryProfiles={{}}
            onAddNotification={addNotification}
          />
        )}

        {role === 'employer' && employerProfile && (
          <EmployerPortal
            employerProfile={employerProfile}
            searchQuery={searchQuery}
            selectedTrade={selectedTrade}
            selectedHub={selectedHub}
            language={language}
            onLanguageChange={setLanguage}
            onOpenProfile={() => setShowProfile(true)}
            onUnlockCandidate={unlockCandidate}
            onAddNotification={addNotification}
            candidateProfiles={candidateProfiles}
          />
        )}
      </main>

      <Footer
        language={language}
        onLanguageChange={setLanguage}
        onPrivacyClick={() => playVoiceGuide('dpdp-notice')}
      />

      {/* ── Notification Drawer ────────────────────────────────── */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNotifications(false)}
          />
          <div
            ref={notificationDrawerRef}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 id="notif-title" className="text-base font-extrabold text-slate-950 dark:text-white">{t.notificationsTitle}</h2>
                <p className="text-xs text-slate-500">{t.notificationsSubtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs font-bold text-slate-500 hover:text-red-600"
                  >
                    {t.clearAll}
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="icon-btn"
                  aria-label={t.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="empty-state border-0 bg-transparent">
                  <Bell className="empty-state-icon w-12 h-12" />
                  <h4 className="empty-state-title">{t.emptyStateNoNotifications}</h4>
                  <p className="empty-state-desc">{t.emptyStateNoNotificationsDesc}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-slate-400 hover:text-slate-600 ml-2"
                        aria-label={t.dismiss}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <p className="text-[10px] text-slate-500 text-center">{t.quietHours} · {t.quietHoursDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Calculator Modal ───────────────────────────────────── */}
      {showCalculator && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calc-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCalculator(false); }}
        >
          <div className="dialog-panel" style={{ maxWidth: '28rem' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 id="calc-title" className="text-base font-extrabold text-slate-950">{t.calculatorTitle}</h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{t.calculatorDesc}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Monthly Salary (₹)</label>
                <input
                  type="number"
                  defaultValue={20000}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs font-bold text-red-700">{t.thekedarCutWarning}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500">With Thekedar (25% cut)</p>
                  <p className="text-lg font-extrabold text-red-600">₹15,000</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500">Direct Hire (0% cut)</p>
                  <p className="text-lg font-extrabold text-green-700">₹20,000</p>
                </div>
              </div>
              <p className="text-sm font-bold text-green-700 text-center">You save ₹5,000 every month!</p>
            </div>
          </div>
        </div>
      )}

      {/* ── NCVT Check Modal ───────────────────────────────────── */}
      {showNcvtCheck && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ncvt-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNcvtCheck(false); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="ncvt-modal-title" className="text-base font-extrabold text-slate-950">{t.ncvtCheckTitle}</h3>
              <button
                onClick={() => setShowNcvtCheck(false)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">NCVT Registration Number</label>
                <input
                  placeholder="e.g. NCVT-2024-123456"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Date of Birth</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button className="btn-blue w-full justify-center">
                <GraduationCap className="w-4 h-4" />
                Verify Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ───────────────────────────────────────── */}
      {showReportModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="report-title" className="text-base font-extrabold text-slate-950">{t.reportModalTitle}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{t.reportModalDesc}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Thekedar Name</label>
                <input
                  placeholder="Enter contractor name"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Your Mobile Number</label>
                <input
                  placeholder="+91..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Details of Exploitation</label>
                <textarea
                  rows={3}
                  placeholder="Describe what happened..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  addNotification({
                    title: '🛡️ Report Submitted',
                    body: 'Your complaint has been recorded. Our team will contact you within 24 hours.',
                    type: 'alert',
                    targetRole: 'worker',
                  });
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-extrabold rounded-xl transition flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Login Modal ────────────────────────────────────────── */}
      {showLogin && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="login-title" className="text-base font-extrabold text-slate-950">Worker Login</h3>
              <button
                onClick={() => setShowLogin(false)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {loginStep === 'phone' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Mobile Number</label>
                  <input
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="+91..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  onClick={submitPhone}
                  className="btn-amber w-full justify-center"
                >
                  Send OTP
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Enter 6-Digit Code</label>
                  <input
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  onClick={submitOtp}
                  className="btn-amber w-full justify-center"
                >
                  Verify & Login
                </button>
                <button
                  onClick={() => setLoginStep('phone')}
                  className="text-xs text-slate-500 hover:text-slate-700 w-full text-center"
                >
                  Change phone number
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Profile Modal ──────────────────────────────────────── */}
      {showProfile && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}
        >
          <div className="dialog-panel" style={{ maxWidth: '32rem' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 id="profile-title" className="text-base font-extrabold text-slate-950">My Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ProfileManager
              activeWorker={activeWorker}
              employerProfile={employerProfile}
              role={role}
              language={language}
              onUpdateWorker={(w) => setActiveWorker(w)}
              onUpdateEmployer={(e) => setEmployerProfile(e)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
