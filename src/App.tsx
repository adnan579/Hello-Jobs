/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from './types';
import {
  INITIAL_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_EMPLOYER_PROFILE,
  INITIAL_APPLICATIONS,
  INITIAL_OFFERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_VERIFICATION_RECORDS,
  INITIAL_CREDIT_LEDGER,
  INITIAL_HIRING_DRIVES,
  INITIAL_RETENTION_CHECKINS,
  INITIAL_FEE_REPORTS,
} from './data/initialData';
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
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { stopJobAudio } from './utils/audioNarrator';
import {
  fetchBootstrap,
  loginWorkerApi,
  loginEmployerApi,
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
  updateFeeReportStatusApi,
  registerHiringDriveApi,
  submitRetentionCheckInApi,
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
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('landing');
  const [currentLang, setCurrentLang] = useState<Language>('en');

  // Persistent Auth Session
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('hello_jobs_auth_v3');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Shared Backend-Synced State
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [candidates, setCandidates] =
    useState<CandidateProfile[]>(INITIAL_CANDIDATES);
  const [offers, setOffers] = useState<OfferLetter[]>(INITIAL_OFFERS);
  const [applications, setApplications] =
    useState<JobApplication[]>(INITIAL_APPLICATIONS);
  const [employerProfile, setEmployerProfile] =
    useState<EmployerFactoryProfile>(INITIAL_EMPLOYER_PROFILE);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([
    'cand-unskilled-1',
    'cand-1',
    'cand-2',
    'cand-4',
  ]);
  const [feeReports, setFeeReports] = useState<FeeReport[]>(INITIAL_FEE_REPORTS);
  const [notifications, setNotifications] = useState<NotificationEvent[]>(
    INITIAL_NOTIFICATIONS
  );
  const [verificationRecords, setVerificationRecords] = useState<
    VerificationRecord[]
  >(INITIAL_VERIFICATION_RECORDS);
  const [creditLedger, setCreditLedger] = useState<CreditLedgerEntry[]>(
    INITIAL_CREDIT_LEDGER
  );
  const [hiringDrives, setHiringDrives] = useState<HiringDrive[]>(
    INITIAL_HIRING_DRIVES
  );
  const [retentionCheckIns, setRetentionCheckIns] = useState<RetentionCheckIn[]>(
    INITIAL_RETENTION_CHECKINS
  );

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<
    'worker' | 'employer'
  >('worker');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<
    'login' | 'register'
  >('login');

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>(
    'privacy'
  );

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

  // Sync live data from the Express Backend
  const syncFromBackend = useCallback(async () => {
    const data = await fetchBootstrap();
    if (data) {
      setJobs(data.jobs);
      setCandidates(data.candidates);
      setOffers(data.offers);
      setApplications(data.applications);
      setEmployerProfile(data.employerProfile);
      setShortlistedIds(data.shortlistedIds);
      if (data.feeReports) setFeeReports(data.feeReports);
      if (data.notifications) setNotifications(data.notifications);
      if (data.verificationRecords)
        setVerificationRecords(data.verificationRecords);
      if (data.creditLedger) setCreditLedger(data.creditLedger);
      if (data.hiringDrives) setHiringDrives(data.hiringDrives);
      if (data.retentionCheckIns) setRetentionCheckIns(data.retentionCheckIns);
    }
  }, []);

  useEffect(() => {
    syncFromBackend();
    const interval = setInterval(syncFromBackend, 15000);
    return () => clearInterval(interval);
  }, [syncFromBackend]);

  useEffect(() => {
    try {
      if (authSession) {
        localStorage.setItem('hello_jobs_auth_v3', JSON.stringify(authSession));
      } else {
        localStorage.removeItem('hello_jobs_auth_v3');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [authSession]);

  const activeWorker =
    authSession?.role === 'worker'
      ? candidates.find((c) => c.id === authSession.workerId) || candidates[0]
      : undefined;

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

  // Post-Login Routing: Workers -> Job Feed ('worker'), Employers -> Employer Dashboard ('employer-profile')
  const handleLoginSuccess = async (
    session: AuthSession,
    newCandidate?: CandidateProfile,
    updatedEmployer?: EmployerFactoryProfile
  ) => {
    if (session.role === 'worker') {
      if (newCandidate) {
        setCandidates((prev) => [newCandidate, ...prev]);
      }
      setAuthSession(session);
      handleRoleChange('worker');

      const res = await loginWorkerApi(newCandidate?.phone, newCandidate);
      if (res?.candidates) {
        setCandidates(res.candidates);
      }
    } else {
      if (updatedEmployer) {
        setEmployerProfile(updatedEmployer);
      }
      setAuthSession(session);
      handleRoleChange('employer-profile');

      const res = await loginEmployerApi(updatedEmployer);
      if (res?.employerProfile) {
        setEmployerProfile(res.employerProfile);
      }
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    handleRoleChange('landing');
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

  const handleIssueOffer = async (newOffer: OfferLetter) => {
    setOffers((prev) => [newOffer, ...prev]);
    const res = await createOfferApi(newOffer);
    if (res) {
      setOffers(res.offers);
      setApplications(res.applications);
    }
  };

  const handleUpdateOfferStatus = async (
    offerId: string,
    status: OfferLetter['status'],
    declineReason?: string,
    workerConfirmedJoining?: boolean
  ) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, status, declineReason, workerConfirmedJoining }
          : o
      )
    );
    const res = await updateOfferStatusApi(
      offerId,
      status,
      declineReason,
      workerConfirmedJoining
    );
    if (res) {
      setOffers(res.offers);
      setApplications(res.applications);
    }
  };

  const handleApplyJob = async (job: JobListing) => {
    const workerToUse = activeWorker || candidates[0];
    if (!authSession) {
      setAuthSession({ role: 'worker', workerId: workerToUse.id });
    }

    const alreadyApplied = applications.some(
      (a) => a.jobId === job.id && a.candidateId === workerToUse.id
    );
    if (alreadyApplied) return;

    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      industrialHub: job.industrialHub,
      takeHomeSalary: job.takeHomeSalary,
      candidateId: workerToUse.id,
      candidateName: workerToUse.name,
      candidateTrade: workerToUse.trade,
      candidatePhone: workerToUse.phone,
      ncvtVerified: workerToUse.ncvtCertificate.isVerified,
      appliedAt: 'Just now',
      status: 'Applied',
      history: [
        {
          id: `ev-${Date.now()}`,
          toStage: 'Applied',
          actor: 'worker',
          actorName: workerToUse.name,
          note: 'Applied via 1-Tap Pay-First Job Card',
          timestamp: new Date().toLocaleString('en-IN'),
        },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);
    const res = await createApplicationApi(newApp);
    if (res) {
      setApplications(res.applications);
      setJobs(res.jobs);
    }
  };

  const handleUpdateWorker = async (updated: CandidateProfile) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    const updatedList = await updateCandidateApi(updated);
    if (updatedList) {
      setCandidates(updatedList);
    }
  };

  const handleUpdateJob = async (updatedJob: JobListing) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
    );
    const updatedList = await updateJobApi(updatedJob);
    if (updatedList) {
      setJobs(updatedList);
    }
  };

  const handleUpdateApplicationStatus = async (
    appId: string,
    status: JobApplication['status'],
    employerPrivateNotes?: string
  ) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId ? { ...a, status, employerPrivateNotes } : a
      )
    );
    const updatedList = await updateApplicationStatusApi(appId, status, {
      employerPrivateNotes,
    });
    if (updatedList) {
      setApplications(updatedList);
    }
  };

  const handleToggleShortlist = async (candidateId: string) => {
    setShortlistedIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
    const updatedShortlist = await toggleShortlistApi(candidateId);
    if (updatedShortlist) {
      setShortlistedIds(updatedShortlist);
    }
  };

  const handleUnlockCandidateContact = async (candidateId: string) => {
    const res = await unlockCandidateContactApi(candidateId);
    if (res) {
      setEmployerProfile(res.employerProfile);
      setCreditLedger(res.creditLedger);
    }
  };

  const handlePurchaseCredits = async (
    packId: 'PACK_10' | 'PACK_25' | 'PACK_100'
  ) => {
    const res = await purchaseCreditPackApi(packId);
    if (res) {
      setEmployerProfile(res.employerProfile);
      setCreditLedger(res.creditLedger);
    }
  };

  const handleVerifyRecord = async (
    id: string,
    status: 'Verified' | 'Rejected',
    reasonCode?: string,
    reviewerNotes?: string
  ) => {
    const res = await verifyRecordApi(id, status, reasonCode, reviewerNotes);
    if (res) {
      setVerificationRecords(res.verificationRecords);
      setCandidates(res.candidates);
    }
  };

  const handleUpdateFeeReportStatus = async (
    id: string,
    status: FeeReport['status']
  ) => {
    const updated = await updateFeeReportStatusApi(id, status);
    if (updated) {
      setFeeReports(updated);
    }
  };

  const handleRegisterDrive = async (driveId: string) => {
    const workerId = (activeWorker || candidates[0]).id;
    const updated = await registerHiringDriveApi(driveId, workerId);
    if (updated) {
      setHiringDrives(updated);
    }
  };

  const handleSubmitCheckIn = async (checkIn: RetentionCheckIn) => {
    const res = await submitRetentionCheckInApi(checkIn);
    if (res) {
      setRetentionCheckIns(res.retentionCheckIns);
      setEmployerProfile(res.employerProfile);
    }
  };

  const handleJobCreated = async (newJob: JobListing) => {
    setJobs((prev) => [newJob, ...prev]);
    const updatedList = await createJobApi(newJob);
    if (updatedList) {
      setJobs(updatedList);
    }
  };

  const handleProfileCreated = async (newCandidate: CandidateProfile) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setAuthSession({ role: 'worker', workerId: newCandidate.id });
    handleRoleChange('worker');
    const updatedList = await createCandidateApi(newCandidate);
    if (updatedList) {
      setCandidates(updatedList);
    }
  };

  const handleUpdateEmployerProfile = async (
    updatedEmp: EmployerFactoryProfile
  ) => {
    setEmployerProfile(updatedEmp);
    const saved = await updateEmployerApi(updatedEmp);
    if (saved) {
      setEmployerProfile(saved);
    }
  };

  const handleOpenReport = (companyName?: string) => {
    setReportPrefilledCompany(companyName || '');
    setIsReportOpen(true);
  };

  const handleEraseWorkerData = async (workerId: string) => {
    const res = await eraseDpdpDataApi(workerId);
    if (res) {
      setCandidates(res.candidates);
      setApplications(res.applications);
      setOffers(res.offers);
      setShortlistedIds(res.shortlistedIds);
    }
    if (authSession?.role === 'worker' && authSession.workerId === workerId) {
      setAuthSession(null);
      setCurrentRole('landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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
                setAuthSession({
                  role: 'employer',
                  employerId: employerProfile.id,
                });
                handleRoleChange('employer-profile');
              }
            }}
            onOpenAuthModal={() => handleOpenAuthModal('employer', 'login')}
            onOpenPostJob={() => setIsPostJobOpen(true)}
            onInspectCertificate={handleInspectCertificate}
            onOpenVideoDemo={handleOpenVideoDemo}
            onOpenIssueOffer={handleOpenIssueOffer}
          />
        )}

        {currentRole === 'worker-profile' && (
          <WorkerProfileView
            worker={activeWorker || candidates[0]}
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
            onOpenDpdpModal={() => handleOpenLegalModal('privacy')}
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
            employerProfile={employerProfile}
            applications={applications}
            offers={offers}
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
        candidates={candidates}
        employerProfile={employerProfile}
        onLoginSuccess={handleLoginSuccess}
        onOpenLegalModal={handleOpenLegalModal}
      />

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
