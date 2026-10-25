import { z } from 'zod';
import { CATEGORIES, STAGES, TRADES } from './enums.ts';
import { normalizeIndianPhone } from './phone.ts';
import { isValidGstin } from './gstin.ts';

const str = (max: number) => z.string().trim().max(max);
const reqStr = (max: number) => z.string().trim().min(1).max(max);
const money = (max = 1_000_000) => z.number().int().min(0).max(max);

export const phoneField = z
  .string()
  .transform((v, ctx) => {
    const p = normalizeIndianPhone(v);
    if (!p) ctx.addIssue({ code: 'custom', message: 'Enter a valid 10-digit Indian mobile number' });
    return p ?? '';
  });

export const gstinField = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidGstin, 'This GSTIN does not look right. Please check all 15 characters.');

export const languageField = z.enum(['en', 'hi', 'mr', 'ta']);

// ---------- Auth ----------
export const otpSendSchema = z.object({
  phone: phoneField,
  role: z.enum(['worker', 'employer', 'admin']),
});

export const workerRegistration = z.object({
  name: reqStr(80),
  trade: z.enum(TRADES),
  category: z.enum(CATEGORIES).optional(),
  currentCity: reqStr(60),
  homeState: reqStr(60),
  expectedSalary: money(300_000).optional(),
});

export const employerRegistration = z.object({
  companyName: reqStr(120),
  gstin: gstinField,
  udyamNumber: str(40).optional(),
  hrManagerName: reqStr(80),
  industrialHub: reqStr(80),
  state: str(60).optional(),
});

export const consentInput = z.object({
  directoryDiscovery: z.boolean(),
  whatsappJobAlerts: z.boolean().default(false),
  credentialVerification: z.boolean().default(true),
  marketingCommunications: z.boolean().default(false),
  noticeLanguage: languageField.default('en'),
});

export const authVerifySchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('worker'),
    phone: phoneField,
    code: z.string().trim().length(6),
    mode: z.enum(['login', 'register']),
    deviceLabel: str(120).optional(),
    adultConfirmed: z.boolean().optional(),
    termsAccepted: z.boolean().optional(),
    consent: consentInput.optional(),
    registration: workerRegistration.optional(),
  }),
  z.object({
    role: z.literal('employer'),
    phone: phoneField,
    code: z.string().trim().length(6),
    mode: z.enum(['login', 'register']),
    deviceLabel: str(120).optional(),
    adultConfirmed: z.boolean().optional(),
    termsAccepted: z.boolean().optional(),
    registration: employerRegistration.optional(),
  }),
  z.object({
    role: z.literal('admin'),
    phone: phoneField,
    code: z.string().trim().length(6),
    mode: z.literal('login').default('login'),
    deviceLabel: str(120).optional(),
  }),
]);

// ---------- Worker profile (fields a worker may edit) ----------
const ncvtSubmission = z.object({
  certificateNumber: str(40).default(''),
  rollNumber: str(40).default(''),
  tradeName: str(80).default(''),
  itiCollege: str(120).default(''),
  stateDirectorate: str(80).default(''),
  passingYear: z.number().int().min(1990).max(2100).default(2024),
  grade: z.enum(['A+', 'A', 'B']).default('A'),
  practicalScore: z.number().min(0).max(1000).default(0),
  maxPracticalScore: z.number().min(0).max(1000).default(0),
  theoryScore: z.number().min(0).max(1000).default(0),
  maxTheoryScore: z.number().min(0).max(1000).default(0),
});

const pastEmployment = z.object({
  company: str(120).optional(),
  companyName: str(120).optional(),
  role: str(80).default(''),
  months: z.number().int().min(0).max(600).optional(),
  durationMonths: z.number().int().min(0).max(600).optional(),
});

export const workerProfileInput = z.object({
  name: reqStr(80),
  trade: z.enum(TRADES),
  category: z.enum(CATEGORIES),
  currentCity: reqStr(60),
  homeState: reqStr(60),
  experienceYears: z.number().min(0).max(60).default(0),
  machinesOperated: z.array(str(80)).max(30).default([]),
  expectedSalary: money(300_000).default(0),
  expectedPayMin: money(300_000).optional(),
  expectedPayMax: money(300_000).optional(),
  availableFrom: str(40).optional(),
  languagesSpoken: z.array(str(30)).max(10).optional(),
  pastEmployments: z.array(pastEmployment).max(20).optional(),
  savedJobIds: z.array(str(60)).max(200).optional(),
  willingToRelocate: z.boolean().default(false),
  immediateJoiner: z.boolean().default(false),
  preferredHubs: z.array(str(80)).max(10).default([]),
  about: str(600).default(''),
  readinessBadges: z
    .array(z.enum(['Mobile OTP Verified', '12-Hr Shift Stamina', 'Immediate Joiner', 'Heavy Packing & Loading Ready', 'Hostel / Outstation Ready', 'Night Shift Ready']))
    .max(6)
    .optional(),
  ncvtCertificate: ncvtSubmission.optional(),
  hasVideoDemo: z.boolean().optional(),
  videoDemoTitle: str(120).optional(),
  isPubliclyShareable: z.boolean().optional(),
  isFirstTimeEpfoMember: z.boolean().optional(),
  tradeQuizScore: z.number().min(0).max(100).optional(),
});

// ---------- Employer ----------
const facilities = z.object({
  hasHostel: z.boolean().default(false),
  hasSubsidizedMess: z.boolean().default(false),
  hasBusPickup: z.boolean().default(false),
  esiPfCovered: z.boolean().default(false),
  safetyGearProvided: z.boolean().default(false),
});

export const employerProfileInput = z.object({
  companyName: reqStr(120).optional(),
  udyamNumber: str(40).optional(),
  factoryLicenseNumber: str(60).optional(),
  hrManagerName: str(80).optional(),
  hrEmail: z.union([z.literal(''), z.email().max(120)]).optional(),
  plantAddress: str(300).optional(),
  industrialHub: str(80).optional(),
  state: str(60).optional(),
  totalWorkforceCount: z.number().int().min(0).max(1_000_000).optional(),
  establishedYear: z.number().int().min(1800).max(2100).optional(),
  industrySector: str(80).optional(),
  facilities: facilities
    .extend({ canteenRate: str(60).default(''), hostelDetails: str(300).default('') })
    .optional(),
  factoryShowcase: z
    .array(
      z.object({
        id: str(60),
        title: str(120),
        category: z.enum(['Shop Floor', 'Worker Dormitory', 'Subsidized Canteen', 'Safety & Medical']),
        description: str(400),
        metricBadge: str(60),
      })
    )
    .max(20)
    .optional(),
  plants: z
    .array(
      z.object({
        id: str(60),
        plantName: str(120),
        state: str(60),
        industrialHub: str(80).optional(),
        industrialCluster: str(80).optional(),
        gstin: str(15),
        address: str(300),
      })
    )
    .max(30)
    .optional(),
  teamMembers: z
    .array(z.object({ id: str(60).optional(), name: reqStr(80), phone: str(30), email: str(120).optional(), role: z.enum(['Owner', 'Recruiter', 'Viewer']) }))
    .max(50)
    .optional(),
});

// ---------- Jobs ----------
export const jobInput = z.object({
  title: z.string().trim().min(3).max(120),
  role: str(80).optional(),
  trade: z.enum(TRADES),
  category: z.enum(CATEGORIES),
  noCertificateRequired: z.boolean().optional(),
  plantId: str(60).optional(),
  plantLocation: reqStr(160),
  industrialHub: reqStr(80),
  state: reqStr(60),
  takeHomeSalary: z.number().int().min(1000).max(500_000),
  grossSalary: z.number().int().min(0).max(1_000_000).default(0),
  overtimeHourlyRate: z.number().min(0).max(5000).default(0),
  overtimeMultiplierLabel: str(60).optional(),
  shiftPattern: str(120).default(''),
  facilities: facilities,
  openingsCount: z.number().int().min(1).max(5000),
  vacanciesLeft: z.number().int().min(0).max(5000).optional(),
  hrContactName: reqStr(80),
  hrContactPhone: str(30).default(''),
  whatsappApplyNumber: str(30).default(''),
  experienceRequired: str(80).default(''),
  minQualification: str(120).default(''),
  canteenCostPerMeal: str(60).optional(),
  roomRentDeduction: str(60).optional(),
  isActive: z.boolean().optional(),
  clusterDistanceKm: z.number().min(0).max(5000).optional(),
  labourCodeBreakdown: z
    .object({
      basicAndDa: z.number().min(0),
      allowances: z.number().min(0),
      pfEmployee: z.number().min(0),
      esicEmployee: z.number().min(0),
      basicWage: z.number().min(0).optional(),
      employeePf: z.number().min(0).optional(),
      employeeEsic: z.number().min(0).optional(),
      estimatedInHand: z.number().min(0).optional(),
    })
    .optional(),
  relocationBlock: z
    .object({
      travelAllowance: str(80).optional(),
      hostelBedsAndSharing: str(80).optional(),
      hostelRentOrFree: str(80).optional(),
      messCostPerMonth: str(80).optional(),
      firstSalaryArrivalDay: str(60).optional(),
      wageAdvanceAvailable: z.boolean().optional(),
      maxAdvanceAmount: money().optional(),
      travelTicketReimbursed: z.boolean().optional(),
      supervisorLanguages: z.array(str(30)).max(10).optional(),
      nearestRailwayStation: str(80).optional(),
    })
    .optional(),
  relocation: z
    .object({
      wageAdvanceAvailable: z.boolean(),
      maxAdvanceAmount: money(),
      travelTicketReimbursed: z.boolean(),
      supervisorLanguages: z.array(str(30)).max(10),
      nearestRailwayStation: str(80),
    })
    .optional(),
});

// ---------- Applications / offers ----------
export const applicationCreate = z.object({ jobId: reqStr(80) });

const interviewSlot = z.object({
  date: str(40).optional(),
  time: str(40).optional(),
  mode: str(60).default(''),
  venueOrLink: str(300).optional(),
  locationOrLink: str(300).optional(),
  proposedTimes: z.array(str(60)).max(10).optional(),
  confirmedSlot: str(60).optional(),
  confirmedByWorker: z.boolean().optional(),
});

export const applicationPatch = z.object({
  status: z.enum(STAGES).optional(),
  note: str(400).optional(),
  interviewSlot: interviewSlot.optional(),
  recruiterPrivateNote: str(1000).optional(),
  employerPrivateNotes: str(1000).optional(),
  declineOrRejectReason: str(300).optional(),
  workerConfirmedJoining: z.boolean().optional(),
});

export const offerCreate = z.object({
  applicationId: str(80).optional(),
  candidateId: str(80).optional(),
  jobId: str(80).optional(),
  monthlyInHand: z.number().int().min(1000).max(500_000),
  monthlyGross: z.number().int().min(0).max(1_000_000).default(0),
  overtimeHourlyRate: z.number().min(0).max(5000).default(0),
  joiningDate: reqStr(40),
  shiftPattern: str(120).default(''),
  accommodationProvided: z.boolean().default(false),
  esiPfIncluded: z.boolean().default(false),
  plantLocation: str(160).optional(),
});

export const offerStatusPatch = z.object({
  status: z.enum(['Accepted', 'Declined', 'Joined Confirmed']),
  declineReason: str(300).optional(),
  workerConfirmedJoining: z.boolean().optional(),
});

// ---------- Credits ----------
export const unlockInput = z.object({ candidateId: reqStr(80) });
export const packInput = z.object({ packId: z.enum(['PACK_10', 'PACK_25', 'PACK_100']) });
export const paymentConfirm = z.object({
  orderId: reqStr(80),
  razorpay_payment_id: str(80).optional(),
  razorpay_order_id: str(80).optional(),
  razorpay_signature: str(200).optional(),
});

// ---------- Admin / reports ----------
export const adminVerify = z.object({
  recordId: reqStr(80),
  status: z.enum(['VERIFIED', 'REJECTED', 'Verified', 'Rejected']),
  reasonCode: str(60).optional(),
  reviewerNotes: str(500).optional(),
});

export const reportCreate = z.object({
  reportedCompany: reqStr(120),
  thekedarName: str(120).default(''),
  issueType: z.enum(['Fee Demanded', 'Wage Cut Withheld', 'PF Not Deposited', 'Passbook Confiscated']),
  details: reqStr(1500),
  amountDemanded: z.number().int().min(0).max(10_000_000).optional(),
  reporterPhone: str(30).default(''),
});

export const reportPatch = z.object({
  status: z.enum(['New', 'Investigating', 'Under Investigation', 'Confirmed — Factory Paused', 'Resolved', 'Dismissed']),
  outcomeNote: str(500).optional(),
  pauseFactoryPostings: z.boolean().optional(),
});

// ---------- Drives / check-ins ----------
export const driveCreate = z.object({
  title: reqStr(140),
  itiInstituteName: str(140).optional(),
  driveType: z.enum(['Walk-in Gate Drive', 'ITI Campus Drive', 'Virtual Audio/Video Drive']),
  date: reqStr(60),
  venue: reqStr(200),
  venueAddress: str(300).optional(),
  industrialHub: reqStr(80),
  inHandSalary: money(500_000).optional(),
  trades: z.array(z.enum(TRADES)).min(1).max(14),
  targetOpenings: z.number().int().min(1).max(10_000),
  seatsAvailable: z.number().int().min(0).max(10_000).optional(),
});

export const driveCheckin = z.object({ candidateId: reqStr(80), checkInCode: str(40).optional() });

export const retentionCheckIn = z.object({
  jobId: str(80).optional(),
  employerId: str(80).optional(),
  companyName: str(120).optional(),
  milestone: z.enum(['Day1', 'Day7', 'Day30', 'Day90']).optional(),
  dayMilestone: z.union([z.literal(1), z.literal(7), z.literal(30), z.literal(90)]).optional(),
  didJoin: z.boolean().optional(),
  stillEmployed: z.boolean().optional(),
  payMatchesPromise: z.boolean().optional(),
  promisedPayReceived: z.boolean().optional(),
  hostelMatchesPromise: z.boolean().optional(),
  promisedShiftHonored: z.boolean().optional(),
  feedbackNote: str(500).optional(),
});

// ---------- DPDP ----------
export const nomineeInput = z.object({
  nomineeName: reqStr(80),
  relationship: reqStr(40),
  nomineePhone: phoneField,
});

export const grievanceInput = z.object({
  dataPrincipalName: reqStr(80),
  dataPrincipalPhone: phoneField,
  role: z.enum(['worker', 'employer']),
  category: z.enum([
    'Unauthorized Data Sharing',
    'Consent Withdrawal Delay',
    'Data Erasure Request',
    'Incorrect Personal Data',
    'Other DPDP Right',
  ]),
  description: reqStr(1500),
});

export function firstIssue(err: z.ZodError): string {
  const i = err.issues[0];
  const where = i.path.length ? `${i.path.join('.')}: ` : '';
  return `${where}${i.message}`;
}
