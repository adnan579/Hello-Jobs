/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Navbar } from './components/Navbar';
import { DualLanding } from './components/DualLanding';
import { WorkerPortal } from './components/WorkerPortal';
import { EmployerPortal } from './components/EmployerPortal';
import { WorkerProfileView } from './components/WorkerProfileView';
import { EmployerProfileView } from './components/EmployerProfileView';
import { AdminTrustConsole } from './components/AdminTrustConsole';
import { Footer } from './components/Footer';
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
  verifyRecordApi,
  adminUpdateReportStatusApi,
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
import {
  Briefcase,
  FileText,
  UserCheck,
  Bell,
  X,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('landing');
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [booting, setBooting] = useState(true);
  const [toast, setToast] = useState('');

  // Everything below is exactly what the server says this person may see.
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [employerProfile, setEmployerProfile] =
    useState<EmployerFactoryProfile>(EMPTY_EMPLOYER);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [feeReports, setFeeReports] = useState<FeeReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [verificationRecords, setVerificationRecords] = useState<
    VerificationRecord[]
  >([]);
  const [creditLedger, setCreditLedger] = useState<CreditLedgerEntry[]>([]);
  const [hiringDrives, setHiringDrives] = useState<HiringDrive[]>([]);
  const [retentionCheckIns, setRetentionCheckIns] = useState<RetentionCheckIn[]>(
    []
  );
  const [grievances, setGrievances] = useState<DpdpGrievanceTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<DpdpAuditLog[]>([]);
  const [stats, setStats] = useState({ workers: 0, factories: 0, jobs: 0 });

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<
    'worker' | 'employer' | 'admin'
  >('worker');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<
    'login' | 'register'
  >('login');

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>(
    'privacy'
  );
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

  // "#staff" opens the staff login (the admin console is not linked from the public site).
  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#staff') {
        setAuthModalInitialTab('admin');
        setAuthModalInitialMode('login');
        setIsAuthModalOpen(true);
        history.replaceState(null, '', window.location.pathname);
      }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  // Server says our session is gone (expired, revoked elsewhere): drop to the public site.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const onUnauthorized = () => {
      setAuthSession(null);
      setCurrentRole('landing');
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
      'employer-profile': 'employer',
      admin: 'admin',
    };
    const need = needs[currentRole];
    if (need && authSession?.role !== need) setCurrentRole('landing');
  }, [booting, currentRole, authSession]);

  const handleRoleChange = (role: UserRole) => {
    stopJobAudio();
    setCurrentRole(role);
    syncFromBackend();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (role === 'worker') handleRoleChange('worker');
    else if (role === 'employer') handleRoleChange('employer-profile');
    else if (role === 'admin') handleRoleChange('admin');
  };

  const handleLogout = async () => {
    await logoutApi();
    setAuthSession(null);
    setCurrentRole('landing');
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

  const handleIssueOffer = async (newOffer: OfferLetter) => {
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
      return;
    }
    await run(createOfferApi({ ...newOffer, applicationId: app.id }));
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

  const handleVerifyRecord = async (
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    reasonCode?: string,
    reviewerNotes?: string
  ) => {
    await run(verifyRecordApi(id, status, reasonCode, reviewerNotes));
  };

  const handleUpdateFeeReportStatus = async (
    id: string,
    status: NonNullable<FeeReport['status']>,
    opts?: { pauseFactory?: boolean; resumeFactory?: boolean }
  ) => {
    await run(adminUpdateReportStatusApi(id, status, undefined, opts?.pauseFactory, opts?.resumeFactory));
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
      await syncFromBackend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {toast && (
        <div
          role="alert"
          className="fixed top-3 inset-x-3 sm:left-auto sm:right-4 sm:max-w-md z-[60] flex items-start gap-2 p-3 bg-red-600 text-white text-sm font-semibold rounded-xl shadow-xl"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast('')} aria-label="Dismiss">
            <X className="w-4 h-4" />
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
        unreadNotificationsCount={notifications.length}
        onRoleChange={handleRoleChange}
        onLangChange={setCurrentLang}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenReport={() => handleOpenReport()}
        onOpenNcvtSearch={() => setIsNcvtSearchOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1">
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
            onOpenPostJob={() => setIsPostJobOpen(true)}
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
            onOpenPostJob={() => setIsPostJobOpen(true)}
            onBrowseTalent={() => handleRoleChange('employer')}
            onLogout={handleLogout}
          />
        )}

        {currentRole === 'admin' && (
          <AdminTrustConsole
            verificationRecords={verificationRecords}
            feeReports={feeReports}
            jobs={jobs}
            notifications={notifications}
            candidates={candidates}
            applications={applications}
            offers={offers}
            adminRole={authSession?.adminRole}
            onVerifyRecord={handleVerifyRecord}
            onUpdateReportStatus={handleUpdateFeeReportStatus}
            onViewAsUser={(role) =>
              handleRoleChange(role === 'worker' ? 'worker' : 'employer-profile')
            }
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950 text-slate-300 border-t border-slate-800 grid grid-cols-4 h-16"
      >
        {authSession?.role === 'employer' ? (
          <>
            <button
              onClick={() => handleRoleChange('employer-profile')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                currentRole === 'employer-profile'
                  ? 'text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleRoleChange('employer')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                currentRole === 'employer'
                  ? 'text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Candidates</span>
            </button>
            <button
              onClick={() => setIsPostJobOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-400"
            >
              <Briefcase className="w-4 h-4" />
              <span>Post Job</span>
            </button>
            <button
              onClick={() => setIsNotificationsDrawerOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-400 relative"
            >
              <Bell className="w-4 h-4" />
              <span>Alerts ({notifications.length})</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleRoleChange('worker')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                currentRole === 'worker' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Jobs Feed</span>
            </button>

            <button
              onClick={() => {
                if (authSession?.role === 'worker') {
                  handleRoleChange('worker-profile');
                } else {
                  handleOpenAuthModal('worker', 'login');
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                currentRole === 'worker-profile'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                if (authSession?.role === 'worker') {
                  handleRoleChange('worker-profile');
                } else {
                  handleOpenAuthModal('worker', 'register');
                }
              }}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-400"
            >
              <FileText className="w-4 h-4" />
              <span>
                {authSession?.role === 'worker'
                  ? `Offers (${offers.length})`
                  : 'Register'}
              </span>
            </button>

            <button
              onClick={() => setIsNotificationsDrawerOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-400 relative"
            >
              <Bell className="w-4 h-4" />
              <span>Alerts ({notifications.length})</span>
            </button>
          </>
        )}
      </nav>

      {/* In-App Notifications Drawer */}
      {isNotificationsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                  Activity & Alerts
                </span>
                <h3 className="text-sm font-extrabold">
                  Application Updates & Hiring Notifications
                </h3>
              </div>
              <button
                onClick={() => setIsNotificationsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50 border-b border-indigo-200 text-[11px] text-indigo-900 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Quiet Hours Active: Non-urgent alerts between 9:00 PM – 8:00 AM IST are delivered at 8:00 AM.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-bold text-[10px]">
                      {n.channel}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {n.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <p className="text-slate-600">{n.body}</p>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    {n.createdAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
