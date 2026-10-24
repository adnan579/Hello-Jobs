export type Language = 'en' | 'hi' | 'mr' | 'ta';

export type UserRole =
  | 'landing'
  | 'worker'
  | 'employer'
  | 'worker-profile'
  | 'employer-profile'
  | 'admin';

export type WorkerSkillCategory = 'unskilled' | 'semi-skilled' | 'skilled';

export type TradeType =
  | 'Packing & Box Loading (No Certificate)'
  | 'Factory Floor Helper (No Certificate)'
  | 'Warehouse Loader / Packer'
  | 'Assembly Line Helper'
  | 'Machine Helper (Semi-Skilled)'
  | 'CNC / VMC Operator'
  | 'Fitter (Assembly & Bench)'
  | 'Welder (MIG / TIG / ARC)'
  | 'Machinist (Lathe / Milling)'
  | 'Industrial Electrician'
  | 'Wireman'
  | 'Diesel Mechanic'
  | 'Press Machine Operator'
  | 'Quality Inspector';

export type ReadinessBadge =
  | 'Mobile OTP Verified'
  | '12-Hr Shift Stamina'
  | 'Immediate Joiner'
  | 'Heavy Packing & Loading Ready'
  | 'Hostel / Outstation Ready'
  | 'Night Shift Ready';

// M1: OTP Delivery & Revocable Server Sessions
export type OtpChannelType =
  | 'whatsapp'
  | 'sms'
  | 'sms_dlt'
  | 'test_echo'
  | 'WHATSAPP_CLOUD'
  | 'DLT_SMS';

export interface ServerSession {
  id: string;
  userId: string;
  role: 'worker' | 'employer' | 'admin';
  phone: string;
  deviceLabel: string;
  createdAt: string;
  lastSeen: string;
  revokedAt?: string;
}

// M2: DPDP Rules 2025/2026 Consent Record, Policy Version & Adult Confirmation
export interface DpdpConsentSettings {
  consentArtifactId: string;
  policyVersion?: string;
  profileAndApply?: boolean;
  directoryDiscovery: boolean;
  whatsappJobAlerts: boolean;
  credentialVerification: boolean;
  marketingCommunications?: boolean;
  consentGrantedAt: string;
  adultConfirmedAt?: string;
  noticeLanguage: Language;
  isWithdrawn?: boolean;
}

export interface DpdpNominee {
  nomineeName: string;
  relationship: string;
  nomineePhone: string;
  registeredAt: string;
}

export interface DpdpGrievanceTicket {
  id: string;
  dataPrincipalName: string;
  dataPrincipalPhone: string;
  role: 'worker' | 'employer';
  category:
    | 'Unauthorized Data Sharing'
    | 'Consent Withdrawal Delay'
    | 'Data Erasure Request'
    | 'Incorrect Personal Data'
    | 'Other DPDP Right';
  description: string;
  status: 'Registered with DPO' | 'Under Investigation' | 'Resolved';
  createdAt: string;
  slaDueBy: string;
}

export interface DpdpAuditLog {
  id: string;
  principalId: string;
  principalName: string;
  action:
    | 'CONSENT_GRANTED'
    | 'CONSENT_UPDATED'
    | 'CONSENT_WITHDRAWN'
    | 'DATA_EXPORTED'
    | 'NOMINEE_REGISTERED'
    | 'DATA_ERASED'
    | 'GRIEVANCE_FILED'
    | 'SUPPORT_VIEW_AS_USER'
    | 'MODERATION_ACTION';
  details: string;
  timestamp: string;
}

export interface Facilities {
  hasHostel: boolean;
  hasSubsidizedMess: boolean;
  hasBusPickup: boolean;
  esiPfCovered: boolean;
  safetyGearProvided: boolean;
}

// M14: Required Relocation Support Block
export interface RelocationBlock {
  travelAllowance?: string;
  hostelBedsAndSharing?: string;
  hostelRentOrFree?: string;
  messCostPerMonth?: string;
  firstSalaryArrivalDay?: string;
  wageAdvanceAvailable?: boolean;
  maxAdvanceAmount?: number;
  travelTicketReimbursed?: boolean;
  supervisorLanguages?: string[];
  nearestRailwayStation?: string;
}

export interface JobListing {
  id: string;
  title: string;
  role?: string;
  trade: TradeType;
  category: WorkerSkillCategory;
  noCertificateRequired?: boolean;
  companyName: string;
  gstin: string;
  gstinVerified: boolean;
  plantId?: string;
  plantLocation: string;
  industrialHub: string;
  state: string;
  takeHomeSalary: number;
  grossSalary: number;
  overtimeHourlyRate: number;
  overtimeMultiplierLabel?: string;
  shiftPattern: string;
  facilities: Facilities;
  openingsCount: number;
  vacanciesLeft: number;
  hrContactName: string;
  hrContactPhone: string;
  whatsappApplyNumber: string;
  experienceRequired: string;
  minQualification: string;
  postedAt: string;
  expiresAt?: string;
  canteenCostPerMeal?: string;
  roomRentDeduction?: string;
  isActive?: boolean;
  clusterDistanceKm?: number;
  labourCodeBreakdown?: {
    basicAndDa: number;
    allowances: number;
    pfEmployee: number;
    esicEmployee: number;
    basicWage?: number;
    employeePf?: number;
    employeeEsic?: number;
    estimatedInHand?: number;
  };
  relocationBlock?: RelocationBlock;
  relocation?: {
    wageAdvanceAvailable: boolean;
    maxAdvanceAmount: number;
    travelTicketReimbursed: boolean;
    supervisorLanguages: string[];
    nearestRailwayStation: string;
  };
  moderationStatus?: 'Approved' | 'Flagged' | 'Paused' | 'AutoScreenedFlagged';
  moderationReason?: string;
  flaggedKeywords?: string[];
  promiseKeptScorePct?: number;
  workersFromSameStateCount?: number;
}

export type JobPosting = JobListing;

export interface NcvtCertificate {
  isVerified: boolean;
  certificateNumber: string;
  rollNumber: string;
  tradeName: string;
  itiCollege: string;
  stateDirectorate: string;
  passingYear: number;
  grade: 'A+' | 'A' | 'B';
  practicalScore: number;
  maxPracticalScore: number;
  theoryScore: number;
  maxTheoryScore: number;
  verifiedDate: string;
  verificationMethod?: 'DIGILOCKER_MSDE' | 'ADMIN_PHOTO_CHECK' | 'PENDING' | 'NONE';
}

// M4: Past Employers & Certificates on Worker Trade Card v2
export interface PastEmploymentItem {
  company?: string;
  companyName?: string;
  role: string;
  months?: number;
  durationMonths?: number;
  verifiedByEmployer?: boolean;
}

export interface CandidateProfile {
  id: string;
  name: string;
  phone: string;
  avatarSeed: string;
  trade: TradeType;
  category: WorkerSkillCategory;
  readinessBadges?: ReadinessBadge[];
  currentCity: string;
  homeState: string;
  experienceYears: number;
  machinesOperated: string[];
  ncvtCertificate: NcvtCertificate;
  hasVideoDemo: boolean;
  videoDemoTitle: string;
  videoVerificationStatus?: 'CHECKED_REAL_WORK' | 'PENDING_REVIEW' | 'NONE';
  expectedSalary: number;
  expectedPayMin?: number;
  expectedPayMax?: number;
  availableFrom?: string;
  languagesSpoken?: string[];
  pastEmployments?: PastEmploymentItem[];
  savedJobIds?: string[];
  willingToRelocate: boolean;
  immediateJoiner: boolean;
  preferredHubs: string[];
  about: string;
  // M4: Shareable Trade Card token & toggle (Never Aadhaar!)
  shareToken?: string;
  isPubliclyShareable?: boolean;
  // M13: First-Job EPFO Flag for PM Viksit Bharat Rozgar Yojana & Trade Quiz Score
  isFirstTimeEpfoMember?: boolean;
  tradeQuizScore?: number;
  adultConfirmedAt?: string;
  dpdpConsent?: DpdpConsentSettings;
  dpdpNominee?: DpdpNominee;
}

export type Candidate = CandidateProfile;

// M6: 10-Stage Pipeline & Interaction History
export type PipelineStage =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer Issued'
  | 'Accepted'
  | 'Joined'
  | 'Declined'
  | 'Rejected'
  | 'Withdrawn'
  | 'No-show';

export interface InteractionEvent {
  id: string;
  stage?: PipelineStage;
  toStage?: PipelineStage;
  actorRole?: 'worker' | 'employer' | 'system';
  actor?: 'worker' | 'employer' | 'system';
  actorName: string;
  timestamp: string;
  note?: string;
}

export interface InterviewSlot {
  date?: string;
  time?: string;
  mode: string;
  venueOrLink?: string;
  locationOrLink?: string;
  proposedTimes?: string[];
  confirmedSlot?: string;
  confirmedByWorker?: boolean;
}

export interface OfferLetter {
  id: string;
  jobId?: string;
  candidateId: string;
  candidateName: string;
  candidateTrade: TradeType;
  companyName: string;
  gstin: string;
  plantLocation: string;
  monthlyInHand: number;
  promisedJobInHand?: number; // M6: Locked Pay Promise comparison
  jobPostedInHand?: number;
  payPromiseWarning?: string;
  monthlyGross: number;
  overtimeHourlyRate: number;
  joiningDate: string;
  shiftPattern: string;
  accommodationProvided: boolean;
  esiPfIncluded: boolean;
  issuedDate: string;
  expiresAt?: string;
  versionNumber?: number;
  status: 'Issued' | 'Accepted' | 'Declined' | 'Joined Confirmed';
  declineReason?: string;
  factoryMarkedJoined?: boolean;
  workerConfirmedJoining?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  industrialHub: string;
  takeHomeSalary: number;
  candidateId: string;
  candidateName: string;
  candidateTrade: TradeType;
  candidatePhone: string;
  ncvtVerified: boolean;
  appliedAt: string;
  status: PipelineStage;
  history?: InteractionEvent[];
  interviewSlot?: InterviewSlot;
  recruiterPrivateNote?: string;
  employerPrivateNotes?: string;
  declineOrRejectReason?: string;
  factoryMarkedJoinedAt?: string;
  workerConfirmedJoining?: boolean;
}

export interface FactoryShowcaseItem {
  id: string;
  title: string;
  category:
    | 'Shop Floor'
    | 'Worker Dormitory'
    | 'Subsidized Canteen'
    | 'Safety & Medical';
  description: string;
  metricBadge: string;
}

// M7: Multi-Member Team & Multi-State Plants
export interface CompanyMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'Owner' | 'Recruiter' | 'Viewer';
  addedAt: string;
}

export interface FactoryPlant {
  id: string;
  plantName: string;
  state: string;
  industrialHub?: string;
  industrialCluster?: string;
  gstin: string;
  address: string;
  isVerified?: boolean;
}

// M12: Credit Ledger & Billing
export interface CreditLedgerEntry {
  id: string;
  timestamp: string;
  createdAt?: string;
  change: number;
  deltaCredits?: number;
  reason:
    | 'CANDIDATE_INVITE_UNLOCK'
    | 'CREDIT_PACK_PURCHASE'
    | 'PILOT_TRIAL_GRANT'
    | 'REPLACEMENT_30D_REFUND'
    | 'ADMIN_GRANT';
  reference: string;
  description?: string;
  balanceAfter: number;
  gstInvoiceNo?: string;
  gstInvoiceNumber?: string;
  amountInr?: number;
}

export interface EmployerFactoryProfile {
  id: string;
  companyName: string;
  gstin: string;
  udyamNumber: string;
  factoryLicenseNumber: string;
  hrManagerName: string;
  hrEmail: string;
  hrPhone: string;
  plantAddress: string;
  industrialHub: string;
  state: string;
  totalWorkforceCount: number;
  establishedYear: number;
  industrySector: string;
  facilities: Facilities & {
    canteenRate: string;
    hostelDetails: string;
  };
  factoryShowcase: FactoryShowcaseItem[];
  // M7 & M12 & M15 additions
  avgResponseTimeHours?: number;
  promiseKeptScorePct?: number;
  huntCredits?: number;
  unlockedCandidateIds?: string[];
  teamMembers?: CompanyMember[];
  plants?: FactoryPlant[];
  kybVerificationStatus?: 'VERIFIED' | 'PENDING' | 'CANCELLED_GSTIN';
  kybVerifiedDate?: string;
}

export type EmployerProfile = EmployerFactoryProfile;

export interface AuthSession {
  sessionId?: string;
  role: 'worker' | 'employer' | 'admin';
  workerId?: string;
  employerId?: string;
  adminRole?: 'Verifier' | 'Support' | 'Trust & Safety';
}

// M10: Enhanced Fee Report Workflow
export interface WhistleblowerReport {
  id: string;
  reportedCompany: string;
  companyName?: string;
  thekedarName: string;
  issueType:
    | 'Fee Demanded'
    | 'Wage Cut Withheld'
    | 'PF Not Deposited'
    | 'Passbook Confiscated';
  details: string;
  description?: string;
  amountDemanded?: number;
  reporterPhone: string;
  timestamp: string;
  status?:
    | 'New'
    | 'Investigating'
    | 'Under Investigation'
    | 'Confirmed — Factory Paused'
    | 'Resolved'
    | 'Dismissed';
  assignedTo?: string;
  outcomeNote?: string;
}

export type FeeReport = WhistleblowerReport;

// M8: Notification Outbox & Delivery Receipts
export interface NotificationEvent {
  id: string;
  recipientRole: 'worker' | 'employer';
  recipientId: string;
  channel: 'In-App Inbox' | 'Web Push' | 'WhatsApp Template' | 'DLT SMS';
  eventType:
    | 'INVITE_RECEIVED'
    | 'SHORTLISTED'
    | 'INTERVIEW_SET'
    | 'OFFER_RECEIVED'
    | 'OFFER_ACCEPTED'
    | 'JOINING_CONFIRMED'
    | 'VERIFICATION_RESULT';
  templateName?: string;
  title: string;
  body: string;
  createdAt: string;
  deliveredAt: string;
  status?: 'Delivered' | 'QueuedQuietHours';
  queuedForQuietHours?: boolean;
  read?: boolean;
}

// M9: Unified VerificationRecord
export interface VerificationRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectType?: string;
  kind:
    | 'FACTORY_GSTIN_KYB'
    | 'WORKER_NCVT_CERT'
    | 'WORKER_SKILL_VIDEO'
    | 'SKILL_VIDEO';
  status:
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'UnderReview'
    | 'Verified'
    | 'Rejected';
  method: 'GST_REGISTRY_LOOKUP' | 'DIGILOCKER_MSDE' | 'MANUAL_PHOTO_REVIEW';
  documentNumber?: string;
  submittedAt?: string;
  evidenceRef: string;
  evidenceLabel?: string;
  reviewer: string;
  reviewerNotes?: string;
  reviewedAt: string;
  expiresAt: string;
}

// M13: Bulk Hiring & ITI Campus Drives
export interface HiringDrive {
  id: string;
  title: string;
  companyName: string;
  itiInstituteName?: string;
  driveType: 'Walk-in Gate Drive' | 'ITI Campus Drive' | 'Virtual Audio/Video Drive';
  date: string;
  venue: string;
  venueAddress?: string;
  industrialHub: string;
  inHandSalary?: number;
  trades: TradeType[];
  targetOpenings: number;
  seatsAvailable?: number;
  registeredCandidateIds: string[];
  registeredWorkerIds?: string[];
  checkedInCandidateIds: string[];
  offersIssuedCount: number;
}

// M15: Day 1 / 7 / 30 / 90 Retention Check-Ins
export interface RetentionCheckIn {
  id: string;
  candidateId?: string;
  workerId?: string;
  candidateName?: string;
  workerName?: string;
  companyName: string;
  dayMilestone?: 1 | 7 | 30 | 90;
  milestone?: 'Day1' | 'Day7' | 'Day30' | 'Day90';
  didJoin?: boolean;
  stillEmployed?: boolean;
  payMatchesPromise?: boolean;
  promisedPayReceived?: boolean;
  hostelMatchesPromise?: boolean;
  promisedShiftHonored?: boolean;
  feedbackNote?: string;
  submittedAt: string;
}
