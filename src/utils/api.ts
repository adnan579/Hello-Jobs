import type {
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
} from '../types';

/** What the server sends for the signed-in person (or an anonymous visitor). Everything is already scoped to them. */
export interface BootstrapPayload {
  jobs: JobListing[];
  candidates: CandidateProfile[];
  employerProfile: EmployerFactoryProfile | null;
  applications: JobApplication[];
  offers: OfferLetter[];
  shortlistedIds: string[];
  reports: WhistleblowerReport[];
  feeReports?: WhistleblowerReport[];
  dpdpGrievances?: DpdpGrievanceTicket[];
  dpdpAuditLogs?: DpdpAuditLog[];
  notifications?: NotificationEvent[];
  verificationRecords?: VerificationRecord[];
  creditLedger?: CreditLedgerEntry[];
  hiringDrives?: HiringDrive[];
  retentionCheckIns?: RetentionCheckIn[];
  session: AuthSession | null;
  stats: { workers: number; factories: number; jobs: number };
  paymentsMode?: 'razorpay' | 'demo' | 'off';
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export const UNAUTHORIZED_EVENT = 'hj:unauthorized';
export const ERROR_EVENT = 'hj:error';

function announceError(message: string) {
  window.dispatchEvent(new CustomEvent(ERROR_EVENT, { detail: message }));
}

async function request<T = BootstrapPayload>(
  method: string,
  url: string,
  body?: unknown,
  opts: { quiet?: boolean } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* empty body */
    }
    if (!res.ok) {
      const error = data?.error || 'Something went wrong. Please try again.';
      if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      else if (!opts.quiet) announceError(error);
      return { ok: false, error, status: res.status };
    }
    return { ok: true, data: data as T };
  } catch {
    const error = 'No internet connection. Please check your network and try again.';
    if (!opts.quiet) announceError(error);
    return { ok: false, error, status: 0 };
  }
}

const snap = async (method: string, url: string, body?: unknown): Promise<BootstrapPayload | null> => {
  const r = await request<BootstrapPayload>(method, url, body);
  return r.ok ? normalise(r.data) : null;
};

function normalise(data: BootstrapPayload): BootstrapPayload {
  if (!data.feeReports && data.reports) data.feeReports = data.reports;
  return data;
}

// ---------- session & data ----------
export async function fetchBootstrap(): Promise<BootstrapPayload | null> {
  const r = await request<BootstrapPayload>('GET', '/api/bootstrap', undefined, { quiet: true });
  return r.ok ? normalise(r.data) : null;
}

export async function sendOtpApi(
  phone: string,
  role: 'worker' | 'employer'
): Promise<{ ok: true; demoCode?: string } | { ok: false; error: string }> {
  const r = await request<{ demoCode?: string }>('POST', '/api/otp/send', { phone, role }, { quiet: true });
  return r.ok ? { ok: true, demoCode: r.data.demoCode } : { ok: false, error: r.error };
}

export async function signInApi(body: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await request('POST', '/api/auth/verify', body, { quiet: true });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function logoutApi(): Promise<void> {
  await request('POST', '/api/auth/logout', {}, { quiet: true });
}

export async function listSessionsApi(): Promise<ServerSession[] | null> {
  const r = await request<{ sessions: ServerSession[] }>('GET', '/api/sessions', undefined, { quiet: true });
  return r.ok ? r.data.sessions : null;
}

export async function revokeSessionsApi(opts: { sessionId?: string; all?: boolean }): Promise<ServerSession[] | null> {
  const r = await request<{ sessions: ServerSession[] }>('POST', '/api/sessions/revoke', opts);
  return r.ok ? r.data.sessions : null;
}

// ---------- worker ----------
export const updateCandidateApi = (c: CandidateProfile) => snap('PUT', `/api/candidates/${c.id}`, c);
export const createCandidateApi = (c: CandidateProfile) => snap('POST', '/api/candidates', c);

// ---------- jobs, applications, offers ----------
export const createJobApi = (job: JobListing) => snap('POST', '/api/jobs', job);
export const updateJobApi = (job: JobListing) => snap('PUT', `/api/jobs/${job.id}`, job);
export const createApplicationApi = (jobId: string) => snap('POST', '/api/applications', { jobId });

export const updateApplicationStatusApi = (
  appId: string,
  status: JobApplication['status'] | undefined,
  options?: {
    note?: string;
    interviewSlot?: InterviewSlot;
    recruiterPrivateNote?: string;
    employerPrivateNotes?: string;
    declineOrRejectReason?: string;
    workerConfirmedJoining?: boolean;
  }
) => snap('PATCH', `/api/applications/${appId}`, { status, ...(options ?? {}) });

export const createOfferApi = (offer: Partial<OfferLetter> & { applicationId?: string; candidateId?: string; jobId?: string }) =>
  snap('POST', '/api/offers', {
    applicationId: offer.applicationId,
    candidateId: offer.candidateId,
    jobId: offer.jobId,
    monthlyInHand: offer.monthlyInHand,
    monthlyGross: offer.monthlyGross,
    overtimeHourlyRate: offer.overtimeHourlyRate,
    joiningDate: offer.joiningDate,
    shiftPattern: offer.shiftPattern,
    accommodationProvided: offer.accommodationProvided,
    esiPfIncluded: offer.esiPfIncluded,
    plantLocation: offer.plantLocation,
  });

export const updateOfferStatusApi = (
  offerId: string,
  status: OfferLetter['status'],
  declineReason?: string,
  workerConfirmedJoining?: boolean
) => snap('PATCH', `/api/offers/${offerId}/status`, { status, declineReason, workerConfirmedJoining });

// ---------- employer ----------
export const updateEmployerApi = (e: Partial<EmployerFactoryProfile>) => snap('PUT', '/api/employer', e);
export const toggleShortlistApi = (candidateId: string) => snap('POST', '/api/employer/shortlist/toggle', { candidateId });
export const unlockCandidateContactApi = (candidateId: string) => snap('POST', '/api/credits/unlock-candidate', { candidateId });

// ---------- payments ----------
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export async function purchaseCreditPackApi(
  packId: 'PACK_10' | 'PACK_25' | 'PACK_100',
  employer?: { companyName?: string; hrPhone?: string; hrEmail?: string }
): Promise<BootstrapPayload | null> {
  const order = await request<{
    mode: 'razorpay' | 'demo';
    orderId: string;
    razorpayOrderId?: string;
    keyId?: string;
    amountPaise: number;
    packLabel: string;
  }>('POST', '/api/credits/purchase', { packId });
  if (!order.ok) return null;
  const o = order.data;

  if (o.mode === 'demo') return snap('POST', '/api/credits/confirm', { orderId: o.orderId });

  if (!(await loadRazorpay()) || !window.Razorpay) {
    announceError('Could not open the payment window. Please check your connection.');
    return null;
  }
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: o.keyId,
      amount: o.amountPaise,
      currency: 'INR',
      order_id: o.razorpayOrderId,
      name: 'Hello Jobs',
      description: o.packLabel,
      prefill: { name: employer?.companyName, contact: employer?.hrPhone, email: employer?.hrEmail },
      theme: { color: '#0f172a' },
      handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        resolve(await snap('POST', '/api/credits/confirm', { orderId: o.orderId, ...resp }));
      },
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.open();
  });
}

// ---------- community ----------
export async function submitReportApi(report: Partial<WhistleblowerReport>): Promise<boolean> {
  const r = await request('POST', '/api/reports', {
    reportedCompany: report.reportedCompany,
    thekedarName: report.thekedarName,
    issueType: report.issueType,
    details: report.details,
    reporterPhone: report.reporterPhone,
    amountDemanded: report.amountDemanded,
  });
  return r.ok;
}

export const createHiringDriveApi = (drive: Partial<HiringDrive>) => snap('POST', '/api/drives', drive);
export const registerHiringDriveApi = (driveId: string) => snap('POST', `/api/drives/${driveId}/register`, {});
export const checkInToDriveApi = (driveId: string, body: { candidateId?: string; checkInCode?: string }) => snap('POST', `/api/drives/${driveId}/checkin`, body);
export const submitRetentionCheckInApi = (c: Partial<RetentionCheckIn>) => snap('POST', '/api/checkins', c);

// ---------- DPDP ----------
export const updateDpdpConsentApi = (workerId: string, consent: DpdpConsentSettings) => snap('PUT', `/api/dpdp/consent/${workerId}`, consent);
export const updateDpdpNomineeApi = (workerId: string, nominee: DpdpNominee) => snap('PUT', `/api/dpdp/nominee/${workerId}`, nominee);

export async function eraseDpdpDataApi(workerId: string): Promise<boolean> {
  return (await request('DELETE', `/api/dpdp/erase/${workerId}`)).ok;
}
export async function eraseEmployerDataApi(): Promise<boolean> {
  return (await request('DELETE', '/api/dpdp/erase-employer')).ok;
}

export async function submitDpdpGrievanceApi(ticket: Partial<DpdpGrievanceTicket>): Promise<{ id: string } | null> {
  const r = await request<{ ticket: { id: string } }>('POST', '/api/dpdp/grievance', {
    dataPrincipalName: ticket.dataPrincipalName,
    dataPrincipalPhone: ticket.dataPrincipalPhone,
    role: ticket.role,
    category: ticket.category,
    description: ticket.description,
  });
  return r.ok ? r.data.ticket : null;
}

export async function downloadMyDataApi(): Promise<void> {
  const res = await fetch('/api/dpdp/export', { credentials: 'same-origin' });
  if (!res.ok) return announceError('Could not prepare your data export.');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hello-jobs-my-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
