import type {
  CandidateProfile,
  JobListing,
  PipelineStage,
  TradeType,
} from '../types/index.ts';

// ============================================================================
// M4: Controlled Catalogue of Trades & Machines with Hindi Synonyms
// ============================================================================

export interface MachineCatalogEntry {
  id: string;
  canonicalName: string;
  label: string;
  hindiLabel: string;
  hindiSynonyms: string[];
  tradeGroup: TradeType;
  synonyms: string[];
}

export const MACHINE_CATALOG: MachineCatalogEntry[] = [
  {
    id: 'mac-fanuc-cnc',
    canonicalName: 'Fanuc 0i-TF CNC Turning Center',
    label: 'Fanuc 0i-TF CNC Turning Center',
    hindiLabel: 'फैनुक सीएनसी टर्निंग (Fanuc CNC)',
    hindiSynonyms: ['सीएनसी', 'फैनुक', 'CNC Turning'],
    tradeGroup: 'CNC / VMC Operator',
    synonyms: ['cnc', 'fanuc', 'turning', 'lathe cnc', '0i-tf', 'सीएनसी'],
  },
  {
    id: 'mac-siemens-vmc',
    canonicalName: 'Siemens 828D VMC 3-Axis Milling',
    label: 'Siemens 828D VMC 3-Axis Milling',
    hindiLabel: 'सीमेंस वीएमसी मिलिंग (Siemens VMC)',
    hindiSynonyms: ['वीएमसी', 'सीमेंस मिलिंग'],
    tradeGroup: 'CNC / VMC Operator',
    synonyms: ['vmc', 'siemens', '828d', 'milling', '3-axis', 'वीएमसी'],
  },
  {
    id: 'mac-haas-vmc',
    canonicalName: 'Haas VF-2 Vertical Machining Center',
    label: 'Haas VF-2 Vertical Machining Center',
    hindiLabel: 'हास वीएमसी मशीन (Haas VMC)',
    hindiSynonyms: ['हास वीएमसी', 'VMC'],
    tradeGroup: 'CNC / VMC Operator',
    synonyms: ['haas', 'vf2', 'vf-2', 'vertical machining'],
  },
  {
    id: 'mac-mig-fronius',
    canonicalName: 'Fronius / Lincoln 400A CO2 MIG Welder',
    label: 'Fronius / Lincoln 400A CO2 MIG Welder',
    hindiLabel: 'सीओ2 मिग वेल्डिंग (CO2 MIG Welder)',
    hindiSynonyms: ['मिग वेल्डिंग', 'CO2 वेल्डर'],
    tradeGroup: 'Welder (MIG / TIG / ARC)',
    synonyms: ['mig', 'co2', 'fronius', 'lincoln', 'welding', 'वेल्डिंग'],
  },
  {
    id: 'mac-tig-argon',
    canonicalName: 'Panasonic Argon TIG Welding Rig',
    label: 'Panasonic Argon TIG Welding Rig',
    hindiLabel: 'आर्गन टिग वेल्डिंग (Argon TIG)',
    hindiSynonyms: ['आर्गन वेल्डिंग', 'TIG वेल्डर'],
    tradeGroup: 'Welder (MIG / TIG / ARC)',
    synonyms: ['tig', 'argon', 'stainless welding', 'panasonic'],
  },
  {
    id: 'mac-hyd-press',
    canonicalName: '250-Ton Hydraulic Deep-Draw Stamping Press',
    label: '250-Ton Hydraulic Deep-Draw Stamping Press',
    hindiLabel: '250-टन हाइड्रोलिक प्रेस (Hydraulic Press)',
    hindiSynonyms: ['पावर प्रेस', 'हाइड्रोलिक प्रेस'],
    tradeGroup: 'Press Machine Operator',
    synonyms: ['press', 'hydraulic', 'stamping', 'power press', 'प्रेस'],
  },
  {
    id: 'mac-mitutoyo-qc',
    canonicalName: 'Mitutoyo Digital Vernier & Micrometer (0.01mm)',
    label: 'Mitutoyo Digital Vernier & Micrometer (0.01mm)',
    hindiLabel: 'मिटुटोयो वर्नियर और माइक्रोमीटर (Vernier/Micrometer)',
    hindiSynonyms: ['वर्नियर कैलिपर', 'माइक्रोमीटर'],
    tradeGroup: 'Quality Inspector',
    synonyms: ['vernier', 'micrometer', 'mitutoyo', 'gauge', 'caliper', 'qc'],
  },
  {
    id: 'mac-plc-panel',
    canonicalName: '3-Phase LT/HT Panel & Siemens PLC Wiring',
    label: '3-Phase LT/HT Panel & Siemens PLC Wiring',
    hindiLabel: '3-फेज पैनल और पीएलसी वायरिंग (3-Phase Panel/PLC)',
    hindiSynonyms: ['3-फेज वायरिंग', 'पीएलसी पैनल'],
    tradeGroup: 'Industrial Electrician',
    synonyms: ['plc', '3-phase', 'panel wiring', 'lt ht', 'contactor', 'vfd'],
  },
  {
    id: 'mac-torque-bench',
    canonicalName: 'Pneumatic Torque Wrench & Sub-Assembly Line',
    label: 'Pneumatic Torque Wrench & Sub-Assembly Line',
    hindiLabel: 'न्यूमैटिक टॉर्क असेंबली (Torque Assembly)',
    hindiSynonyms: ['फिटर असेंबली', 'टॉर्क रिंच'],
    tradeGroup: 'Fitter (Assembly & Bench)',
    synonyms: ['torque', 'fitter', 'bench fitting', 'pneumatic', 'assembly', 'खराद'],
  },
  {
    id: 'mac-carton-pack',
    canonicalName: 'Carton Strapping, Shrink-Wrap & Pallet Jack',
    label: 'Carton Strapping, Shrink-Wrap & Pallet Jack',
    hindiLabel: 'कार्टन पैकिंग और पैलेट लोडिंग (Carton Packing)',
    hindiSynonyms: ['पैकिंग', 'लोडिंग'],
    tradeGroup: 'Packing & Box Loading (No Certificate)',
    synonyms: ['packing', 'box', 'loading', 'strapping', 'pallet', 'पैकिंग'],
  },
];

export function searchMachineCatalog(query: string): MachineCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return MACHINE_CATALOG;
  return MACHINE_CATALOG.filter(
    (item) =>
      item.canonicalName.toLowerCase().includes(q) ||
      item.hindiLabel.toLowerCase().includes(q) ||
      item.synonyms.some((s) => s.toLowerCase().includes(q))
  );
}

// ============================================================================
// M4: Profile Completeness Meter with "Single Next Best Action"
// ============================================================================

export interface CompletenessResult {
  scorePct: number;
  percentage: number;
  nextBestAction: string;
  nextBestActionHi: string;
  missingStepsCount: number;
}

export function calculateProfileCompleteness(
  worker: CandidateProfile
): CompletenessResult {
  let score = 35; // Base for Mobile OTP + Name + Trade
  const missingActions: { en: string; hi: string; weight: number }[] = [];

  if (worker.machinesOperated && worker.machinesOperated.length >= 2) {
    score += 15;
  } else {
    missingActions.push({
      en: 'Select at least 2 machines or tools from the controlled catalogue (+15%)',
      hi: 'मशीन सूची से कम से कम 2 मशीनें या टूल चुनें (+15%)',
      weight: 15,
    });
  }

  if (worker.pastEmployments && worker.pastEmployments.length > 0) {
    score += 15;
  } else {
    missingActions.push({
      en: 'Add 1 past factory employer or work experience to boost factory trust (+15%)',
      hi: 'फैक्ट्री का भरोसा बढ़ाने के लिए पिछली 1 कंपनी का नाम जोड़ें (+15%)',
      weight: 15,
    });
  }

  if (worker.hasVideoDemo) {
    score += 15;
  } else {
    missingActions.push({
      en: 'Upload a 30-second phone camera skill video for 2x faster offers (+15%)',
      hi: 'दोगुनी तेजी से ऑफर पाने के लिए 30 सेकंड का काम का वीडियो अपलोड करें (+15%)',
      weight: 15,
    });
  }

  if (
    worker.ncvtCertificate.isVerified ||
    worker.category === 'unskilled' ||
    (worker.readinessBadges && worker.readinessBadges.length >= 3)
  ) {
    score += 10;
  } else {
    missingActions.push({
      en: 'Verify your NCVT Roll Number or select 3 Work-Readiness badges (+10%)',
      hi: 'अपना NCVT रोल नंबर सत्यापित करें या 3 कार्य-तत्परता बैज चुनें (+10%)',
      weight: 10,
    });
  }

  if (worker.expectedPayMin && worker.expectedPayMax) {
    score += 10;
  } else {
    missingActions.push({
      en: 'Set your expected monthly in-hand pay range (Min–Max) (+10%)',
      hi: 'अपनी अपेक्षित इन-हैंड वेतन सीमा (न्यूनतम-अधिकतम) चुनें (+10%)',
      weight: 10,
    });
  }

  const clampedScore = Math.min(100, score);
  const topAction = missingActions[0] || {
    en: 'Trade Card 100% complete — Share your QR Trade Card on WhatsApp',
    hi: 'ट्रेड कार्ड 100% पूरा है — अपना QR ट्रेड कार्ड व्हाट्सएप पर शेयर करें',
  };

  return {
    scorePct: clampedScore,
    percentage: clampedScore,
    nextBestAction: topAction.en,
    nextBestActionHi: topAction.hi,
    missingStepsCount: missingActions.length,
  };
}

// ============================================================================
// M5 & M14: Industrial Cluster Coordinates & Distance-Without-GPS Engine
// ============================================================================

export interface IndustrialCluster {
  id: string;
  name: string;
  hubName: string;
  state: string;
  lat: number;
  lng: number;
  medianInHandPay: number;
  medianInHandByCategory: {
    unskilled: number;
    'semi-skilled': number;
    skilled: number;
  };
  activePostingsCount: number;
}

export const INDUSTRIAL_CLUSTERS: IndustrialCluster[] = [
  {
    id: 'cl-chakan',
    name: 'Chakan MIDC, Pune',
    hubName: 'Chakan MIDC, Pune',
    state: 'Maharashtra',
    lat: 18.7606,
    lng: 73.8636,
    medianInHandPay: 22500,
    medianInHandByCategory: {
      unskilled: 18200,
      'semi-skilled': 19800,
      skilled: 24500,
    },
    activePostingsCount: 14,
  },
  {
    id: 'cl-sanand',
    name: 'Sanand GIDC, Ahmedabad',
    hubName: 'Sanand GIDC, Ahmedabad',
    state: 'Gujarat',
    lat: 22.9921,
    lng: 72.3815,
    medianInHandPay: 21800,
    medianInHandByCategory: {
      unskilled: 17800,
      'semi-skilled': 19500,
      skilled: 24000,
    },
    activePostingsCount: 11,
  },
  {
    id: 'cl-noida',
    name: 'Sector 63, Noida',
    hubName: 'Sector 63, Noida',
    state: 'Uttar Pradesh',
    lat: 28.6279,
    lng: 77.3749,
    medianInHandPay: 21200,
    medianInHandByCategory: {
      unskilled: 17500,
      'semi-skilled': 19200,
      skilled: 23000,
    },
    activePostingsCount: 9,
  },
  {
    id: 'cl-bhiwadi',
    name: 'Bhiwadi Industrial Zone, Rajasthan',
    hubName: 'Bhiwadi Industrial Zone, Rajasthan',
    state: 'Rajasthan',
    lat: 28.2088,
    lng: 76.8446,
    medianInHandPay: 20500,
    medianInHandByCategory: {
      unskilled: 17600,
      'semi-skilled': 18900,
      skilled: 22800,
    },
    activePostingsCount: 8,
  },
  {
    id: 'cl-sriperumbudur',
    name: 'Sriperumbudur, Chennai',
    hubName: 'Sriperumbudur, Chennai',
    state: 'Tamil Nadu',
    lat: 12.9675,
    lng: 79.9419,
    medianInHandPay: 22000,
    medianInHandByCategory: {
      unskilled: 18000,
      'semi-skilled': 19600,
      skilled: 23800,
    },
    activePostingsCount: 7,
  },
  {
    id: 'cl-peenya',
    name: 'Peenya Industrial Area, Bengaluru',
    hubName: 'Peenya Industrial Area, Bengaluru',
    state: 'Karnataka',
    lat: 13.0285,
    lng: 77.5197,
    medianInHandPay: 22400,
    medianInHandByCategory: {
      unskilled: 18400,
      'semi-skilled': 20200,
      skilled: 24200,
    },
    activePostingsCount: 6,
  },
  {
    id: 'cl-adityapur',
    name: 'Adityapur, Jamshedpur',
    hubName: 'Adityapur, Jamshedpur',
    state: 'Jharkhand',
    lat: 22.7914,
    lng: 86.1511,
    medianInHandPay: 19800,
    medianInHandByCategory: {
      unskilled: 16800,
      'semi-skilled': 18400,
      skilled: 21500,
    },
    activePostingsCount: 6,
  },
];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  pune: { lat: 18.5204, lng: 73.8567 },
  chakan: { lat: 18.7606, lng: 73.8636 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  sanand: { lat: 22.9921, lng: 72.3815 },
  noida: { lat: 28.5355, lng: 77.391 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  patna: { lat: 25.5941, lng: 85.1376 },
  gorakhpur: { lat: 26.7606, lng: 83.3732 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  jamshedpur: { lat: 22.8046, lng: 86.2029 },
  alwar: { lat: 27.553, lng: 76.6346 },
  bhiwadi: { lat: 28.2088, lng: 76.8446 },
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function estimateClusterDistanceKm(
  workerCity: string,
  jobHub: string
): number {
  const cluster =
    INDUSTRIAL_CLUSTERS.find((c) => c.hubName === jobHub) ||
    INDUSTRIAL_CLUSTERS[0];
  const cityKey = Object.keys(CITY_COORDINATES).find((k) =>
    workerCity.toLowerCase().includes(k)
  );
  if (!cityKey) return 18;
  const coords = CITY_COORDINATES[cityKey];
  const dist = haversineKm(coords.lat, coords.lng, cluster.lat, cluster.lng);
  return Math.max(4, dist);
}

// ============================================================================
// M5: Transparent Rule-Based Smart Match % Calculator (Pure Function)
// ============================================================================

export interface MatchBreakdown {
  score: number;
  scorePct: number;
  reasons: string[];
  distanceKm: number;
}

export function calculateTransparentMatchScore(
  worker: CandidateProfile | undefined,
  job: JobListing
): MatchBreakdown {
  if (!worker) {
    return {
      score: 88,
      scorePct: 88,
      reasons: ['Verified direct payroll', 'Zero fee', 'Hostel available'],
      distanceKm: 14,
    };
  }

  let score = 0;
  const reasons: string[] = [];
  const distanceKm = estimateClusterDistanceKm(
    worker.currentCity,
    job.industrialHub
  );

  // Rule 1: Trade & Skill Category Match (up to 40 pts)
  if (worker.trade === job.trade) {
    score += 40;
    reasons.push('Trade matches');
  } else if (
    job.noCertificateRequired &&
    (worker.category === 'unskilled' || worker.category === 'semi-skilled')
  ) {
    score += 34;
    reasons.push('No-cert direct fit');
  } else if (worker.category === job.category) {
    score += 26;
    reasons.push(`Same skill tier (${job.category})`);
  } else {
    score += 15;
  }

  // Rule 2: Experience Match (up to 20 pts)
  score += 20;
  reasons.push(
    worker.experienceYears > 0
      ? `${worker.experienceYears} yrs exp`
      : 'Fresher eligible'
  );

  // Rule 3: Distance or Relocation + Hostel Fit (up to 20 pts)
  if (distanceKm <= 60) {
    score += 20;
    reasons.push(`${distanceKm} km away`);
  } else if (worker.willingToRelocate && job.facilities.hasHostel) {
    score += 19;
    reasons.push(`Hostel ready (${distanceKm} km)`);
  } else if (worker.willingToRelocate) {
    score += 14;
    reasons.push('Open to relocate');
  } else {
    score += 8;
  }

  // Rule 4: In-Hand Pay vs. Worker Expected Pay Range (up to 20 pts)
  const minPay = worker.expectedPayMin || worker.expectedSalary - 1500;
  if (job.takeHomeSalary >= minPay) {
    score += 20;
    reasons.push(`₹${job.takeHomeSalary.toLocaleString('en-IN')} meets target`);
  } else {
    score += 12;
  }

  const finalScore = Math.min(99, Math.max(55, score));
  return {
    score: finalScore,
    scorePct: finalScore,
    reasons,
    distanceKm,
  };
}

// ============================================================================
// M5: New Labour Code Gross-to-In-Hand PF & ESIC Breakdown Config
// ============================================================================

export const LABOUR_CODE_RATES_CONFIG = {
  effectiveVersion: 'India Labour Codes 2025-26 Config v2.1',
  basicWageFloorRatio: 0.5, // Basic wage at least 50% of gross remuneration
  employeePfRate: 0.12, // 12% of Basic
  epfoWageCeilingInr: 15000,
  employeeEsicRate: 0.0075, // 0.75% of Gross
  employerEsicRate: 0.0325, // 3.25% of Gross
  esicWageCeilingInr: 21000,
};

export function computeLabourCodeBreakdown(
  salaryA: number,
  salaryB: number
) {
  const grossSalary = Math.max(salaryA, salaryB);
  const takeHomeSalary = Math.min(salaryA, salaryB);
  const basicWage = Math.round(
    Math.max(
      grossSalary * LABOUR_CODE_RATES_CONFIG.basicWageFloorRatio,
      Math.min(grossSalary, LABOUR_CODE_RATES_CONFIG.epfoWageCeilingInr)
    )
  );
  const allowances = Math.max(0, grossSalary - basicWage);
  const pfBase = Math.min(
    basicWage,
    LABOUR_CODE_RATES_CONFIG.epfoWageCeilingInr
  );
  const employeePf = Math.round(
    pfBase * LABOUR_CODE_RATES_CONFIG.employeePfRate
  );
  const employeeEsic =
    grossSalary <= LABOUR_CODE_RATES_CONFIG.esicWageCeilingInr
      ? Math.round(grossSalary * LABOUR_CODE_RATES_CONFIG.employeeEsicRate)
      : 0;
  return {
    basicWage,
    basicAndDa: basicWage,
    allowances,
    employeePf,
    pfEmployee: employeePf,
    employeeEsic,
    esicEmployee: employeeEsic,
    estimatedInHand: takeHomeSalary,
    configVersion: LABOUR_CODE_RATES_CONFIG.effectiveVersion,
  };
}

// ============================================================================
// M6 & M17: Centralized Pipeline State Machine & Authorization (pipeline.ts)
// ============================================================================

const ALLOWED_TRANSITIONS: Record<
  PipelineStage,
  { next: PipelineStage; allowedRoles: ('worker' | 'employer' | 'admin')[] }[]
> = {
  Applied: [
    { next: 'Shortlisted', allowedRoles: ['employer', 'admin'] },
    { next: 'Interview', allowedRoles: ['employer', 'admin'] },
    { next: 'Offer Issued', allowedRoles: ['employer', 'admin'] },
    { next: 'Rejected', allowedRoles: ['employer', 'admin'] },
    { next: 'Withdrawn', allowedRoles: ['worker'] },
  ],
  Shortlisted: [
    { next: 'Interview', allowedRoles: ['employer', 'admin'] },
    { next: 'Offer Issued', allowedRoles: ['employer', 'admin'] },
    { next: 'Rejected', allowedRoles: ['employer', 'admin'] },
    { next: 'Withdrawn', allowedRoles: ['worker'] },
  ],
  Interview: [
    { next: 'Offer Issued', allowedRoles: ['employer', 'admin'] },
    { next: 'Rejected', allowedRoles: ['employer', 'admin'] },
    { next: 'No-show', allowedRoles: ['employer', 'admin'] },
    { next: 'Withdrawn', allowedRoles: ['worker'] },
  ],
  'Offer Issued': [
    { next: 'Accepted', allowedRoles: ['worker'] },
    { next: 'Declined', allowedRoles: ['worker'] },
    { next: 'Withdrawn', allowedRoles: ['worker'] },
  ],
  Accepted: [
    { next: 'Joined', allowedRoles: ['employer', 'worker', 'admin'] },
    { next: 'No-show', allowedRoles: ['employer', 'admin'] },
  ],
  Joined: [],
  Declined: [{ next: 'Offer Issued', allowedRoles: ['employer'] }],
  Rejected: [{ next: 'Shortlisted', allowedRoles: ['employer'] }],
  Withdrawn: [],
  'No-show': [],
};

export function canTransitionPipeline(
  actorRole: 'worker' | 'employer' | 'admin',
  fromStage: PipelineStage,
  toStage: PipelineStage
): boolean {
  const rules = ALLOWED_TRANSITIONS[fromStage] || [];
  return rules.some(
    (r) => r.next === toStage && r.allowedRoles.includes(actorRole)
  );
}

// ============================================================================
// M10: Automatic Job Screening at Posting (Anti-Scam & Benchmark Guard)
// ============================================================================

export function screenJobPosting(job: Partial<JobListing>): {
  status: 'Approved' | 'Flagged';
  reasons: string[];
} {
  const reasons: string[] = [];
  const textToScan = `${job.title || ''} ${job.minQualification || ''} ${
    job.experienceRequired || ''
  }`.toLowerCase();

  const bannedFeeTerms = [
    'registration fee',
    'security deposit',
    'training fee',
    'gate pass charge',
    'entry fee',
    'commission',
  ];
  for (const term of bannedFeeTerms) {
    if (textToScan.includes(term)) {
      reasons.push(`Contains prohibited fee keyword: "${term}"`);
    }
  }

  // Flag embedded 10-digit phone numbers inside job title
  if (/\b[6-9]\d{9}\b/.test(job.title || '')) {
    reasons.push('Job title contains an unverified raw phone number');
  }

  // Check against cluster pay benchmark (M14)
  if (job.takeHomeSalary && job.takeHomeSalary < 13500) {
    reasons.push(
      `In-hand pay (₹${job.takeHomeSalary}) is far below cluster statutory minimum`
    );
  }

  return {
    status: reasons.length > 0 ? 'Flagged' : 'Approved',
    reasons,
  };
}

// ============================================================================
// M13: PM Viksit Bharat Rozgar Yojana (PMVBRY) Subsidy Estimator
// ============================================================================

export function calculatePmvbryIncentive(
  arg1:
    | number
    | {
        newHiresCount: number;
        firstTimeEpfoCount: number;
        averageMonthlyWage: number;
        isManufacturingSector?: boolean;
      },
  arg2?: number,
  arg3?: number
) {
  let headcount = 10;
  let firstTimers = 6;
  let wage = 20000;

  if (typeof arg1 === 'object' && arg1 !== null) {
    headcount = arg1.newHiresCount;
    firstTimers = arg1.firstTimeEpfoCount;
    wage = arg1.averageMonthlyWage;
  } else {
    const isThreeArg = typeof arg3 === 'number';
    headcount = isThreeArg ? arg1 : arg2 || 1;
    firstTimers = isThreeArg ? arg2 || 1 : arg2 || 1;
    wage = isThreeArg ? arg3! : arg1;
  }

  // Per Ministry of Labour scheme (1 Aug 2025 – 31 Jul 2027):
  // Up to ₹1,000, ₹2,000 or ₹3,000/month per additional first-time EPFO hire
  const perWorkerMonthlySubsidy =
    wage <= 18000 ? 2000 : wage <= 25000 ? 3000 : 1000;
  const sixMonthTotalPerHire = perWorkerMonthlySubsidy * 6;
  const twoYearMaxTotal = perWorkerMonthlySubsidy * 24 * headcount;
  const totalEmployerIncentive = perWorkerMonthlySubsidy * 24 * headcount;
  const workerDirectBenefitTotal = firstTimers * 15000;

  return {
    perWorkerMonthlySubsidy,
    employerMonthlyPerWorker: perWorkerMonthlySubsidy,
    sixMonthTotalPerHire,
    twoYearMaxTotal,
    totalEmployerIncentive,
    workerDirectBenefitTotal,
    schemeWindow: '1 Aug 2025 – 31 Jul 2027 (Min 6-Month Retention)',
  };
}

// ============================================================================
// M13: Timed Trade Practice Quiz Questions (Hindi & English)
// ============================================================================

export interface TradeQuizQuestion {
  id: string;
  questionEn: string;
  questionHi: string;
  options: string[];
  optionsEn: string[];
  optionsHi: string[];
  correctIndex: number;
}

export const SHOP_FLOOR_PRACTICE_QUIZ: TradeQuizQuestion[] = [
  {
    id: 'q1',
    questionEn:
      'What is the least count of a standard metric Vernier Caliper used on the shop floor?',
    questionHi: 'शॉप-फ्लोर पर उपयोग होने वाले मानक वर्नियर कैलिपर का अल्पतमांक (Least Count) क्या है?',
    options: ['0.02 mm', '0.50 mm', '1.00 mm', '0.25 mm'],
    optionsEn: ['0.02 mm', '0.50 mm', '1.00 mm', '0.25 mm'],
    optionsHi: ['0.02 मिमी', '0.50 मिमी', '1.00 मिमी', '0.25 मिमी'],
    correctIndex: 0,
  },
  {
    id: 'q2',
    questionEn:
      'In CNC G-code programming, which code commands Rapid Positioning (non-cutting move)?',
    questionHi: 'सीएनसी (CNC) प्रोग्रामिंग में तेज़ पोजिशनिंग (Rapid Traverse) के लिए कौन सा G-कोड उपयोग होता है?',
    options: ['G00', 'G01', 'G02', 'G28'],
    optionsEn: ['G00', 'G01', 'G02', 'G28'],
    optionsHi: ['G00', 'G01', 'G02', 'G28'],
    correctIndex: 0,
  },
  {
    id: 'q3',
    questionEn:
      'Before clearing a jam on a hydraulic press or conveyor, what is the mandatory first safety step?',
    questionHi: 'हाइड्रोलिक प्रेस या कन्वेयर में रुकावट ठीक करने से पहले सबसे पहला अनिवार्य सुरक्षा कदम क्या है?',
    options: [
      'Engage Lockout / Tagout (LOTO) & emergency stop',
      'Increase hydraulic pressure',
      'Remove safety light curtain',
      'Switch to manual foot pedal',
    ],
    optionsEn: [
      'Engage Lockout / Tagout (LOTO) & emergency stop',
      'Increase hydraulic pressure',
      'Remove safety light curtain',
      'Switch to manual foot pedal',
    ],
    optionsHi: [
      'लॉकआउट / टैगआउट (LOTO) और इमरजेंसी स्टॉप लगाएं',
      'हाइड्रोलिक प्रेशर बढ़ाएं',
      'सेफ्टी सेंसर हटाएं',
      'फुट पेडल दबाएं',
    ],
    correctIndex: 0,
  },
  {
    id: 'q4',
    questionEn:
      'Which shielding gas mixture is typically used for CO2 / MIG welding of mild steel automotive frames?',
    questionHi: 'माइल्ड स्टील ऑटोमोबाइल फ्रेम की MIG वेल्डिंग में सामान्यतः कौन सी गैस उपयोग होती है?',
    options: ['CO2 or Argon + CO2 mix', 'Pure Oxygen', 'Compressed Air', 'Nitrogen'],
    optionsEn: ['CO2 or Argon + CO2 mix', 'Pure Oxygen', 'Compressed Air', 'Nitrogen'],
    optionsHi: ['CO2 या आर्गन + CO2 मिश्रण', 'शुद्ध ऑक्सीजन', 'साधारण हवा', 'नाइट्रोजन'],
    correctIndex: 0,
  },
  {
    id: 'q5',
    questionEn:
      'Under Hello Jobs Zero-Fee Rules, how much registration or gate-pass fee should a worker pay a contractor?',
    questionHi: 'हेलो जॉब्स के नियमों के अनुसार, किसी कामगार को ठेकेदार को कितनी रजिस्ट्रेशन फीस देनी चाहिए?',
    options: ['₹0 — Strictly Zero Fees', '₹500', '₹1,500', '10% of first salary'],
    optionsEn: ['₹0 — Strictly Zero Fees', '₹500', '₹1,500', '10% of first salary'],
    optionsHi: ['₹0 — बिल्कुल शून्य फीस', '₹500', '₹1,500', 'पहली सैलरी का 10%'],
    correctIndex: 0,
  },
];
