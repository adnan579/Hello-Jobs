'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserRole,
  Language,
  JobListing,
  CandidateProfile,
  OfferLetter,
  JobApplication,
  EmployerFactoryProfile,
  AuthSession,
  NotificationEvent,
  VerificationRecord,
  CreditLedgerEntry,
  HiringDrive,
  RetentionCheckIn,
  FeeReport,
  DpdpGrievanceTicket,
  DpdpAuditLog,
} from './types';
import { EMPTY_EMPLOYER } from './data/emptyState';
import { makeT } from './data/translations';
import { isUnread, savedJobIdSet, toggleId } from './modules/discovery';
import { Navbar, type WorkerTab } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dialog } from './components/ui/Dialog';
import { DualLanding } from './components/DualLanding';
import { WorkerPortal } from './components/WorkerPortal';
import { EmployerPortal } from './components/EmployerPortal';
import { WorkerProfileView } from './components/WorkerProfileView';
import { EmployerProfileView } from './components/EmployerProfileView';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';
import { NcvtCertificateModal } from './components/NcvtCertificateModal';
import { DigitalOfferModal } from './components/DigitalOfferModal';
import { PracticalVideoModal } from './components/PracticalVideoModal';
import { TakeHomeCalculatorModal } from './components/TakeHomeCalculatorModal';
import { WhistleblowerModal } from './components/WhistleblowerModal';
import { SmartTradeProfileModal } from './components/SmartTradeProfileModal';
import { PostJobModal } from './components/PostJobModal';
import { NcvtSearchModal } from './components/NcvtSearchModal';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/LegalModal';
import { DpdpComplianceModal } from './components/DpdpComplianceModal';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { stopJobAudio } from './utils/audioNarrator';
import {
  fetchBootstrap,
  logoutApi,
  createCandidateApi,
  updateCandidateApi,
  createJobApi,
  updateJobApi,
  createApplicationApi,
  updateApplicationStatusApi,
  createOfferApi,
  updateOfferStatusApi,
  updateEmployerApi,
  toggleShortlistApi,
  eraseDpdpDataApi,
  unlockCandidateContactApi,
  purchaseCreditPackApi,
  registerHiringDriveApi,
  submitRetentionCheckInApi,
  updateDpdpConsentApi,
  updateDpdpNomineeApi,
  submitDpdpGrievanceApi,
  downloadMyDataApi,
  UNAUTHORIZED_EVENT,
  ERROR_EVENT,
  type BootstrapPayload,
} from './utils/api';
import { APP_ROLE_PATHS, roleForPath, workerTabForPath } from './utils/routes';
import { Bell, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface AppProps {
  initialRole?: UserRole;
  initialData?: Pick<BootstrapPayload, 'jobs' | 'stats' | 'hiringDrives'>;
  initialAuth?: { role: 'worker' | 'employer'; mode: 'login' | 'register' };
  initialLegalTab?: 'privacy' | 'terms';
  initialNextPath?: string;
  initialWorkerTab?: WorkerTab;
  initialLanguage?: Language;
}

export default function App({ initialRole, initialData, initialAuth, initialLegalTab, initialNextPath, initialWorkerTab, initialLanguage }: AppProps = {}) {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => initialRole ?? (
    typeof window !== 'undefined' ? roleForPath(window.location.pathname, window.location.hash) : 'landing'
  ));
  const [currentLang, setCurrentLang] = useState<Language>(initialLanguage ?? 'en');
  const [booting, setBooting] = useState(true);
  const [toast, setToast] = useState('');

  // Everything below is exactly what the server says this person may see.
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>(initialData?.jobs ?? []);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [employerProfile, setEmployerProfile] =
    useState<EmployerFactoryProfile>(EMPTY_EMPLOYER);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [feeReports, setFeeReports] = useState<FeeReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  // Notifications the person has opened the list for in this visit. The server's own `read` flag
  // still counts: a notification is unread only if neither says it was read.
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [workerTab, setWorkerTab] = useState<WorkerTab>(initialWorkerTab ?? 'profile');
  const [verificationRecords, setVerificationRecords] = useState<
    VerificationRecord[]
  >([]);
  const [creditLedger, setCreditLedger] = useState<CreditLedgerEntry[]>([]);
  const [hiringDrives, setHiringDrives] = useState<HiringDrive[]>(initialData?.hiringDrives ?? []);
  const [retentionCheckIns, setRetentionCheckIns] = useState<RetentionCheckIn[]>(
    []
  );
  const [grievances, setGrievances] = useState<DpdpGrievanceTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<DpdpAuditLog[]>([]);
  const [stats, setStats] = useState(initialData?.stats ?? { workers: 0, factories: 0, jobs: 0 });
  const t = useMemo(() => makeT(currentLang), [currentLang]);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(Boolean(initialAuth));
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'worker' | 'employer'>(initialAuth?.role ?? 'worker');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>(initialAuth?.mode ?? 'login');

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(Boolean(initialLegalTab));
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>(initialLegalTab ?? 'privacy');
  const [isDpdpOpen, setIsDpdpOpen] = useState(false);

  const [selectedNcvtCandidate, setSelectedNcvtCandidate] =
    useState<CandidateProfile | null>(null);
  const [isNcvtModalOpen, setIsNcvtModalOpen] = useState(false);

  const [selectedOfferCandidate, setSelectedOfferCandidate] =
    useState<CandidateProfile | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const [selectedVideoCandidate, setSelectedVideoCandidate] =
    useState<CandidateProfile | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportPrefilledCompany, setReportPrefilledCompany] =
    useState<string>('');

  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isNcvtSearchOpen, setIsNcvtSearchOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] =
    useState(false);

  const applySnapshot = useCallback((data: BootstrapPayload) => {
    setAuthSession(data.session ?? null);
    setJobs(data.jobs);
    setCandidates(data.candidates);
    setOffers(data.offers);
    setApplications(data.applications);
    setEmployerProfile(data.employerProfile ?? EMPTY_EMPLOYER);
    setShortlistedIds(data.shortlistedIds);
    setFeeReports(data.feeReports ?? data.reports ?? []);
    setNotifications(data.notifications ?? []);
    setVerificationRecords(data.verificationRecords ?? []);
    setCreditLedger(data.creditLedger ?? []);
    setHiringDrives(data.hiringDrives ?? []);
    setRetentionCheckIns(data.retentionCheckIns ?? []);
    setGrievances(data.dpdpGrievances ?? []);
    setAuditLogs(data.dpdpAuditLogs ?? []);
    if (data.stats) setStats(data.stats);
  }, []);

  const syncFromBackend = useCallback(async () => {
    const data = await fetchBootstrap();
    if (data) applySnapshot(data);
    return data;
  }, [applySnapshot]);

  // First load: ask the server who we are (the session lives in an httpOnly cookie).
  useEffect(() => {
    syncFromBackend().finally(() => setBooting(false));
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') syncFromBackend();
    }, 30000);
    return () => clearInterval(interval);
  }, [syncFromBackend]);

  // Server says our session is gone (expired, revoked elsewhere): drop to the public site.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const onUnauthorized = () => {
      setAuthSession(null);
      setCurrentRole('landing');
      if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
      syncFromBackend();
    };
    const onError = (e: Event) => {
      setToast(String((e as CustomEvent).detail || 'Something went wrong.'));
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 6000);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener(ERROR_EVENT, onError);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener(ERROR_EVENT, onError);
    };
  }, [syncFromBackend]);

  const activeWorker =
    authSession?.role === 'worker'
      ? candidates.find((c) => c.id === authSession.workerId)
      : undefined;

  // Never show a private page to someone who is not signed in as that kind of user.
  useEffect(() => {
    if (booting) return;
    const needs: Partial<Record<UserRole, AuthSession['role']>> = {
      'worker-profile': 'worker',
      employer: 'employer',
      'employer-profile': 'employer',
    };
    const need = needs[currentRole];
    if (need && authSession?.role !== need) {
      setCurrentRole('landing');
      window.history.replaceState(null, '', '/');
    }
  }, [booting, currentRole, authSession]);

  const handleRoleChange = (role: UserRole) => {
    if (role === 'employer' && authSession?.role !== 'employer') {
      window.location.assign('/employers');
      return;
    }
    stopJobAudio();
    const path = APP_ROLE_PATHS[role];
    if (path && window.location.pathname !== path) window.history.pushState(null, '', path);
    setCurrentRole(role);
    syncFromBackend();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLang(language);
    document.cookie = `hj_language=${language}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  };

  const handleOpenAuthModal = (
    initialTab: 'worker' | 'employer' = 'worker',
    initialMode: 'login' | 'register' = 'login'
  ) => {
    setAuthModalInitialTab(initialTab);
    setAuthModalInitialMode(initialMode);
    setIsAuthModalOpen(true);
  };

  const handleOpenLegalModal = (tab: 'privacy' | 'terms' = 'privacy') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // The server has set the session cookie; ask who we are and route by role.
  const handleLoginSuccess = async () => {
    const data = await syncFromBackend();
    const role = data?.session?.role;
    if (initialNextPath) {
      const next = new URL(initialNextPath, window.location.origin);
      if (next.origin === window.location.origin) {
        window.location.assign(`${next.pathname}${next.search}${next.hash}`);
        return;
      }
    }
    if (role === 'worker') handleRoleChange('worker');
    else if (role === 'employer') handleRoleChange('employer-profile');
  };

  const handleLogout = async () => {
    await logoutApi();
    setAuthSession(null);
    setCurrentRole('landing');
    if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
    stopJobAudio();
    await syncFromBackend();
  };

  const handleInspectCertificate = (candidate: CandidateProfile) => {
    setSelectedNcvtCandidate(candidate);
    setIsNcvtModalOpen(true);
  };

  const handleOpenVideoDemo = (candidate: CandidateProfile) => {
    setSelectedVideoCandidate(candidate);
    setIsVideoModalOpen(true);
  };

  const handleOpenIssueOffer = (candidate: CandidateProfile) => {
    setSelectedOfferCandidate(candidate);
    setIsOfferModalOpen(true);
  };

  const run = async (call: Promise<BootstrapPayload | null>) => {
    const res = await call;
    if (res) applySnapshot(res);
    return res;
  };

  const handleIssueOffer = async (newOffer: OfferLetter): Promise<boolean> => {
    // An offer attaches to the worker's application to one of this factory's jobs.
    const app =
      applications.find(
        (a) =>
          a.candidateId === newOffer.candidateId &&
          (!newOffer.jobId || a.jobId === newOffer.jobId) &&
          ['Applied', 'Shortlisted', 'Interview', 'Declined'].includes(a.status)
      ) || null;
    if (!app) {
      setToast(
        'This worker has not applied to one of your jobs yet. Invite them first, then send the offer once they apply.'
      );
      return false;
    }
    const res = await run(createOfferApi({ ...newOffer, applicationId: app.id }));
    return !!res;
  };

  const handleUpdateOfferStatus = async (
    offerId: string,
    status: OfferLetter['status'],
    declineReason?: string,
    workerConfirmedJoining?: boolean
  ) => {
    await run(
      updateOfferStatusApi(offerId, status, declineReason, workerConfirmedJoining)
    );
  };

  const handleApplyJob = async (job: JobListing) => {
    if (!activeWorker) {
      handleOpenAuthModal('worker', 'login');
      return;
    }
    if (applications.some((a) => a.jobId === job.id)) return;
    await run(createApplicationApi(job.id));
  };

  const handleUpdateWorker = async (updated: CandidateProfile) => {
    await run(updateCandidateApi(updated));
  };

  const handleUpdateJob = async (updatedJob: JobListing) => {
    await run(updateJobApi(updatedJob));
  };

  const handleUpdateApplicationStatus = async (
    appId: string,
    status: JobApplication['status'],
    employerPrivateNotes?: string
  ) => {
    await run(
      updateApplicationStatusApi(appId, status, { employerPrivateNotes })
    );
  };

  const handleToggleShortlist = async (candidateId: string) => {
    await run(toggleShortlistApi(candidateId));
  };

  const handleUnlockCandidateContact = async (candidateId: string) => {
    await run(unlockCandidateContactApi(candidateId));
  };

  const handlePurchaseCredits = async (
    packId: 'PACK_10' | 'PACK_25' | 'PACK_100'
  ) => {
    await run(purchaseCreditPackApi(packId, employerProfile));
  };

  const handleRegisterDrive = async (driveId: string) => {
    await run(registerHiringDriveApi(driveId));
  };

  const handleSubmitCheckIn = async (checkIn: RetentionCheckIn) => {
    await run(submitRetentionCheckInApi(checkIn));
  };

  const handleJobCreated = async (newJob: JobListing) => {
    await run(createJobApi(newJob));
  };

  const handleProfileCreated = async (newCandidate: CandidateProfile) => {
    if (!activeWorker) return;
    await run(createCandidateApi({ ...newCandidate, id: activeWorker.id }));
    handleRoleChange('worker');
  };

  const handleUpdateEmployerProfile = async (
    updatedEmp: EmployerFactoryProfile
  ) => {
    await run(updateEmployerApi(updatedEmp));
  };

  const handleOpenReport = (companyName?: string) => {
    setReportPrefilledCompany(companyName || '');
    setIsReportOpen(true);
  };

  const handleEraseWorkerData = async (workerId: string) => {
    const ok = await eraseDpdpDataApi(workerId);
    if (ok) {
      setIsDpdpOpen(false);
      setAuthSession(null);
      setCurrentRole('landing');
      if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
      await syncFromBackend();
    }
  };

  /* Notifications unread tracking */
  const unreadNotificationsCount = notifications.filter(
    (n) => isUnread(n) && !readNotificationIds.has(n.id)
  ).length;

  const markNotificationsRead = () => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  };

  // One entry point for the header bell and the phone Alerts tab, so both mark things as seen.
  const openNotifications = () => {
    setIsNotificationsDrawerOpen(true);
    markNotificationsRead();
  };

  // Only a signed-in factory can post a job. Everyone else is sent to the right door first,
  // instead of filling in a form that the server would refuse at the end.
  const requestPostJob = () => {
    if (authSession?.role === 'employer') setIsPostJobOpen(true);
    else if (authSession?.role === 'worker') {
      setToast(t('postJobFactoryOnly'));
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 6000);
    }
    else handleOpenAuthModal('employer', 'login');
  };

  const openWorkerTab = (tab: WorkerTab) => {
    handleRoleChange('worker-profile');
    const path = tab === 'inbox' ? '/me/applications' : tab === 'idcard' ? '/me/id-card' : '/me';
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
    setWorkerTab(tab);
  };

  /** Saves or un-saves a job on the signed-in worker's profile (stored on the server). */
  const handleToggleSaveJob = async (jobId: string) => {
    if (!activeWorker) return;
    const current = [...savedJobIdSet(activeWorker)];
    await run(updateCandidateApi({ ...activeWorker, savedJobIds: toggleId(current, jobId) }));
  };

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentRole(roleForPath(window.location.pathname, window.location.hash));
      setWorkerTab(workerTabForPath(window.location.pathname));
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  // Screen readers and browser translation need the page language.
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  /* Escape key handler for all modals and drawers */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCalculatorOpen) setIsCalculatorOpen(false);
        if (isReportOpen) setIsReportOpen(false);
        if (isNcvtSearchOpen) setIsNcvtSearchOpen(false);
        if (isCreateProfileOpen) setIsCreateProfileOpen(false);
        if (isPostJobOpen) setIsPostJobOpen(false);
        if (isAuthModalOpen) setIsAuthModalOpen(false);
        if (isLegalModalOpen) setIsLegalModalOpen(false);
        if (isDpdpOpen) setIsDpdpOpen(false);
        if (isNcvtModalOpen) setIsNcvtModalOpen(false);
        if (isOfferModalOpen) setIsOfferModalOpen(false);
        if (isVideoModalOpen) setIsVideoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCalculatorOpen,
    isReportOpen,
    isNcvtSearchOpen,
    isCreateProfileOpen,
    isPostJobOpen,
    isAuthModalOpen,
    isLegalModalOpen,
    isDpdpOpen,
    isNcvtModalOpen,
    isOfferModalOpen,
    isVideoModalOpen,
  ]);

  return (
    <div className="pb-nav flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <a href="#main" className="skip-link">
        {t('skipToContent')}
      </a>
      {toast && (
        <div
          role="alert"
          className="fixed top-3 inset-x-3 sm:left-auto sm:right-4 sm:max-w-md z-[60] flex items-start gap-2 p-3 bg-red-600 text-white text-sm font-semibold rounded-xl shadow-xl"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button type="button" onClick={() => setToast('')} aria-label={t('close')}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {/* Top Bar Navigation */}
      <Navbar
        currentRole={currentRole}
        currentLang={currentLang}
        authSession={authSession}
        activeWorker={activeWorker}
        employerProfile={employerProfile}
        unreadNotificationsCount={unreadNotificationsCount}
        workerTab={workerTab}
        onOpenWorkerTab={openWorkerTab}
        onRoleChange={handleRoleChange}
        onLangChange={handleLanguageChange}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenReport={() => handleOpenReport()}
        onOpenNcvtSearch={() => setIsNcvtSearchOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenNotifications={openNotifications}
        onOpenPostJob={requestPostJob}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {currentRole === 'landing' && (
          <DualLanding
            currentLang={currentLang}
            authSession={authSession}
            activeWorker={activeWorker}
            employerProfile={employerProfile}
            jobs={jobs}
            candidates={candidates}
            stats={stats}
            onSelectRole={handleRoleChange}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onOpenReport={() => handleOpenReport()}
            onOpenAuthModal={handleOpenAuthModal}
            onOpenLegalModal={handleOpenLegalModal}
          />
        )}

        {currentRole === 'about' && (
          <AboutPage
            t={t}
            jobs={jobs}
            isSignedIn={Boolean(authSession)}
            onBrowseJobs={() => handleRoleChange('worker')}
            onRegisterWorker={() => handleOpenAuthModal('worker', 'register')}
            onRegisterFactory={() => handleOpenAuthModal('employer', 'register')}
            onLogin={() => handleOpenAuthModal('worker', 'login')}
          />
        )}

        {currentRole === 'worker' && (
          <WorkerPortal
            jobs={jobs}
            currentLang={currentLang}
            activeWorker={activeWorker}
            applications={applications}
            offers={offers}
            hiringDrives={hiringDrives}
            onApplyJob={handleApplyJob}
            onOpenWorkerProfile={() => {
              if (authSession?.role === 'worker') {
                handleRoleChange('worker-profile');
              } else {
                handleOpenAuthModal('worker', 'login');
              }
            }}
            onOpenAuthModal={() => handleOpenAuthModal('worker', 'login')}
            onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
            onOpenReport={handleOpenReport}
            onRegisterDrive={handleRegisterDrive}
            onToggleSaveJob={handleToggleSaveJob}
          />
        )}

        {currentRole === 'employer' && (
          <EmployerPortal
            candidates={candidates}
            jobs={jobs}
            currentLang={currentLang}
            authSession={authSession}
            employerProfile={employerProfile}
            shortlistedIds={shortlistedIds}
            onToggleShortlist={handleToggleShortlist}
            onUnlockCandidateContact={handleUnlockCandidateContact}
            onOpenEmployerProfile={() => {
              if (authSession?.role === 'employer') {
                handleRoleChange('employer-profile');
              } else {
                handleOpenAuthModal('employer', 'login');
              }
            }}
            onOpenAuthModal={() => handleOpenAuthModal('employer', 'login')}
            onRegisterFactory={() => handleOpenAuthModal('employer', 'register')}
            onSeeHow={() => handleRoleChange('about')}
            onOpenPostJob={requestPostJob}
            onInspectCertificate={handleInspectCertificate}
            onOpenVideoDemo={handleOpenVideoDemo}
            onOpenIssueOffer={handleOpenIssueOffer}
          />
        )}

        {currentRole === 'worker-profile' && activeWorker && (
          <WorkerProfileView
            worker={activeWorker}
            applications={applications}
            offers={offers}
            currentLang={currentLang}
            retentionCheckIns={retentionCheckIns}
            activeTab={workerTab}
            onActiveTabChange={setWorkerTab}
            onUpdateWorker={handleUpdateWorker}
            onUpdateOfferStatus={handleUpdateOfferStatus}
            onSubmitCheckIn={handleSubmitCheckIn}
            onInspectCertificate={handleInspectCertificate}
            onOpenVideoDemo={handleOpenVideoDemo}
            onBrowseJobs={() => handleRoleChange('worker')}
            onLogout={handleLogout}
            onOpenDpdpModal={() => setIsDpdpOpen(true)}
          />
        )}

        {currentRole === 'employer-profile' && (
          <EmployerProfileView
            employer={employerProfile}
            jobs={jobs}
            applications={applications}
            offers={offers}
            candidates={candidates}
            shortlistedIds={shortlistedIds}
            creditLedger={creditLedger}
            onUpdateEmployer={handleUpdateEmployerProfile}
            onUpdateJob={handleUpdateJob}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onPurchaseCredits={handlePurchaseCredits}
            onToggleShortlist={handleToggleShortlist}
            onInspectCertificate={handleInspectCertificate}
            onOpenIssueOffer={handleOpenIssueOffer}
            onOpenPostJob={requestPostJob}
            onBrowseTalent={() => handleRoleChange('employer')}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav
        t={t}
        currentRole={currentRole}
        signedInAs={
          authSession?.role === 'employer'
            ? 'employer'
            : authSession?.role === 'worker' && activeWorker
              ? 'worker'
              : null
        }
        workerTab={workerTab}
        unreadCount={unreadNotificationsCount}
        onRoleChange={handleRoleChange}
        onOpenWorkerTab={openWorkerTab}
        onOpenNotifications={openNotifications}
        onOpenPostJob={requestPostJob}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* In-App Notifications Drawer */}
      <Dialog
        open={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        variant="drawer"
        eyebrow={t('notifSubtitle')}
        title={t('notifTitle')}
        closeLabel={t('notifCloseAria')}
      >
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-meta font-semibold text-slate-700">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('notifQuiet')}</span>
        </p>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Bell className="mb-3 h-10 w-10 text-slate-400" aria-hidden="true" />
            <h3 className="text-body font-bold text-slate-900">{t('notifEmptyTitle')}</h3>
            <p className="mt-1 max-w-xs text-body text-slate-700">{t('notifEmptyBody')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge">{n.channel}</span>
                  <span className="inline-flex items-center gap-1 text-meta font-bold text-[var(--sk-green-text)]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {n.status}
                  </span>
                </div>
                <p className="text-body font-bold text-slate-900">{n.title}</p>
                <p className="text-body text-slate-700">{n.body}</p>
                <p className="text-meta tabular-nums text-slate-600">{n.createdAt}</p>
              </li>
            ))}
          </ul>
        )}
      </Dialog>

      {/* Universal Footer */}
      <Footer
        currentLang={currentLang}
        onSelectRole={handleRoleChange}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenReport={() => handleOpenReport()}
        onOpenNcvtSearch={() => setIsNcvtSearchOpen(true)}
        onOpenLegalModal={handleOpenLegalModal}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalInitialTab}
        initialMode={authModalInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenLegalModal={handleOpenLegalModal}
      />

      {activeWorker && (
        <DpdpComplianceModal
          isOpen={isDpdpOpen}
          onClose={() => setIsDpdpOpen(false)}
          lang={currentLang}
          activeWorker={activeWorker}
          applications={applications}
          offers={offers}
          grievances={grievances}
          auditLogs={auditLogs}
          onUpdateConsent={async (workerId, consent) => {
            await run(updateDpdpConsentApi(workerId, consent));
          }}
          onUpdateNominee={async (workerId, nominee) => {
            await run(updateDpdpNomineeApi(workerId, nominee));
          }}
          onEraseWorkerData={handleEraseWorkerData}
          onSubmitGrievance={async (ticket) => {
            const t = await submitDpdpGrievanceApi(ticket);
            await syncFromBackend();
            return t?.id;
          }}
          onDownloadData={downloadMyDataApi}
        />
      )}

      <LegalModal
        isOpen={isLegalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setIsLegalModalOpen(false)}
        authSession={authSession}
        activeWorker={activeWorker}
        employerProfile={employerProfile}
        onDeleteWorkerAccount={() => {
          if (activeWorker) {
            handleEraseWorkerData(activeWorker.id);
          }
        }}
      />

      {selectedNcvtCandidate && (
        <NcvtCertificateModal
          candidateName={selectedNcvtCandidate.name}
          certificate={selectedNcvtCandidate.ncvtCertificate}
          isOpen={isNcvtModalOpen}
          onClose={() => {
            setIsNcvtModalOpen(false);
            setSelectedNcvtCandidate(null);
          }}
        />
      )}

      {selectedOfferCandidate && (
        <DigitalOfferModal
          candidate={selectedOfferCandidate}
          isOpen={isOfferModalOpen}
          onClose={() => {
            setIsOfferModalOpen(false);
            setSelectedOfferCandidate(null);
          }}
          onIssueOffer={handleIssueOffer}
          employer={employerProfile}
        />
      )}

      {selectedVideoCandidate && (
        <PracticalVideoModal
          candidate={selectedVideoCandidate}
          isOpen={isVideoModalOpen}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedVideoCandidate(null);
          }}
        />
      )}

      <TakeHomeCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        lang={currentLang}
      />

      <WhistleblowerModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        lang={currentLang}
        prefilledCompany={reportPrefilledCompany}
      />

      <SmartTradeProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        lang={currentLang}
        onProfileCreated={handleProfileCreated}
      />

      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
        employer={employerProfile}
      />

      <NcvtSearchModal
        isOpen={isNcvtSearchOpen}
        onClose={() => setIsNcvtSearchOpen(false)}
        candidates={candidates}
        onSelectCandidate={(c) => {
          setIsNcvtSearchOpen(false);
          handleInspectCertificate(c);
        }}
      />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
