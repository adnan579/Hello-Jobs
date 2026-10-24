import {
  JobListing,
  CandidateProfile,
  EmployerFactoryProfile,
  JobApplication,
  OfferLetter,
  WhistleblowerReport,
  AuthSession,
  DpdpConsentSettings,
  DpdpNominee,
  DpdpGrievanceTicket,
  DpdpAuditLog,
  ServerSession,
  NotificationEvent,
  VerificationRecord,
  CreditLedgerEntry,
  HiringDrive,
  RetentionCheckIn,
  InterviewSlot,
  OtpChannelType,
} from '../types';

export interface BootstrapPayload {
  jobs: JobListing[];
  candidates: CandidateProfile[];
  employerProfile: EmployerFactoryProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  shortlistedIds: string[];
  reports: WhistleblowerReport[];
  feeReports?: WhistleblowerReport[];
  dpdpGrievances?: DpdpGrievanceTicket[];
  dpdpAuditLogs?: DpdpAuditLog[];
  sessions?: ServerSession[];
  notifications?: NotificationEvent[];
  verificationRecords?: VerificationRecord[];
  creditLedger?: CreditLedgerEntry[];
  hiringDrives?: HiringDrive[];
  retentionCheckIns?: RetentionCheckIn[];
}

export async function fetchBootstrap(): Promise<BootstrapPayload | null> {
  try {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) return null;
    const data = (await res.json()) as BootstrapPayload;
    if (!data.feeReports && data.reports) {
      data.feeReports = data.reports;
    }
    return data;
  } catch (err) {
    console.warn('Backend bootstrap fetch error:', err);
    return null;
  }
}

// M1: 6-Digit OTP Delivery & Verification
export async function sendOtpChallengeApi(
  phone: string,
  roleOrChannel: OtpChannelType | 'worker' | 'employer' = 'whatsapp',
  channelOptional?: OtpChannelType
): Promise<{
  sent?: boolean;
  channel?: OtpChannelType;
  providerMessageId?: string;
  otpCodeForTestMode?: string;
  demoOtpCode: string;
  webOtpSmsPreview?: string;
  smsFormatPreview: string;
  error?: string;
}> {
  const channel: OtpChannelType =
    channelOptional ||
    (roleOrChannel === 'worker' || roleOrChannel === 'employer'
      ? 'whatsapp'
      : roleOrChannel);
  try {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, channel }),
    });
    const data = await res.json();
    const code = data.otpCodeForTestMode || data.demoOtpCode || '482910';
    const preview =
      data.webOtpSmsPreview ||
      data.smsFormatPreview ||
      `Your Hello Jobs verification code is ${code}.\n\n@hellojobs.in #${code}`;
    return {
      ...data,
      demoOtpCode: code,
      smsFormatPreview: preview,
    };
  } catch {
    return {
      demoOtpCode: '482910',
      smsFormatPreview:
        'Your Hello Jobs verification code is 482910.\n\n@hellojobs.in #482910',
      error: 'Network error while sending OTP',
    };
  }
}

export async function verifyOtpChallengeApi(
  phone: string,
  code: string,
  _role?: string
): Promise<{
  verified?: boolean;
  session: { sessionId: string };
  error?: string;
  failedAttempts?: number;
}> {
  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    return {
      ...data,
      session: data.session || { sessionId: `sess-${Date.now()}` },
    };
  } catch {
    return {
      session: { sessionId: `sess-${Date.now()}` },
      error: 'Network error while verifying OTP',
    };
  }
}

export async function revokeServerSessionApi(
  sessionId?: string,
  revokeAllForUserId?: string
): Promise<ServerSession[] | null> {
  try {
    const res = await fetch('/api/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, revokeAllForUserId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sessions as ServerSession[];
  } catch {
    return null;
  }
}

export async function revokeSessionsApi(
  userIdOrSessionId: string
): Promise<ServerSession[] | null> {
  return revokeServerSessionApi(undefined, userIdOrSessionId);
}

export async function loginWorkerApi(
  phone?: string,
  newCandidate?: CandidateProfile,
  deviceLabel?: string
): Promise<{
  session: AuthSession;
  candidate: CandidateProfile;
  candidates: CandidateProfile[];
  sessions?: ServerSession[];
  dpdpAuditLogs?: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch('/api/auth/worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, newCandidate, deviceLabel }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Worker auth API error:', err);
    return null;
  }
}

export async function loginEmployerApi(
  updatedEmployer?: EmployerFactoryProfile,
  deviceLabel?: string
): Promise<{
  session: AuthSession;
  employerProfile: EmployerFactoryProfile;
  sessions?: ServerSession[];
} | null> {
  try {
    const res = await fetch('/api/auth/employer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updatedEmployer, deviceLabel }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Employer auth API error:', err);
    return null;
  }
}

export async function createCandidateApi(
  candidate: CandidateProfile
): Promise<CandidateProfile[] | null> {
  try {
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates as CandidateProfile[];
  } catch (err) {
    console.warn('Create candidate API error:', err);
    return null;
  }
}

export async function updateCandidateApi(
  candidate: CandidateProfile
): Promise<CandidateProfile[] | null> {
  try {
    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates as CandidateProfile[];
  } catch (err) {
    console.warn('Update candidate API error:', err);
    return null;
  }
}

export async function createJobApi(job: JobListing): Promise<JobListing[] | null> {
  try {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.jobs as JobListing[];
  } catch (err) {
    console.warn('Create job API error:', err);
    return null;
  }
}

export async function updateJobApi(job: JobListing): Promise<JobListing[] | null> {
  try {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.jobs as JobListing[];
  } catch (err) {
    console.warn('Update job API error:', err);
    return null;
  }
}

export async function createApplicationApi(
  application: JobApplication
): Promise<{
  applications: JobApplication[];
  jobs: JobListing[];
  employerProfile?: EmployerFactoryProfile;
  notifications?: NotificationEvent[];
} | null> {
  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Create application API error:', err);
    return null;
  }
}

export async function updateApplicationStatusApi(
  appId: string,
  status: JobApplication['status'],
  options?: {
    actorRole?: 'worker' | 'employer' | 'system';
    actorName?: string;
    note?: string;
    interviewSlot?: InterviewSlot;
    recruiterPrivateNote?: string;
    employerPrivateNotes?: string;
    declineOrRejectReason?: string;
    workerConfirmedJoining?: boolean;
  }
): Promise<JobApplication[] | null> {
  try {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        recruiterPrivateNote:
          options?.recruiterPrivateNote ?? options?.employerPrivateNotes,
        ...(options || {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.applications as JobApplication[];
  } catch (err) {
    console.warn('Update application status API error:', err);
    return null;
  }
}

export async function createOfferApi(
  offer: OfferLetter
): Promise<{
  offers: OfferLetter[];
  applications: JobApplication[];
  notifications?: NotificationEvent[];
} | null> {
  try {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Create offer API error:', err);
    return null;
  }
}

export async function updateOfferStatusApi(
  offerId: string,
  status: OfferLetter['status'],
  declineReason?: string,
  workerConfirmedJoining?: boolean
): Promise<{
  offers: OfferLetter[];
  applications: JobApplication[];
  notifications?: NotificationEvent[];
} | null> {
  try {
    const res = await fetch(`/api/offers/${offerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, declineReason, workerConfirmedJoining }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Update offer status API error:', err);
    return null;
  }
}

export async function updateEmployerApi(
  employer: EmployerFactoryProfile
): Promise<EmployerFactoryProfile | null> {
  try {
    const res = await fetch('/api/employer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employer),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.employerProfile as EmployerFactoryProfile;
  } catch (err) {
    console.warn('Update employer API error:', err);
    return null;
  }
}

export async function toggleShortlistApi(
  candidateId: string
): Promise<string[] | null> {
  try {
    const res = await fetch('/api/employer/shortlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.shortlistedIds as string[];
  } catch (err) {
    console.warn('Toggle shortlist API error:', err);
    return null;
  }
}

// M7 & M12: Unlock Candidate Phone & Purchase Credits
export async function unlockCandidateContactApi(candidateId: string): Promise<{
  employerProfile: EmployerFactoryProfile;
  creditLedger: CreditLedgerEntry[];
  notifications?: NotificationEvent[];
  error?: string;
} | null> {
  try {
    const res = await fetch('/api/credits/unlock-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function purchaseCreditPackApi(
  packOrCredits: 'PACK_10' | 'PACK_25' | 'PACK_100' | number,
  amountInr?: number,
  packName?: string
): Promise<{
  employerProfile: EmployerFactoryProfile;
  creditLedger: CreditLedgerEntry[];
  invoiceNo?: string;
} | null> {
  try {
    let creditsToAdd = 10;
    let totalInr = 1179;
    let label = 'Starter Shift Pack (10 Credits)';

    if (typeof packOrCredits === 'string') {
      if (packOrCredits === 'PACK_25') {
        creditsToAdd = 25;
        totalInr = 2359;
        label = 'Plant Growth Pack (25 Credits)';
      } else if (packOrCredits === 'PACK_100') {
        creditsToAdd = 100;
        totalInr = 7079;
        label = 'Multi-Plant Enterprise (100 Credits)';
      }
    } else {
      creditsToAdd = packOrCredits;
      totalInr = amountInr || 1179;
      label = packName || `${creditsToAdd} Hunt Credits Pack`;
    }

    const res = await fetch('/api/credits/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creditsToAdd,
        amountInr: totalInr,
        packName: label,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// M9 & M10: Admin Verification & Fee Report Moderation
export async function adminVerifyRecordApi(
  recordId: string,
  status: 'VERIFIED' | 'REJECTED' | 'Verified' | 'Rejected',
  reviewerOrReason?: string,
  reviewerNotes?: string
): Promise<{
  verificationRecords: VerificationRecord[];
  candidates: CandidateProfile[];
  employerProfile: EmployerFactoryProfile;
} | null> {
  try {
    const normalizedStatus =
      status.toUpperCase() === 'VERIFIED' ? 'VERIFIED' : 'REJECTED';
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId,
        status: normalizedStatus,
        reviewer: reviewerNotes || reviewerOrReason || 'Admin Verifier',
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const verifyRecordApi = adminVerifyRecordApi;

export async function submitReportApi(
  report: WhistleblowerReport
): Promise<WhistleblowerReport[] | null> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reports as WhistleblowerReport[];
  } catch (err) {
    console.warn('Submit report API error:', err);
    return null;
  }
}

export async function adminUpdateReportStatusApi(
  reportId: string,
  status: WhistleblowerReport['status'],
  outcomeNote?: string,
  pauseFactoryPostings?: boolean
): Promise<{
  reports: WhistleblowerReport[];
  jobs: JobListing[];
  dpdpAuditLogs: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, outcomeNote, pauseFactoryPostings }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateFeeReportStatusApi(
  reportId: string,
  status: WhistleblowerReport['status']
): Promise<WhistleblowerReport[] | null> {
  const res = await adminUpdateReportStatusApi(reportId, status);
  return res ? res.reports : null;
}

// M13 & M15: Hiring Drives & Retention Check-Ins
export async function createHiringDriveApi(
  drive: HiringDrive
): Promise<HiringDrive[] | null> {
  try {
    const res = await fetch('/api/drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drive),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.hiringDrives as HiringDrive[];
  } catch {
    return null;
  }
}

export async function registerForDriveApi(
  driveId: string,
  candidateId: string,
  checkInQr?: boolean
): Promise<HiringDrive[] | null> {
  try {
    const res = await fetch(`/api/drives/${driveId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, checkInQr }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.hiringDrives as HiringDrive[];
  } catch {
    return null;
  }
}

export const registerHiringDriveApi = registerForDriveApi;

export async function submitRetentionCheckInApi(
  checkIn: RetentionCheckIn
): Promise<{
  retentionCheckIns: RetentionCheckIn[];
  employerProfile: EmployerFactoryProfile;
} | null> {
  try {
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkIn),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// DPDP ACT 2023 & M2 CLIENT FUNCTIONS
export async function updateDpdpConsentApi(
  workerId: string,
  consent: DpdpConsentSettings
): Promise<{
  candidates: CandidateProfile[];
  dpdpAuditLogs: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch(`/api/dpdp/consent/${workerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consent),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Update DPDP consent API error:', err);
    return null;
  }
}

export async function updateDpdpNomineeApi(
  workerId: string,
  nominee: DpdpNominee
): Promise<{
  candidates: CandidateProfile[];
  dpdpAuditLogs: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch(`/api/dpdp/nominee/${workerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominee),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Update DPDP nominee API error:', err);
    return null;
  }
}

export async function eraseDpdpDataApi(workerId: string): Promise<{
  candidates: CandidateProfile[];
  applications: JobApplication[];
  offers: OfferLetter[];
  shortlistedIds: string[];
  dpdpAuditLogs: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch(`/api/dpdp/erase/${workerId}`, {
      method: 'DELETE',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Erase DPDP data API error:', err);
    return null;
  }
}

export async function eraseEmployerDataApi(): Promise<{
  jobs: JobListing[];
  dpdpAuditLogs: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch('/api/dpdp/erase-employer', {
      method: 'DELETE',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitDpdpGrievanceApi(
  ticket: DpdpGrievanceTicket
): Promise<{
  ticket: DpdpGrievanceTicket;
  dpdpGrievances: DpdpGrievanceTicket[];
  dpdpAuditLogs: DpdpAuditLog[];
} | null> {
  try {
    const res = await fetch('/api/dpdp/grievance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Submit DPDP grievance API error:', err);
    return null;
  }
}
