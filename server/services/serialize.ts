import type {
  CandidateProfile,
  EmployerFactoryProfile,
  JobListing,
  JobApplication,
  OfferLetter,
  NotificationEvent,
  CreditLedgerEntry,
  VerificationRecord,
  WhistleblowerReport,
  DpdpGrievanceTicket,
  DpdpAuditLog,
  HiringDrive,
  RetentionCheckIn,
  ServerSession,
} from '../../src/types/index.ts';
import { expiryLabel, fmtDate, fmtDateTime, relTime } from '../lib/format.ts';
import { formatPhone, maskPhone } from '../lib/phone.ts';

type Row = Record<string, any>;

export type WorkerViewer = 'self' | 'employer-unlocked' | 'employer-masked' | 'admin';

export function consentFromRow(c: Row | null | undefined): CandidateProfile['dpdpConsent'] {
  if (!c) return undefined;
  return {
    consentArtifactId: c.id,
    policyVersion: c.policy_version,
    profileAndApply: true,
    directoryDiscovery: c.directory_discovery,
    whatsappJobAlerts: c.whatsapp_job_alerts,
    credentialVerification: c.credential_verification,
    marketingCommunications: c.marketing,
    consentGrantedAt: fmtDateTime(c.created_at),
    adultConfirmedAt: c.adult_confirmed_at ? fmtDateTime(c.adult_confirmed_at) : undefined,
    noticeLanguage: c.notice_language,
    isWithdrawn: c.is_withdrawn,
  };
}

/**
 * `row` is a workers row; consent/nominee columns are joined as c_* / n_* by the loaders.
 * Server-owned facts (id, phone, verification flags, consent) always override what is stored in `data`.
 */
export function workerView(row: Row, viewer: WorkerViewer): CandidateProfile {
  const d = (row.data ?? {}) as Partial<CandidateProfile>;
  const ncvt = { ...(d.ncvtCertificate as CandidateProfile['ncvtCertificate']) };
  const verified = row.ncvt_verified === true;
  ncvt.isVerified = verified;
  ncvt.verificationMethod = verified ? ncvt.verificationMethod ?? 'ADMIN_PHOTO_CHECK' : ncvt.certificateNumber ? 'PENDING' : 'NONE';

  const badges = new Set(d.readinessBadges ?? []);
  badges.add('Mobile OTP Verified');

  const base: CandidateProfile = {
    ...(d as CandidateProfile),
    id: row.id,
    name: row.name,
    phone: viewer === 'self' || viewer === 'employer-unlocked' ? formatPhone(row.phone) : maskPhone(row.phone),
    trade: row.trade,
    category: row.category,
    currentCity: row.current_city ?? '',
    homeState: row.home_state ?? '',
    expectedSalary: row.expected_salary ?? 0,
    avatarSeed: (row.name as string).split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'WK',
    readinessBadges: [...badges] as CandidateProfile['readinessBadges'],
    ncvtCertificate: ncvt,
    videoVerificationStatus: d.hasVideoDemo ? (row.video_verified ? 'CHECKED_REAL_WORK' : 'PENDING_REVIEW') : 'NONE',
    machinesOperated: d.machinesOperated ?? [],
    preferredHubs: d.preferredHubs ?? [],
    willingToRelocate: d.willingToRelocate ?? false,
    immediateJoiner: d.immediateJoiner ?? false,
    experienceYears: d.experienceYears ?? 0,
    hasVideoDemo: d.hasVideoDemo ?? false,
    videoDemoTitle: d.videoDemoTitle ?? '',
    about: d.about ?? '',
  };

  if (viewer === 'self') {
    base.shareToken = row.share_token ?? undefined;
    base.adultConfirmedAt = row.adult_confirmed_at ? fmtDateTime(row.adult_confirmed_at) : undefined;
    base.dpdpConsent = consentFromRow(row.c_id ? { id: row.c_id, policy_version: row.c_policy_version, directory_discovery: row.c_directory_discovery, whatsapp_job_alerts: row.c_whatsapp_job_alerts, credential_verification: row.c_credential_verification, marketing: row.c_marketing, notice_language: row.c_notice_language, is_withdrawn: row.c_is_withdrawn, adult_confirmed_at: row.c_adult_confirmed_at, created_at: row.c_created_at } : null);
    base.dpdpNominee = row.n_name
      ? { nomineeName: row.n_name, relationship: row.n_relationship, nomineePhone: formatPhone(row.n_phone), registeredAt: fmtDateTime(row.n_registered_at) }
      : undefined;
  } else {
    delete base.shareToken;
    delete base.adultConfirmedAt;
    delete base.dpdpConsent;
    delete base.dpdpNominee;
    delete base.savedJobIds;
  }
  return base;
}

export const WORKER_SELECT = `
  SELECT w.*,
    COALESCE((SELECT status = 'VERIFIED' FROM verification_records v WHERE v.subject_id = w.id AND v.kind = 'WORKER_NCVT_CERT' ORDER BY v.created_at DESC LIMIT 1), false) AS ncvt_verified,
    COALESCE((SELECT status = 'VERIFIED' FROM verification_records v WHERE v.subject_id = w.id AND v.kind = 'WORKER_SKILL_VIDEO' ORDER BY v.created_at DESC LIMIT 1), false) AS video_verified,
    c.id AS c_id, c.policy_version AS c_policy_version, c.directory_discovery AS c_directory_discovery,
    c.whatsapp_job_alerts AS c_whatsapp_job_alerts, c.credential_verification AS c_credential_verification,
    c.marketing AS c_marketing, c.notice_language AS c_notice_language, c.is_withdrawn AS c_is_withdrawn,
    c.adult_confirmed_at AS c_adult_confirmed_at, c.created_at AS c_created_at,
    n.nominee_name AS n_name, n.relationship AS n_relationship, n.nominee_phone AS n_phone, n.registered_at AS n_registered_at
  FROM workers w
  LEFT JOIN LATERAL (SELECT * FROM consent_records WHERE worker_id = w.id ORDER BY created_at DESC LIMIT 1) c ON true
  LEFT JOIN nominees n ON n.worker_id = w.id`;

export function employerView(row: Row, extra: { unlockedIds: string[]; members: Row[]; promiseKeptPct?: number }): EmployerFactoryProfile {
  const d = (row.data ?? {}) as Partial<EmployerFactoryProfile>;
  return {
    ...(d as EmployerFactoryProfile),
    id: row.id,
    companyName: row.company_name,
    gstin: row.gstin ?? '',
    udyamNumber: d.udyamNumber ?? '',
    factoryLicenseNumber: d.factoryLicenseNumber ?? '',
    hrManagerName: d.hrManagerName ?? '',
    hrEmail: d.hrEmail ?? '',
    hrPhone: row.hr_phone ? formatPhone(row.hr_phone) : d.hrPhone ?? '',
    plantAddress: d.plantAddress ?? '',
    industrialHub: d.industrialHub ?? '',
    state: d.state ?? '',
    totalWorkforceCount: d.totalWorkforceCount ?? 0,
    establishedYear: d.establishedYear ?? new Date().getFullYear(),
    industrySector: d.industrySector ?? '',
    facilities: (d.facilities as EmployerFactoryProfile['facilities']) ?? {
      hasHostel: false, hasSubsidizedMess: false, hasBusPickup: false, esiPfCovered: false, safetyGearProvided: false, canteenRate: '', hostelDetails: '',
    },
    factoryShowcase: d.factoryShowcase ?? [],
    huntCredits: row.hunt_credits,
    unlockedCandidateIds: extra.unlockedIds,
    promiseKeptScorePct: extra.promiseKeptPct,
    plants: d.plants ?? [],
    teamMembers: extra.members.map((m) => ({
      id: m.account_id,
      name: m.name ?? 'Team member',
      phone: formatPhone(m.phone),
      role: m.member_role,
      addedAt: fmtDate(m.added_at),
    })),
    kybVerificationStatus: row.kyb_status,
    kybVerifiedDate: row.kyb_verified_at ? fmtDate(row.kyb_verified_at) : undefined,
  };
}

/** Public/owner/admin job card. Owner-only moderation detail is added by the caller via `owner`. */
export function jobView(row: Row, opts: { owner?: boolean; now?: Date } = {}): JobListing {
  const d = (row.data ?? {}) as Partial<JobListing>;
  const now = opts.now ?? new Date();
  const kybOk = row.kyb_status === 'VERIFIED';
  const job: JobListing = {
    ...(d as JobListing),
    id: row.id,
    title: row.title,
    trade: row.trade,
    companyName: row.company_name,
    gstin: row.gstin ?? '',
    gstinVerified: kybOk,
    state: row.state ?? d.state ?? '',
    industrialHub: row.industrial_hub ?? d.industrialHub ?? '',
    takeHomeSalary: row.take_home_salary,
    vacanciesLeft: row.vacancies_left,
    isActive: row.is_active,
    moderationStatus: row.moderation_status,
    postedAt: relTime(row.created_at, now),
    expiresAt: expiryLabel(row.expires_at, now),
    promiseKeptScorePct: row.promise_kept_pct ?? undefined,
  };
  if (opts.owner) {
    if (!kybOk) job.moderationReason = 'Not visible to workers yet: your factory (GSTIN) is still being verified.';
    else if (row.employer_paused) job.moderationReason = 'Paused by Hello Jobs Trust & Safety. Contact support.';
  } else {
    delete job.moderationReason;
    delete job.flaggedKeywords;
  }
  return job;
}

export const JOB_SELECT = `
  SELECT j.*, e.company_name, e.gstin, e.kyb_status, e.paused AS employer_paused,
    (SELECT CASE WHEN count(*) >= 3 THEN round(100.0 * count(*) FILTER (WHERE r.pay_matches_promise AND r.hostel_matches_promise) / count(*)) END
       FROM retention_checkins r WHERE r.employer_id = e.id) AS promise_kept_pct
  FROM jobs j JOIN employers e ON e.id = j.employer_id`;

export function applicationView(row: Row, viewer: 'worker' | 'employer' | 'admin'): JobApplication {
  const d = (row.data ?? {}) as Partial<JobApplication>;
  const app: JobApplication = {
    ...(d as JobApplication),
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    companyName: row.company_name,
    industrialHub: row.industrial_hub ?? '',
    takeHomeSalary: row.take_home_salary,
    candidateId: row.worker_id,
    candidateName: row.worker_name,
    candidateTrade: row.worker_trade,
    candidatePhone: viewer === 'admin' ? maskPhone(row.worker_phone) : formatPhone(row.worker_phone),
    ncvtVerified: row.ncvt_verified === true,
    appliedAt: relTime(row.created_at),
    status: row.status,
    history: d.history ?? [],
  };
  if (viewer === 'worker') {
    delete app.recruiterPrivateNote;
    delete app.employerPrivateNotes;
  }
  return app;
}

export const APPLICATION_SELECT = `
  SELECT a.*, j.title AS job_title, j.industrial_hub, j.take_home_salary, e.company_name,
         w.name AS worker_name, w.trade AS worker_trade, w.phone AS worker_phone,
         COALESCE((SELECT status = 'VERIFIED' FROM verification_records v WHERE v.subject_id = w.id AND v.kind = 'WORKER_NCVT_CERT' ORDER BY v.created_at DESC LIMIT 1), false) AS ncvt_verified
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  JOIN employers e ON e.id = a.employer_id
  JOIN workers w ON w.id = a.worker_id`;

export function offerView(row: Row): OfferLetter {
  const d = (row.data ?? {}) as Partial<OfferLetter>;
  return {
    ...(d as OfferLetter),
    id: row.id,
    jobId: row.job_id,
    candidateId: row.worker_id,
    candidateName: row.worker_name,
    candidateTrade: row.worker_trade,
    companyName: row.company_name,
    gstin: row.gstin ?? '',
    status: row.status,
    issuedDate: fmtDate(row.created_at),
  };
}

export const OFFER_SELECT = `
  SELECT o.*, a.job_id, w.name AS worker_name, w.trade AS worker_trade, e.company_name, e.gstin
  FROM offers o
  JOIN applications a ON a.id = o.application_id
  JOIN workers w ON w.id = o.worker_id
  JOIN employers e ON e.id = o.employer_id`;

export function notificationView(row: Row): NotificationEvent {
  return {
    id: row.id,
    recipientRole: row.recipient_role,
    recipientId: row.recipient_id,
    channel: 'In-App Inbox',
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    createdAt: relTime(row.created_at),
    deliveredAt: 'In your Hello Jobs inbox',
    status: 'Delivered',
    read: row.read,
  };
}

export function ledgerView(row: Row): CreditLedgerEntry {
  return {
    id: row.id,
    timestamp: fmtDateTime(row.created_at),
    createdAt: row.created_at.toISOString?.() ?? String(row.created_at),
    change: row.change,
    deltaCredits: row.change,
    reason: row.reason,
    reference: row.reference ?? '',
    description: row.reference ?? '',
    balanceAfter: row.balance_after,
    gstInvoiceNo: row.invoice_no ?? undefined,
    gstInvoiceNumber: row.invoice_no ?? undefined,
    amountInr: row.amount_inr != null ? Number(row.amount_inr) : undefined,
  };
}

export function verificationView(row: Row): VerificationRecord {
  const d = row.data ?? {};
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectType: row.subject_type,
    kind: row.kind,
    status: row.status,
    method: row.method,
    documentNumber: d.documentNumber,
    submittedAt: fmtDateTime(row.created_at),
    evidenceRef: d.evidenceRef ?? '',
    evidenceLabel: d.evidenceLabel,
    reviewer: d.reviewerName ?? '',
    reviewerNotes: d.reviewerNotes,
    reviewedAt: row.reviewed_at ? fmtDateTime(row.reviewed_at) : '',
    expiresAt: d.expiresAt ?? '',
  };
}

export function reportView(row: Row): WhistleblowerReport {
  const d = row.data ?? {};
  return {
    id: row.id,
    reportedCompany: d.reportedCompany,
    companyName: d.reportedCompany,
    thekedarName: d.thekedarName ?? '',
    issueType: d.issueType,
    details: d.details,
    description: d.details,
    amountDemanded: d.amountDemanded,
    reporterPhone: d.reporterPhone ?? '',
    timestamp: fmtDateTime(row.created_at),
    status: row.status,
    outcomeNote: d.outcomeNote,
  };
}

export function grievanceView(row: Row): DpdpGrievanceTicket {
  const d = row.data ?? {};
  return {
    id: row.id,
    dataPrincipalName: d.dataPrincipalName,
    dataPrincipalPhone: d.dataPrincipalPhone,
    role: d.role,
    category: d.category,
    description: d.description,
    status: row.status,
    createdAt: fmtDateTime(row.created_at),
    slaDueBy: fmtDate(row.sla_due_at),
  };
}

export function auditView(row: Row): DpdpAuditLog {
  return {
    id: `audit-${row.id}`,
    principalId: row.principal_id,
    principalName: row.principal_name,
    action: row.action,
    details: row.details,
    timestamp: new Date(row.created_at).toISOString(),
  };
}

export function sessionView(row: Row, currentId?: string): ServerSession {
  return {
    id: row.id,
    userId: row.account_id,
    role: row.role,
    phone: maskPhone(row.phone),
    deviceLabel: row.id === currentId ? `${row.device_label} (this device)` : row.device_label,
    createdAt: fmtDateTime(row.created_at),
    lastSeen: relTime(row.last_seen_at),
    revokedAt: row.revoked_at ? `Revoked ${fmtDateTime(row.revoked_at)}` : undefined,
  };
}

export function driveView(row: Row, opts: { owner: boolean; registered: string[]; checkedIn: string[] }): HiringDrive {
  const d = row.data ?? {};
  const drive = {
    ...d,
    id: row.id,
    companyName: row.company_name,
    registeredCandidateIds: opts.registered,
    registeredWorkerIds: opts.registered,
    checkedInCandidateIds: opts.checkedIn,
    offersIssuedCount: row.offers_issued ?? 0,
  } as HiringDrive & { checkInCode?: string };
  if (opts.owner) drive.checkInCode = row.check_in_code;
  return drive;
}

export function checkInView(row: Row): RetentionCheckIn {
  const d = row.data ?? {};
  return {
    ...d,
    id: row.id,
    candidateId: row.worker_id,
    workerId: row.worker_id,
    candidateName: row.worker_name,
    workerName: row.worker_name,
    companyName: row.company_name,
    milestone: row.milestone,
    dayMilestone: Number(String(row.milestone).replace('Day', '')) as 1 | 7 | 30 | 90,
    payMatchesPromise: row.pay_matches_promise ?? undefined,
    hostelMatchesPromise: row.hostel_matches_promise ?? undefined,
    stillEmployed: row.still_employed ?? undefined,
    submittedAt: fmtDateTime(row.created_at),
  };
}
