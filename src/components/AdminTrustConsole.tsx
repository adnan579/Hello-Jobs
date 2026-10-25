import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Building2,
  Video,
  CheckCircle2,
  XCircle,
  Bell,
  BarChart3,
  Scale,
  Eye,
  Clock,
  Lock,
  Search,
  Award,
  Send
} from 'lucide-react';
import {
  VerificationRecord,
  FeeReport,
  JobPosting,
  NotificationEvent,
  Candidate,
  JobApplication,
  OfferLetter
} from '../types';

interface AdminTrustConsoleProps {
  verificationRecords: VerificationRecord[];
  feeReports: FeeReport[];
  jobs: JobPosting[];
  notifications: NotificationEvent[];
  candidates: Candidate[];
  applications: JobApplication[];
  offers: OfferLetter[];
  onVerifyRecord: (id: string, status: 'VERIFIED' | 'REJECTED', reasonCode?: string, reviewerNotes?: string) => Promise<void>;
  onUpdateReportStatus: (id: string, status: NonNullable<FeeReport['status']>, opts?: { pauseFactory?: boolean; resumeFactory?: boolean }) => Promise<void>;
  adminRole?: 'Verifier' | 'Support' | 'Trust & Safety';
  onViewAsUser: (role: 'worker' | 'employer') => void;
  initialTab?: 'verification' | 'safety' | 'outbox' | 'analytics' | 'legal';
}

export const AdminTrustConsole: React.FC<AdminTrustConsoleProps> = ({
  verificationRecords,
  feeReports,
  jobs,
  notifications,
  candidates,
  applications,
  offers,
  onVerifyRecord,
  onUpdateReportStatus,
  onViewAsUser,
  adminRole = 'Trust & Safety',
  initialTab = 'verification',
}) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'safety' | 'outbox' | 'analytics' | 'legal'>(initialTab);
  const [legalLang, setLegalLang] = useState<'en' | 'hi'>('en');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [reviewerNote, setReviewerNote] = useState<Record<string, string>>({});
  const kyb = verificationRecords.filter(r => r.kind === 'FACTORY_GSTIN_KYB');
  const registered = candidates.length;
  const pct = (n: number) => (registered > 0 ? Math.round((n / registered) * 100) : null);
  const appliedWorkers = new Set(applications.map(a => a.candidateId)).size;
  const offered = new Set(offers.map(o => o.candidateId)).size;
  const joined = new Set(applications.filter(a => a.status === 'Joined').map(a => a.candidateId)).size;
  const funnel = [
    { stage: '1. Registered (OTP verified)', count: registered, pct: registered > 0 ? 100 : null },
    { stage: '2. Applied to a job', count: appliedWorkers, pct: pct(appliedWorkers) },
    { stage: '3. Received an offer', count: offered, pct: pct(offered) },
    { stage: '4. Joined', count: joined, pct: pct(joined) },
  ];

  const flaggedJobs = jobs.filter(j => j.moderationStatus === 'AutoScreenedFlagged' || (j.flaggedKeywords && j.flaggedKeywords.length > 0));

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Staff console
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                No Aadhaar stored
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Verification, Trust & Safety & Legal Center
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Factory GSTIN checks, worker certificate and video review, fee-complaint handling and legal notices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300">
              Signed in as {adminRole}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewAsUser('worker')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                title="Read-only View As Worker (M10)"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                View as Worker
              </button>
              <button
                onClick={() => onViewAsUser('employer')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                title="Read-only View As Employer (M10)"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                View as Factory
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
          {[
            { id: 'verification', label: 'Verification queue', icon: FileCheck2, count: verificationRecords.filter(r => r.status === 'PENDING' || r.status === 'UnderReview').length },
            { id: 'safety', label: 'Trust & safety', icon: ShieldCheck, count: feeReports.filter(f => f.status !== 'Resolved').length + flaggedJobs.length },
            { id: 'outbox', label: 'Notifications', icon: Bell, count: notifications.length },
            { id: 'analytics', label: 'Funnels', icon: BarChart3 },
            { id: 'legal', label: 'Legal notices', icon: Scale },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs tabular-nums ${
                      active ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: M9 Verification Queue */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* GSTIN KYB: honest manual-check instructions (no registry API is integrated) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                How to verify a factory (manual KYB)
              </h2>
              <ol className="list-decimal list-inside text-xs text-slate-300 mt-2 space-y-1">
                <li>
                  Open the official{' '}
                  <a className="text-amber-300 underline" href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noopener noreferrer">
                    GST portal "Search Taxpayer"
                  </a>{' '}
                  page and search the GSTIN shown on the record below.
                </li>
                <li>Confirm the legal / trade name matches the company name and that the GSTIN status is Active.</li>
                <li>Only then press Approve. If it does not match, or is cancelled, press Reject and write the reason.</li>
              </ol>
              <p className="text-xs text-slate-500 mt-2">
                The server has already checked the GSTIN format and checksum. It does not call any government API.
              </p>
            </div>

            {/* Unified VerificationRecord Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Verification queue ({verificationRecords.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reviews GSTIN KYB, NCVT/Skill India certificates (DigiLocker or manual upload), and 30-second shop-floor skill videos.
                  </p>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold">
                  No Aadhaar Stored (M9 Compliant)
                </span>
              </div>

              <div className="space-y-4">
                {verificationRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-amber-300 border border-slate-700">
                          {rec.kind}
                        </span>
                        <span className="text-sm font-bold text-white">{rec.subjectName}</span>
                        <span className="text-xs text-slate-400 tabular-nums">({rec.subjectType} · {rec.subjectId})</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            (rec.status === 'VERIFIED' || rec.status === 'Verified')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : (rec.status === 'REJECTED' || rec.status === 'Rejected')
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Document / Credential Number: <strong className="text-white tabular-nums">{rec.documentNumber}</strong> · Submitted: {rec.submittedAt}
                      </p>
                      {rec.evidenceLabel && (
                        <p className="text-xs text-blue-300 flex items-center gap-1.5">
                          {rec.kind === 'SKILL_VIDEO' ? <Video className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                          Evidence: {rec.evidenceLabel}
                        </p>
                      )}
                      {rec.reviewerNotes && (
                        <p className="text-xs text-slate-400 italic">Reviewer Note: {rec.reviewerNotes}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reviewer note / reason code..."
                        value={reviewerNote[rec.id] || ''}
                        onChange={e => setReviewerNote(prev => ({ ...prev, [rec.id]: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => onVerifyRecord(rec.id, 'VERIFIED', undefined, reviewerNote[rec.id] || 'Verified via Registry/NCVT check')}
                        className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          onVerifyRecord(
                            rec.id,
                            'REJECTED',
                            rejectReason[rec.id] || 'DOC_UNREADABLE_OR_MISMATCH',
                            reviewerNote[rec.id] || 'Please re-upload clear certificate'
                          )
                        }
                        className="px-3.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Trust & safety */}
        {activeTab === 'safety' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Whistleblower Fee Reports */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Zero-Fee Whistleblower Queue ({feeReports.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Investigate illegal registration/gate-pass fee demands and pause offending factory accounts.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {feeReports.map(rep => {
                  const compName = rep.companyName || rep.reportedCompany;
                  const isPaused = rep.status === 'Confirmed — Factory Paused';
                  return (
                    <div key={rep.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{compName}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            rep.status === 'Resolved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{rep.description || rep.details}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400 tabular-nums">
                        <span>{typeof rep.amountDemanded === 'number' ? `Demanded: ₹${rep.amountDemanded.toLocaleString('en-IN')}` : 'Amount not stated'}</span>
                        <span>Reported: {rep.timestamp}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => onUpdateReportStatus(rep.id, 'Under Investigation')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                        >
                          Mark Investigating
                        </button>
                        <button
                          onClick={() => onUpdateReportStatus(rep.id, 'Resolved')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                        >
                          Resolve Case
                        </button>
                        <button
                          onClick={() =>
                            isPaused
                              ? onUpdateReportStatus(rep.id, 'Resolved', { resumeFactory: true })
                              : onUpdateReportStatus(rep.id, 'Confirmed — Factory Paused', { pauseFactory: true })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ml-auto ${
                            isPaused
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-red-500 text-white hover:bg-red-400'
                          }`}
                        >
                          {isPaused ? 'Resume Factory' : 'Confirm & Pause Factory'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-Screened Job Posts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Automated Job Post Keyword Screening (M10)
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Every new job post is automatically scanned for illegal fee keywords ("registration fee", "security deposit", "training charge") and minimum wage floor compliance.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Active Blocked Keyword Rules
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'registration fee',
                    'security deposit',
                    'gate pass charge',
                    'uniform deposit',
                    'training fee',
                    'commission',
                    'agent charge',
                    'processing fee',
                  ].map(kw => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium"
                    >
                      "{kw}"
                    </span>
                  ))}
                </div>
              </div>

              {flaggedJobs.length === 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">All {jobs.length} Live Job Posts Passed Automated Screening</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Zero illegal fee keywords or below-floor wage listings detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flaggedJobs.map(job => (
                    <div key={job.id} className="bg-red-950/30 border border-red-500/40 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{job.role} · {job.companyName}</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-bold">
                          Flagged
                        </span>
                      </div>
                      <p className="text-xs text-red-200 mt-1">
                        Triggers: {(job.flaggedKeywords || []).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: M8 Multi-Channel Notification Outbox */}
        {activeTab === 'outbox' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Notifications sent
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stage changes, interview invites and digital offers delivered to workers and factories inside the app.
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Showing in-app notifications. WhatsApp delivery is sent only for login codes.
              </div>
            </div>

            <div className="space-y-3">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-amber-300 text-xs font-bold">
                        {n.channel}
                      </span>
                      {n.templateName && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-xs tabular-nums">
                          Template: {n.templateName}
                        </span>
                      )}
                      <span className="text-sm font-bold text-white">{n.title}</span>
                    </div>
                    <p className="text-xs text-slate-300">{n.body}</p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      Recipient: {n.recipientRole} ({n.recipientId}) · Created: {n.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                        n.status === 'QueuedQuietHours'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      {n.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Real platform counts (no benchmarks or projections are shown) */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-1">Worker hiring funnel</h3>
              <p className="text-xs text-slate-400 mb-4">Live counts from the database. Percentages are relative to registered workers.</p>
              <div className="space-y-3">
                {funnel.map(item => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.stage}</span>
                      <span className="text-amber-300 font-bold tabular-nums">{item.count}{item.pct !== null ? ` (${item.pct}%)` : ''}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.pct ?? 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-1">Factory verification</h3>
              <p className="text-xs text-slate-400 mb-4">GSTIN checks submitted by factories.</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Pending', value: kyb.filter(r => r.status === 'PENDING' || r.status === 'UnderReview').length },
                  { label: 'Verified', value: kyb.filter(r => r.status === 'VERIFIED' || r.status === 'Verified').length },
                  { label: 'Rejected', value: kyb.filter(r => r.status === 'REJECTED' || r.status === 'Rejected').length },
                ].map(c => (
                  <div key={c.label} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-2xl font-extrabold text-white tabular-nums">{c.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">Live job posts visible to workers: <strong className="text-white tabular-nums">{jobs.length}</strong></p>
            </div>
          </div>
        )}

        {/* TAB 5: M2 Public Legal, Privacy, Terms & Grievance Officer */}
        {activeTab === 'legal' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">
                  M2 Public Privacy Notice, Zero-Fee Terms & Grievance Officer
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plain-language DPDP Act 2023 notice in English and Hindi (देवनागरी) · Policy Version v2026.11
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLegalLang('en')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                    legalLang === 'en' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLegalLang('hi')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                    legalLang === 'hi' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {legalLang === 'en' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    1. Privacy Notice (/privacy)
                  </h3>
                  <p>
                    <strong>Data Fiduciary:</strong> Hello Jobs Industrial Employment Platform (India).
                  </p>
                  <p>
                    <strong>What We Collect:</strong> Mobile number (verified via 6-digit OTP), trade skill profile, NCVT/ITI certificate number, optional 30s machine demo video, and factory GSTIN for employers.
                  </p>
                  <p>
                    <strong>What We NEVER Collect:</strong> We never collect or store Aadhaar numbers or biometric data.
                  </p>
                  <p>
                    <strong>Phone Number Masking:</strong> Your mobile number is masked (<span className="tabular-nums">+91 98•••••210</span>) in employer search results and on public QR Trade Cards until you apply to a job or an employer spends 1 Hunt Credit to invite you.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    2. Terms & 18+ Factory Rule (/terms)
                  </h3>
                  <p>
                    <strong>18+ Age Requirement:</strong> Under the Factories Act, 1948 & Child and Adolescent Labour Act, all workers registering for hazardous shop-floor, CNC, welding, press, or foundry operations must confirm they are 18 years of age or older.
                  </p>
                  <p>
                    <strong>100% Zero Worker Fee Guarantee:</strong> Employers and contractors are strictly prohibited from demanding registration fees, gate-pass charges, or security deposits.
                  </p>
                  <p>
                    <strong>Locked Pay Promise:</strong> Factories cannot issue a Digital Offer Letter with a lower monthly in-hand wage than advertised on the job card.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    3. Grievance Officer (/grievance)
                  </h3>
                  <p>
                    <strong>Statutory Data Protection & Grievance Officer:</strong> Smt. Kavita Deshmukh (DPDP Compliance & Labour Welfare Lead)
                  </p>
                  <p>
                    <strong>Email:</strong> grievance@hellojobs.in
                  </p>
                  <p>
                    <strong>Toll-Free Worker Helpline:</strong> <span className="tabular-nums">1800-120-4355</span> (Mon–Sat, 8:00 AM – 8:00 PM IST)
                  </p>
                  <p>
                    <strong>SLA:</strong> Acknowledgement within 24 hours; resolution or account erasure within 72 hours under Section 12 of the DPDP Act 2023.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-200 leading-relaxed">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-white">1. गोपनीयता सूचना (/privacy)</h3>
                  <p>
                    <strong>हम क्या एकत्र करते हैं:</strong> केवल आपका मोबाइल नंबर (6-अंकीय OTP द्वारा सत्यापित), आपका ट्रेड कौशल (ITI/NCVT सर्टिफिकेट), और वैकल्पिक 30-सेकंड मशीन वीडियो।
                  </p>
                  <p>
                    <strong>आधार कार्ड नहीं लिया जाता:</strong> हम कभी भी आपका आधार नंबर नहीं मांगते और न ही स्टोर करते हैं।
                  </p>
                  <p>
                    <strong>फोन नंबर सुरक्षा:</strong> आपका मोबाइल नंबर हर जगह छिपा रहता है (+91 98•••••210) जब तक आप स्वयं नौकरी के लिए आवेदन न करें या फैक्ट्री आपको आमंत्रण न भेजे।
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-white">2. शर्तें और ₹0 शुल्क गारंटी (/terms)</h3>
                  <p>
                    <strong>18+ आयु घोषणा:</strong> कारखाना अधिनियम 1948 के तहत भारी मशीनरी, वेल्डिंग और शिफ्ट कार्य के लिए आपकी आयु 18 वर्ष या उससे अधिक होनी अनिवार्य है।
                  </p>
                  <p>
                    <strong>100% निःशुल्क नौकरी:</strong> किसी भी वर्कर से रजिस्ट्रेशन फीस, गेट-पास शुल्क या सिक्योरिटी डिपॉजिट मांगना सख्त गैरकानूनी है।
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-white">3. शिकायत निवारण अधिकारी (/grievance)</h3>
                  <p>
                    <strong>शिकायत अधिकारी:</strong> श्रीमती कविता देशमुख (DPDP एवं श्रमिक कल्याण प्रमुख)
                  </p>
                  <p>
                    <strong>ईमेल:</strong> grievance@hellojobs.in · <strong>हेल्पलाइन:</strong> 1800-120-4355
                  </p>
                  <p>
                    आप किसी भी समय अपने प्रोफाइल या फैक्ट्री खाते से अपना पूरा डेटा डाउनलोड (JSON) या हमेशा के लिए डिलीट कर सकते हैं।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
