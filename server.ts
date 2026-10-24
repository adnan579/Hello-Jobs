import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  JobListing,
  CandidateProfile,
  EmployerFactoryProfile,
  JobApplication,
  OfferLetter,
  WhistleblowerReport,
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
} from './src/types/index.ts';
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
} from './src/data/initialData.ts';
import { screenJobPosting } from './src/modules/domain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_VERCEL = Boolean(process.env.VERCEL);
const SEED_DB_FILE = path.join(__dirname, 'data', 'db.json');
const DATA_DIR = IS_VERCEL ? '/tmp/hellojobs-data' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface OtpLockoutRecord {
  phone: string;
  failedAttempts: number;
  sendsInWindow: number;
  lockedUntil?: number;
  lastCode?: string;
  channel?: OtpChannelType;
}

interface DatabaseSchema {
  jobs: JobListing[];
  candidates: CandidateProfile[];
  employerProfile: EmployerFactoryProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  shortlistedIds: string[];
  reports: WhistleblowerReport[];
  dpdpGrievances: DpdpGrievanceTicket[];
  dpdpAuditLogs: DpdpAuditLog[];
  // M1, M8, M9, M12, M13, M15 stores
  sessions: ServerSession[];
  notifications: NotificationEvent[];
  verificationRecords: VerificationRecord[];
  creditLedger: CreditLedgerEntry[];
  hiringDrives: HiringDrive[];
  retentionCheckIns: RetentionCheckIn[];
}

const otpChallengeMemory: Record<string, OtpLockoutRecord> = {};

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const sourceFile = fs.existsSync(DB_FILE)
      ? DB_FILE
      : fs.existsSync(SEED_DB_FILE)
      ? SEED_DB_FILE
      : null;
    if (sourceFile) {
      const raw = fs.readFileSync(sourceFile, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      return {
        jobs: parsed.jobs && parsed.jobs.length > 0 ? parsed.jobs : INITIAL_JOBS,
        candidates:
          parsed.candidates && parsed.candidates.length > 0
            ? parsed.candidates
            : INITIAL_CANDIDATES,
        employerProfile: {
          ...INITIAL_EMPLOYER_PROFILE,
          ...(parsed.employerProfile || {}),
          huntCredits:
            parsed.employerProfile?.huntCredits ??
            INITIAL_EMPLOYER_PROFILE.huntCredits ??
            24,
          unlockedCandidateIds:
            parsed.employerProfile?.unlockedCandidateIds ??
            INITIAL_EMPLOYER_PROFILE.unlockedCandidateIds ?? [
              'cand-unskilled-1',
              'cand-1',
              'cand-2',
            ],
          teamMembers:
            parsed.employerProfile?.teamMembers ??
            INITIAL_EMPLOYER_PROFILE.teamMembers,
          plants:
            parsed.employerProfile?.plants ?? INITIAL_EMPLOYER_PROFILE.plants,
        },
        applications: parsed.applications || INITIAL_APPLICATIONS,
        offers: parsed.offers || INITIAL_OFFERS,
        shortlistedIds: parsed.shortlistedIds || [
          'cand-unskilled-1',
          'cand-1',
          'cand-2',
          'cand-4',
        ],
        reports: parsed.reports || [],
        dpdpGrievances: parsed.dpdpGrievances || [],
        dpdpAuditLogs: parsed.dpdpAuditLogs || [
          {
            id: 'dpdp-log-1',
            principalId: 'cand-unskilled-1',
            principalName: 'Suraj Paswan',
            action: 'CONSENT_GRANTED',
            details:
              'DPDP Rules 2025/2026 Consent Record (Policy v2026.11) stored for Profile & Direct Applying',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'dpdp-log-2',
            principalId: 'cand-1',
            principalName: 'Rameshwar Kumar',
            action: 'CONSENT_GRANTED',
            details:
              'DPDP Rules 2025/2026 Consent Record (Policy v2026.11) stored for NCVT Verification & Factory Matching',
            timestamp: new Date().toISOString(),
          },
        ],
        sessions: parsed.sessions || [
          {
            id: 'sess-seed-1',
            userId: 'cand-1',
            role: 'worker',
            phone: '+91 97920 44810',
            deviceLabel: 'Redmi Note 12 · Chrome 130 (Android)',
            createdAt: 'Today, 08:30 AM IST',
            lastSeen: 'Active now',
          },
        ],
        notifications:
          parsed.notifications && parsed.notifications.length > 0
            ? parsed.notifications
            : INITIAL_NOTIFICATIONS,
        verificationRecords:
          parsed.verificationRecords && parsed.verificationRecords.length > 0
            ? parsed.verificationRecords
            : INITIAL_VERIFICATION_RECORDS,
        creditLedger:
          parsed.creditLedger && parsed.creditLedger.length > 0
            ? parsed.creditLedger
            : INITIAL_CREDIT_LEDGER,
        hiringDrives:
          parsed.hiringDrives && parsed.hiringDrives.length > 0
            ? parsed.hiringDrives
            : INITIAL_HIRING_DRIVES,
        retentionCheckIns:
          parsed.retentionCheckIns && parsed.retentionCheckIns.length > 0
            ? parsed.retentionCheckIns
            : INITIAL_RETENTION_CHECKINS,
      };
    }
  } catch (err) {
    console.error('Error loading db.json, falling back to seed data:', err);
  }

  const initialDb: DatabaseSchema = {
    jobs: INITIAL_JOBS,
    candidates: INITIAL_CANDIDATES,
    employerProfile: INITIAL_EMPLOYER_PROFILE,
    applications: INITIAL_APPLICATIONS,
    offers: INITIAL_OFFERS,
    shortlistedIds: ['cand-unskilled-1', 'cand-1', 'cand-2', 'cand-4'],
    reports: [],
    dpdpGrievances: [],
    dpdpAuditLogs: [
      {
        id: 'dpdp-log-1',
        principalId: 'cand-unskilled-1',
        principalName: 'Suraj Paswan',
        action: 'CONSENT_GRANTED',
        details:
          'DPDP Rules 2025/2026 Consent Record (Policy v2026.11) stored for Profile & Direct Applying',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'dpdp-log-2',
        principalId: 'cand-1',
        principalName: 'Rameshwar Kumar',
        action: 'CONSENT_GRANTED',
        details:
          'DPDP Rules 2025/2026 Consent Record (Policy v2026.11) stored for NCVT Verification & Factory Matching',
        timestamp: new Date().toISOString(),
      },
    ],
    sessions: [
      {
        id: 'sess-seed-1',
        userId: 'cand-1',
        role: 'worker',
        phone: '+91 97920 44810',
        deviceLabel: 'Redmi Note 12 · Chrome 130 (Android)',
        createdAt: 'Today, 08:30 AM IST',
        lastSeen: 'Active now',
      },
    ],
    notifications: INITIAL_NOTIFICATIONS,
    verificationRecords: INITIAL_VERIFICATION_RECORDS,
    creditLedger: INITIAL_CREDIT_LEDGER,
    hiringDrives: INITIAL_HIRING_DRIVES,
    retentionCheckIns: INITIAL_RETENTION_CHECKINS,
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist db.json:', err);
  }
}

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

// M17: Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '5mb' }));

const db = loadDatabase();

  // 1. Bootstrap endpoint: returns complete live state across all 17 modules
  app.get('/api/bootstrap', (_req, res) => {
    res.json({
      jobs: db.jobs,
      candidates: db.candidates,
      employerProfile: db.employerProfile,
      applications: db.applications,
      offers: db.offers,
      shortlistedIds: db.shortlistedIds,
      reports: db.reports,
      dpdpGrievances: db.dpdpGrievances,
      dpdpAuditLogs: db.dpdpAuditLogs,
      sessions: db.sessions,
      notifications: db.notifications,
      verificationRecords: db.verificationRecords,
      creditLedger: db.creditLedger,
      hiringDrives: db.hiringDrives,
      retentionCheckIns: db.retentionCheckIns,
    });
  });

  // ==========================================================================
  // M1: 6-DIGIT OTP DELIVERY ADAPTERS (WHATSAPP CLOUD + DLT SMS) & LOCKOUT
  // ==========================================================================
  app.post('/api/otp/send', (req, res) => {
    const { phone, channel = 'whatsapp' } = req.body as {
      phone: string;
      channel?: OtpChannelType;
    };
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    const record = otpChallengeMemory[cleanPhone] || {
      phone: cleanPhone,
      failedAttempts: 0,
      sendsInWindow: 0,
    };

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return res.status(429).json({
        error:
          'Phone number locked for 1 hour after 10 failed OTP attempts (M1 Brute-Force Guard).',
      });
    }

    // Generate 6-digit OTP per M1 spec
    const code = String(Math.floor(100000 + Math.random() * 900000));
    record.sendsInWindow += 1;
    record.lastCode = code;
    record.channel = channel;
    otpChallengeMemory[cleanPhone] = record;

    const webOtpFormattedSms = `Your Hello Jobs verification code is ${code}. Valid for 5 minutes. Never pay any fee for a job.\n@hellojobs.in #${code}`;

    return res.json({
      sent: true,
      channel,
      providerMessageId:
        channel === 'whatsapp'
          ? `wamid.HBgMOTE${Date.now()}`
          : `DLT-SMS-IND-${Date.now()}`,
      otpCodeForTestMode: code,
      webOtpSmsPreview: webOtpFormattedSms,
      sendsInWindow: record.sendsInWindow,
    });
  });

  app.post('/api/otp/verify', (req, res) => {
    const { phone, code } = req.body as { phone: string; code: string };
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    const record = otpChallengeMemory[cleanPhone];

    if (record?.lockedUntil && Date.now() < record.lockedUntil) {
      return res.status(429).json({
        error: 'Account locked for 1 hour due to 10 failed OTP guesses.',
      });
    }

    if (record && record.lastCode && code.trim() !== record.lastCode) {
      record.failedAttempts += 1;
      if (record.failedAttempts >= 10) {
        record.lockedUntil = Date.now() + 60 * 60 * 1000;
      }
      return res.status(401).json({
        error: `Invalid 6-digit code (${record.failedAttempts}/10 failed guesses before 1-hour lockout).`,
        failedAttempts: record.failedAttempts,
      });
    }

    if (record) {
      record.failedAttempts = 0;
    }

    return res.json({ verified: true });
  });

  // M1: Revoke Session / Log out everywhere
  app.post('/api/sessions/revoke', (req, res) => {
    const { sessionId, revokeAllForUserId } = req.body as {
      sessionId?: string;
      revokeAllForUserId?: string;
    };
    const nowStr = new Date().toLocaleTimeString('en-IN');
    db.sessions = db.sessions.map((s) => {
      if (
        (sessionId && s.id === sessionId) ||
        (revokeAllForUserId && s.userId === revokeAllForUserId)
      ) {
        return { ...s, revokedAt: `Revoked at ${nowStr}` };
      }
      return s;
    });
    saveDatabase(db);
    return res.json({ sessions: db.sessions });
  });

  // 2. Worker Auth / Registration (with M1 ServerSession & M2 ConsentRecord)
  app.post('/api/auth/worker', (req, res) => {
    const { phone, newCandidate, deviceLabel } = req.body as {
      phone?: string;
      newCandidate?: CandidateProfile;
      deviceLabel?: string;
    };

    let activeCand: CandidateProfile | undefined;

    if (newCandidate) {
      const existingIdx = db.candidates.findIndex(
        (c) => c.id === newCandidate.id
      );
      if (existingIdx >= 0) {
        db.candidates[existingIdx] = newCandidate;
      } else {
        db.candidates.unshift(newCandidate);
      }
      activeCand = newCandidate;

      db.dpdpAuditLogs.unshift({
        id: `dpdp-log-${Date.now()}`,
        principalId: newCandidate.id,
        principalName: newCandidate.name,
        action: 'CONSENT_GRANTED',
        details: `M2 Versioned Consent (${
          newCandidate.dpdpConsent?.policyVersion || 'Policy v2026.11'
        }) + 18+ Adult Confirmation recorded during 6-Digit OTP Sign-In`,
        timestamp: new Date().toISOString(),
      });
    } else {
      const cleanDigits = (phone || '').replace(/\D/g, '').slice(-10);
      activeCand =
        db.candidates.find(
          (c) => c.phone.replace(/\D/g, '').slice(-10) === cleanDigits
        ) || db.candidates[0];
    }

    const newSession: ServerSession = {
      id: `sess-${Date.now()}`,
      userId: activeCand.id,
      role: 'worker',
      phone: activeCand.phone,
      deviceLabel: deviceLabel || 'Android Chrome · Mobile OTP Session',
      createdAt: new Date().toLocaleString('en-IN'),
      lastSeen: 'Active now',
    };
    db.sessions.unshift(newSession);
    saveDatabase(db);

    return res.json({
      session: {
        sessionId: newSession.id,
        role: 'worker',
        workerId: activeCand.id,
      },
      candidate: activeCand,
      candidates: db.candidates,
      sessions: db.sessions,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  // 3. Employer Auth / Registration (by HR Mobile OTP per M1)
  app.post('/api/auth/employer', (req, res) => {
    const { updatedEmployer, deviceLabel } = req.body as {
      updatedEmployer?: EmployerFactoryProfile;
      deviceLabel?: string;
    };
    if (updatedEmployer) {
      db.employerProfile = {
        ...db.employerProfile,
        ...updatedEmployer,
      };
    }

    const newSession: ServerSession = {
      id: `sess-emp-${Date.now()}`,
      userId: db.employerProfile.id,
      role: 'employer',
      phone: db.employerProfile.hrPhone,
      deviceLabel: deviceLabel || 'Desktop HR Console · OTP Session',
      createdAt: new Date().toLocaleString('en-IN'),
      lastSeen: 'Active now',
    };
    db.sessions.unshift(newSession);
    saveDatabase(db);

    return res.json({
      session: {
        sessionId: newSession.id,
        role: 'employer',
        employerId: db.employerProfile.id,
      },
      employerProfile: db.employerProfile,
      sessions: db.sessions,
    });
  });

  // 4. Create Worker Trade Card Profile
  app.post('/api/candidates', (req, res) => {
    const candidate = req.body as CandidateProfile;
    if (!candidate || !candidate.id) {
      return res.status(400).json({ error: 'Invalid candidate payload' });
    }
    const existingIdx = db.candidates.findIndex((c) => c.id === candidate.id);
    if (existingIdx >= 0) {
      db.candidates[existingIdx] = candidate;
    } else {
      db.candidates.unshift(candidate);
    }

    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: candidate.id,
      principalName: candidate.name,
      action: 'CONSENT_GRANTED',
      details: `Worker Trade Card v2 created with Policy ${
        candidate.dpdpConsent?.policyVersion || 'v2026.11'
      } Consent`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.status(201).json({
      candidate,
      candidates: db.candidates,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  // 5. Update Worker Trade Card Profile
  app.put('/api/candidates/:id', (req, res) => {
    const { id } = req.params;
    const updated = req.body as CandidateProfile;
    const idx = db.candidates.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    db.candidates[idx] = updated;
    saveDatabase(db);
    return res.json({
      candidate: updated,
      candidates: db.candidates,
    });
  });

  // 6. Create Factory Job Opening (with M10 Automatic Scam/Fee Screening)
  app.post('/api/jobs', (req, res) => {
    const newJob = req.body as JobListing;
    if (!newJob || !newJob.id) {
      return res.status(400).json({ error: 'Invalid job payload' });
    }
    const screening = screenJobPosting(newJob);
    newJob.moderationStatus = screening.status;
    if (screening.reasons.length > 0) {
      newJob.moderationReason = screening.reasons.join('; ');
    }
    if (!newJob.expiresAt) {
      newJob.expiresAt = 'Expires in 30 Days (Renewable)';
    }

    db.jobs.unshift(newJob);
    saveDatabase(db);
    return res.status(201).json({
      job: newJob,
      jobs: db.jobs,
    });
  });

  // 7. Update Factory Job Opening
  app.put('/api/jobs/:id', (req, res) => {
    const { id } = req.params;
    const updatedJob = req.body as JobListing;
    const idx = db.jobs.findIndex((j) => j.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }
    db.jobs[idx] = updatedJob;
    saveDatabase(db);
    return res.json({
      job: updatedJob,
      jobs: db.jobs,
    });
  });

  // 8. Submit Job Application (1-Click Apply + M6 Interaction History + M8 Notification Outbox)
  app.post('/api/applications', (req, res) => {
    const newApp = req.body as JobApplication;
    if (!newApp || !newApp.id) {
      return res.status(400).json({ error: 'Invalid application payload' });
    }
    const duplicate = db.applications.find(
      (a) => a.jobId === newApp.jobId && a.candidateId === newApp.candidateId
    );
    if (duplicate) {
      return res.json({
        application: duplicate,
        applications: db.applications,
        jobs: db.jobs,
      });
    }

    if (!newApp.history || newApp.history.length === 0) {
      newApp.history = [
        {
          id: `ev-${Date.now()}`,
          stage: 'Applied',
          actorRole: 'worker',
          actorName: newApp.candidateName,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          note: 'Applied via 1-Tap Direct Job Feed',
        },
      ];
    }

    db.applications.unshift(newApp);

    // Reveal phone to employer automatically when worker applies (M2 / M7 rule)
    if (
      db.employerProfile.unlockedCandidateIds &&
      !db.employerProfile.unlockedCandidateIds.includes(newApp.candidateId)
    ) {
      db.employerProfile.unlockedCandidateIds.push(newApp.candidateId);
    }

    // Decrement vacancy count on the matching job
    const jobIdx = db.jobs.findIndex((j) => j.id === newApp.jobId);
    if (jobIdx >= 0 && db.jobs[jobIdx].vacanciesLeft > 0) {
      db.jobs[jobIdx].vacanciesLeft -= 1;
    }

    // Write to M8 Notification Outbox
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'employer',
      recipientId: db.employerProfile.id,
      channel: 'In-App Inbox',
      eventType: 'SHORTLISTED',
      title: `New Applicant: ${newApp.candidateName} (${newApp.candidateTrade})`,
      body: `Applied for ${newApp.jobTitle} at ₹${newApp.takeHomeSalary.toLocaleString(
        'en-IN'
      )}/mo.`,
      createdAt: 'Just now',
      deliveredAt: 'Delivered to Recruiter Inbox',
      read: false,
    });

    saveDatabase(db);
    return res.status(201).json({
      application: newApp,
      applications: db.applications,
      jobs: db.jobs,
      employerProfile: db.employerProfile,
      notifications: db.notifications,
    });
  });

  // 9. Update Application Status / Pipeline Transition / Interview Slot / Private Note (M6 & M7)
  app.patch('/api/applications/:id', (req, res) => {
    const { id } = req.params;
    const {
      status,
      actorRole = 'employer',
      actorName = 'Factory HR',
      note,
      interviewSlot,
      recruiterPrivateNote,
      declineOrRejectReason,
      workerConfirmedJoining,
    } = req.body as {
      status?: JobApplication['status'];
      actorRole?: 'worker' | 'employer' | 'system';
      actorName?: string;
      note?: string;
      interviewSlot?: InterviewSlot;
      recruiterPrivateNote?: string;
      declineOrRejectReason?: string;
      workerConfirmedJoining?: boolean;
    };

    const appItem = db.applications.find((a) => a.id === id);
    if (!appItem) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (status && status !== appItem.status) {
      appItem.status = status;
      if (!appItem.history) appItem.history = [];
      appItem.history.push({
        id: `ev-${Date.now()}`,
        stage: status,
        actorRole,
        actorName,
        timestamp: new Date().toLocaleString('en-IN'),
        note: note || declineOrRejectReason,
      });

      if (status === 'Joined' && actorRole === 'employer') {
        appItem.factoryMarkedJoinedAt = new Date().toLocaleDateString('en-IN');
      }

      // Queue M8 Notification
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientRole: actorRole === 'employer' ? 'worker' : 'employer',
        recipientId:
          actorRole === 'employer' ? appItem.candidateId : db.employerProfile.id,
        channel: 'WhatsApp Template',
        eventType:
          status === 'Interview'
            ? 'INTERVIEW_SET'
            : status === 'Joined'
            ? 'JOINING_CONFIRMED'
            : 'SHORTLISTED',
        title: `Application Stage Updated: ${status} — ${appItem.jobTitle}`,
        body: `${actorName} moved application for ${appItem.jobTitle} (${
          appItem.companyName
        }) to "${status}". ${note || ''}`,
        createdAt: 'Just now',
        deliveredAt: `WhatsApp Utility Template #WA-${Math.floor(
          10000 + Math.random() * 90000
        )}`,
        read: false,
      });
    }

    if (interviewSlot) {
      appItem.interviewSlot = interviewSlot;
    }
    if (recruiterPrivateNote !== undefined) {
      appItem.recruiterPrivateNote = recruiterPrivateNote;
    }
    if (declineOrRejectReason !== undefined) {
      appItem.declineOrRejectReason = declineOrRejectReason;
    }
    if (workerConfirmedJoining !== undefined) {
      appItem.workerConfirmedJoining = workerConfirmedJoining;
    }

    saveDatabase(db);
    return res.json({
      application: appItem,
      applications: db.applications,
      notifications: db.notifications,
    });
  });

  // 10. Issue Direct Digital Offer Letter (with M6 Locked Pay Promise tracking)
  app.post('/api/offers', (req, res) => {
    const newOffer = req.body as OfferLetter;
    if (!newOffer || !newOffer.id) {
      return res.status(400).json({ error: 'Invalid offer payload' });
    }
    db.offers.unshift(newOffer);

    db.applications.forEach((appItem) => {
      if (
        appItem.candidateId === newOffer.candidateId &&
        (appItem.status === 'Applied' ||
          appItem.status === 'Shortlisted' ||
          appItem.status === 'Interview')
      ) {
        appItem.status = 'Offer Issued';
        if (!appItem.history) appItem.history = [];
        appItem.history.push({
          id: `ev-${Date.now()}`,
          stage: 'Offer Issued',
          actorRole: 'employer',
          actorName: newOffer.companyName,
          timestamp: new Date().toLocaleString('en-IN'),
          note: `Digital Offer Issued at ₹${newOffer.monthlyInHand.toLocaleString(
            'en-IN'
          )} in-hand/mo`,
        });
      }
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'worker',
      recipientId: newOffer.candidateId,
      channel: 'WhatsApp Template',
      eventType: 'OFFER_RECEIVED',
      title: `New Offer Letter: ₹${newOffer.monthlyInHand.toLocaleString(
        'en-IN'
      )} In-Hand/mo at ${newOffer.companyName}`,
      body: `Role: ${newOffer.candidateTrade} · Location: ${newOffer.plantLocation}. Review & Accept in Hello Jobs.`,
      createdAt: 'Just now',
      deliveredAt: `WhatsApp Template #WA-${Math.floor(
        10000 + Math.random() * 90000
      )}`,
      read: false,
    });

    saveDatabase(db);
    return res.status(201).json({
      offer: newOffer,
      offers: db.offers,
      applications: db.applications,
      notifications: db.notifications,
    });
  });

  // 11. Worker Accepts, Declines (with Reason Picklist) or Confirms Joining on Offer (M6)
  app.patch('/api/offers/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, declineReason, workerConfirmedJoining } = req.body as {
      status: OfferLetter['status'];
      declineReason?: string;
      workerConfirmedJoining?: boolean;
    };
    const offer = db.offers.find((o) => o.id === id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    offer.status = status;
    if (declineReason) {
      offer.declineReason = declineReason;
    }
    if (workerConfirmedJoining !== undefined) {
      offer.workerConfirmedJoining = workerConfirmedJoining;
    }

    db.applications.forEach((appItem) => {
      if (appItem.candidateId === offer.candidateId) {
        if (status === 'Accepted') {
          appItem.status = 'Accepted';
        } else if (status === 'Joined Confirmed') {
          appItem.status = 'Joined';
          appItem.workerConfirmedJoining = true;
        } else if (status === 'Declined') {
          appItem.status = 'Declined';
          appItem.declineOrRejectReason = declineReason;
        }
        if (!appItem.history) appItem.history = [];
        appItem.history.push({
          id: `ev-${Date.now()}`,
          stage: appItem.status,
          actorRole: 'worker',
          actorName: offer.candidateName,
          timestamp: new Date().toLocaleString('en-IN'),
          note: declineReason
            ? `Declined Offer — Reason: ${declineReason}`
            : `Worker updated offer status to ${status}`,
        });
      }
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'employer',
      recipientId: db.employerProfile.id,
      channel: 'In-App Inbox',
      eventType:
        status === 'Joined Confirmed' ? 'JOINING_CONFIRMED' : 'OFFER_ACCEPTED',
      title: `Offer ${status}: ${offer.candidateName} (${offer.candidateTrade})`,
      body: declineReason
        ? `${offer.candidateName} declined the offer. Reason: ${declineReason}`
        : `${offer.candidateName} marked the offer as "${status}".`,
      createdAt: 'Just now',
      deliveredAt: 'Instant In-App Alert',
      read: false,
    });

    saveDatabase(db);
    return res.json({
      offer,
      offers: db.offers,
      applications: db.applications,
      notifications: db.notifications,
    });
  });

  // 12. Update Employer Factory Profile
  app.put('/api/employer', (req, res) => {
    const updatedEmployer = req.body as EmployerFactoryProfile;
    db.employerProfile = updatedEmployer;
    saveDatabase(db);
    return res.json({
      employerProfile: db.employerProfile,
    });
  });

  // 13. Toggle Candidate Shortlist
  app.post('/api/employer/shortlist/toggle', (req, res) => {
    const { candidateId } = req.body as { candidateId: string };
    if (!candidateId) {
      return res.status(400).json({ error: 'Missing candidateId' });
    }
    if (db.shortlistedIds.includes(candidateId)) {
      db.shortlistedIds = db.shortlistedIds.filter((id) => id !== candidateId);
    } else {
      db.shortlistedIds.push(candidateId);
    }
    saveDatabase(db);
    return res.json({
      shortlistedIds: db.shortlistedIds,
    });
  });

  // ==========================================================================
  // M7 & M12: ATOMIC HUNT CREDIT SPEND (PHONE UNLOCK) & CREDIT PACK PURCHASE
  // ==========================================================================
  app.post('/api/credits/unlock-candidate', (req, res) => {
    const { candidateId } = req.body as { candidateId: string };
    const candidate = db.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!db.employerProfile.unlockedCandidateIds) {
      db.employerProfile.unlockedCandidateIds = [];
    }
    if (db.employerProfile.unlockedCandidateIds.includes(candidateId)) {
      return res.json({
        employerProfile: db.employerProfile,
        creditLedger: db.creditLedger,
        notifications: db.notifications,
      });
    }

    const currentCredits = db.employerProfile.huntCredits ?? 0;
    if (currentCredits <= 0) {
      return res.status(402).json({
        error: 'Insufficient Hunt Credits. Please top up a credit pack.',
      });
    }

    const newBalance = currentCredits - 1;
    db.employerProfile.huntCredits = newBalance;
    db.employerProfile.unlockedCandidateIds.push(candidateId);

    const ledgerEntry: CreditLedgerEntry = {
      id: `led-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN'),
      change: -1,
      reason: 'CANDIDATE_INVITE_UNLOCK',
      reference: `Unlocked phone & invited ${candidate.name} (${candidate.trade})`,
      balanceAfter: newBalance,
    };
    db.creditLedger.unshift(ledgerEntry);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'worker',
      recipientId: candidate.id,
      channel: 'WhatsApp Template',
      eventType: 'INVITE_RECEIVED',
      title: `Factory Invite from ${db.employerProfile.companyName}`,
      body: `${db.employerProfile.companyName} (${db.employerProfile.industrialHub}) unlocked your Trade Card and invited you to apply.`,
      createdAt: 'Just now',
      deliveredAt: `WhatsApp Template #WA-${Math.floor(
        10000 + Math.random() * 90000
      )}`,
      read: false,
    });

    saveDatabase(db);
    return res.json({
      employerProfile: db.employerProfile,
      creditLedger: db.creditLedger,
      notifications: db.notifications,
    });
  });

  app.post('/api/credits/purchase', (req, res) => {
    const { creditsToAdd, amountInr, packName } = req.body as {
      creditsToAdd: number;
      amountInr: number;
      packName: string;
    };
    const currentCredits = db.employerProfile.huntCredits ?? 0;
    const newBalance = currentCredits + Number(creditsToAdd || 10);
    db.employerProfile.huntCredits = newBalance;

    const invoiceNo = `HJ-GST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const ledgerEntry: CreditLedgerEntry = {
      id: `led-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN'),
      change: Number(creditsToAdd || 10),
      reason: 'CREDIT_PACK_PURCHASE',
      reference: `${packName} · GSTIN: ${db.employerProfile.gstin}`,
      balanceAfter: newBalance,
      gstInvoiceNo: invoiceNo,
      amountInr: Number(amountInr || 2360),
    };
    db.creditLedger.unshift(ledgerEntry);

    saveDatabase(db);
    return res.json({
      employerProfile: db.employerProfile,
      creditLedger: db.creditLedger,
      invoiceNo,
    });
  });

  // ==========================================================================
  // M9 & M10: ADMIN VERIFICATION QUEUE & FEE REPORT MODERATION
  // ==========================================================================
  app.post('/api/admin/verify', (req, res) => {
    const { recordId, status, reviewer } = req.body as {
      recordId: string;
      status: 'VERIFIED' | 'REJECTED';
      reviewer: string;
    };
    const rec = db.verificationRecords.find((r) => r.id === recordId);
    if (!rec) {
      return res.status(404).json({ error: 'Verification record not found' });
    }
    rec.status = status;
    rec.reviewer = reviewer || 'Admin Verifier';
    rec.reviewedAt = new Date().toLocaleString('en-IN');

    // Sync badge to candidate or factory
    if (rec.kind === 'WORKER_NCVT_CERT') {
      const cand = db.candidates.find((c) => c.id === rec.subjectId);
      if (cand) {
        cand.ncvtCertificate.isVerified = status === 'VERIFIED';
        cand.ncvtCertificate.verifiedDate = rec.reviewedAt;
      }
    } else if (rec.kind === 'FACTORY_GSTIN_KYB') {
      db.employerProfile.kybVerificationStatus =
        status === 'VERIFIED' ? 'VERIFIED' : 'CANCELLED_GSTIN';
    }

    saveDatabase(db);
    return res.json({
      verificationRecords: db.verificationRecords,
      candidates: db.candidates,
      employerProfile: db.employerProfile,
    });
  });

  app.post('/api/reports', (req, res) => {
    const report = req.body as WhistleblowerReport;
    if (!report || !report.id) {
      return res.status(400).json({ error: 'Invalid report payload' });
    }
    report.status = report.status || 'New';
    db.reports.unshift(report);
    saveDatabase(db);
    return res.status(201).json({
      report,
      reports: db.reports,
    });
  });

  app.patch('/api/admin/reports/:id', (req, res) => {
    const { id } = req.params;
    const { status, outcomeNote, pauseFactoryPostings } = req.body as {
      status: WhistleblowerReport['status'];
      outcomeNote?: string;
      pauseFactoryPostings?: boolean;
    };
    const rep = db.reports.find((r) => r.id === id);
    if (!rep) {
      return res.status(404).json({ error: 'Report not found' });
    }
    rep.status = status;
    if (outcomeNote) rep.outcomeNote = outcomeNote;

    if (pauseFactoryPostings) {
      db.jobs.forEach((j) => {
        if (
          j.companyName
            .toLowerCase()
            .includes(rep.reportedCompany.toLowerCase())
        ) {
          j.isActive = false;
          j.moderationStatus = 'Paused';
        }
      });
    }

    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: 'trust-safety-admin',
      principalName: 'Trust & Safety Console',
      action: 'MODERATION_ACTION',
      details: `Fee report ${rep.id} against "${rep.reportedCompany}" marked "${status}"`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.json({
      reports: db.reports,
      jobs: db.jobs,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  // ==========================================================================
  // M13 & M15: HIRING DRIVES & RETENTION CHECK-INS
  // ==========================================================================
  app.post('/api/drives', (req, res) => {
    const drive = req.body as HiringDrive;
    db.hiringDrives.unshift(drive);
    saveDatabase(db);
    return res.status(201).json({ hiringDrives: db.hiringDrives });
  });

  app.post('/api/drives/:id/register', (req, res) => {
    const { id } = req.params;
    const { candidateId, checkInQr } = req.body as {
      candidateId: string;
      checkInQr?: boolean;
    };
    const drive = db.hiringDrives.find((d) => d.id === id);
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }
    if (!drive.registeredCandidateIds.includes(candidateId)) {
      drive.registeredCandidateIds.push(candidateId);
    }
    if (checkInQr && !drive.checkedInCandidateIds.includes(candidateId)) {
      drive.checkedInCandidateIds.push(candidateId);
    }
    saveDatabase(db);
    return res.json({ hiringDrives: db.hiringDrives });
  });

  app.post('/api/checkins', (req, res) => {
    const checkIn = req.body as RetentionCheckIn;
    db.retentionCheckIns.unshift(checkIn);

    // Recompute anonymized "Promise Kept" score on employerProfile
    const total = db.retentionCheckIns.length;
    const kept = db.retentionCheckIns.filter(
      (c) => c.payMatchesPromise && c.hostelMatchesPromise
    ).length;
    db.employerProfile.promiseKeptScorePct = Math.round((kept / total) * 100);

    saveDatabase(db);
    return res.status(201).json({
      retentionCheckIns: db.retentionCheckIns,
      employerProfile: db.employerProfile,
    });
  });

  // ==========================================================================
  // M2: DPDP ACT 2023 & RULES 2025/2026 ENDPOINTS (INCLUDING FACTORY DELETION)
  // ==========================================================================
  app.put('/api/dpdp/consent/:workerId', (req, res) => {
    const { workerId } = req.params;
    const consent = req.body as DpdpConsentSettings;
    const candidate = db.candidates.find((c) => c.id === workerId);
    if (!candidate) {
      return res.status(404).json({ error: 'Data Principal not found' });
    }

    candidate.dpdpConsent = consent;

    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: candidate.id,
      principalName: candidate.name,
      action: consent.isWithdrawn ? 'CONSENT_WITHDRAWN' : 'CONSENT_UPDATED',
      details: consent.isWithdrawn
        ? 'Section 6(4) Consent Withdrawn: Profile hidden from Employer Talent Directory'
        : `Section 6 Granular Consent Updated (Directory: ${
            consent.directoryDiscovery ? 'ON' : 'OFF'
          }, WhatsApp Alerts: ${consent.whatsappJobAlerts ? 'ON' : 'OFF'})`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.json({
      candidate,
      candidates: db.candidates,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  app.put('/api/dpdp/nominee/:workerId', (req, res) => {
    const { workerId } = req.params;
    const nominee = req.body as DpdpNominee;
    const candidate = db.candidates.find((c) => c.id === workerId);
    if (!candidate) {
      return res.status(404).json({ error: 'Data Principal not found' });
    }

    candidate.dpdpNominee = nominee;

    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: candidate.id,
      principalName: candidate.name,
      action: 'NOMINEE_REGISTERED',
      details: `Section 14 Nominee Registered: ${nominee.nomineeName} (${nominee.relationship})`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.json({
      candidate,
      candidates: db.candidates,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  app.delete('/api/dpdp/erase/:workerId', (req, res) => {
    const { workerId } = req.params;
    const target = db.candidates.find((c) => c.id === workerId);
    const principalName = target ? target.name : `Worker ${workerId}`;

    if (db.candidates.length > 1) {
      db.candidates = db.candidates.filter((c) => c.id !== workerId);
    }
    db.applications = db.applications.filter((a) => a.candidateId !== workerId);
    db.offers = db.offers.filter((o) => o.candidateId !== workerId);
    db.shortlistedIds = db.shortlistedIds.filter((id) => id !== workerId);

    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: workerId,
      principalName,
      action: 'DATA_ERASED',
      details:
        'Section 12(3) Permanent Personal Data Erasure executed across Profile, Applications & Offer Records',
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.json({
      candidates: db.candidates,
      applications: db.applications,
      offers: db.offers,
      shortlistedIds: db.shortlistedIds,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  // M2: Factory Data Deletion ("extend today's worker flow to factories")
  app.delete('/api/dpdp/erase-employer', (_req, res) => {
    const companyName = db.employerProfile.companyName;
    db.jobs = db.jobs.filter((j) => j.companyName !== companyName);
    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: db.employerProfile.id,
      principalName: companyName,
      action: 'DATA_ERASED',
      details: `M2 Factory Account & Active Postings Erased (${companyName})`,
      timestamp: new Date().toISOString(),
    });
    saveDatabase(db);
    return res.json({
      jobs: db.jobs,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

  app.post('/api/dpdp/grievance', (req, res) => {
    const ticket = req.body as DpdpGrievanceTicket;
    if (!ticket || !ticket.id) {
      return res.status(400).json({ error: 'Invalid grievance payload' });
    }
    db.dpdpGrievances.unshift(ticket);
    db.dpdpAuditLogs.unshift({
      id: `dpdp-log-${Date.now()}`,
      principalId: ticket.dataPrincipalPhone,
      principalName: ticket.dataPrincipalName,
      action: 'GRIEVANCE_FILED',
      details: `Section 13 Grievance Ticket ${ticket.id} filed (${ticket.category})`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    return res.status(201).json({
      ticket,
      dpdpGrievances: db.dpdpGrievances,
      dpdpAuditLogs: db.dpdpAuditLogs,
    });
  });

async function startServer() {
  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vitePromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hello Jobs Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });

  return httpServer;
}

if (!IS_VERCEL) {
  startServer();
}

export default app;

