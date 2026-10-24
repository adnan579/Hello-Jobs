import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  X,
  BookOpen,
  Layers,
  ShieldCheck,
  Volume2,
  Server,
  Download,
  ExternalLink,
  Search,
  Users,
  Factory,
  Award,
  Calculator,
  AlertTriangle,
  Smartphone,
  QrCode,
  FileText,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateRole: (role: UserRole) => void;
  onOpenModal: (
    modal:
      | 'auth-worker'
      | 'auth-employer'
      | 'create-profile'
      | 'post-job'
      | 'ncvt-search'
      | 'calculator'
      | 'report'
      | 'dpdp'
  ) => void;
}

interface ModuleSpec {
  id: string;
  layer: 'portals' | 'compliance' | 'voice' | 'backend';
  title: string;
  subtitle: string;
  badge: string;
  summary: string;
  granularDetails: string[];
  technicalSpecs: string[];
  actionLabel?: string;
  onTrigger?: () => void;
}

export const AppOverviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateRole,
  onOpenModal,
}) => {
  const [activeLayer, setActiveLayer] = useState<
    'all' | 'portals' | 'compliance' | 'voice' | 'backend' | 'architecture'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const modules: ModuleSpec[] = [
    {
      id: 'mod-worker-portal',
      layer: 'portals',
      title: '1. Worker Inbound Job Feed & 3-Tier Skill Filtering',
      subtitle: 'WorkerPortal.tsx · Zero-Middleman Shop-Floor Job Discovery',
      badge: 'Worker Portal',
      summary:
        'Connects both unskilled/semi-skilled helpers (zero certificates required) and NCVT-certified ITI technicians directly with verified factory openings across 6 major Indian industrial hubs.',
      granularDetails: [
        '3-Tier Workforce Category Filter: (1) All Factory Jobs, (2) No Certificate / Helper & Packing Jobs (unskilled & semi-skilled), and (3) ITI & Skilled Machine Operator Jobs.',
        'Multi-Dimensional Filtering: Search by keyword/company/trade, filter by 8 core trades, filter by 6 industrial corridors (Pune/Chakan MIDC, Manesar/Gurugram NCR, Noida, Sanand GIDC, Chennai, Hosur), and toggle Free Hostel or Shift Canteen availability.',
        'Transparent 3-Column Salary Box on Every Card: Displays exact Monthly In-Hand Salary (net bank transfer), Gross CTC (with PF & ESIC inclusion tags), and explicit Hourly Overtime Rate (₹/hr) + Shift schedule.',
        '1-Click Direct Apply: Immediately creates a live JobApplication record, decrements remaining plant vacancies, and links to the Worker Offer Inbox.',
      ],
      technicalSpecs: [
        'Component: src/components/WorkerPortal.tsx',
        'API Endpoint: POST /api/applications (creates application & decrements job.vacanciesLeft)',
        'Audio Integration: Per-card playJobAudio() & stopJobAudio() synthesis',
      ],
      actionLabel: 'Launch Worker Job Feed',
      onTrigger: () => {
        onClose();
        onNavigateRole('worker');
      },
    },
    {
      id: 'mod-3tap-gatepass',
      layer: 'portals',
      title: '2. 3-Tap Easy Worker Gate-Pass Wizard (Zero Documents Required)',
      subtitle: 'SmartTradeProfileModal.tsx · Inclusive Onboarding for Unskilled & Skilled Hands',
      badge: 'Accessibility Onboarding',
      summary:
        'Replaces complex resume uploads with a 3-step visual wizard so packers, loaders, helpers, and ITI operators can create a verified Gate-Pass in under 30 seconds.',
      granularDetails: [
        'Step 1 (Pick Work Type): 8 visual cards split into "No Certificate Needed (Direct Joining)" (Packing & Box Loading, Factory Floor Helper, Assembly Line Helper, Machine Helper) and "ITI / Skilled Machine Operator Roles" (CNC/VMC, Welder, Fitter, Electrician).',
        'Step 2 (Work-Readiness Stamina Badges): 6 interactive reliability badges (Mobile OTP Verified, Immediate Joiner, 12-Hr Shift Stamina, Heavy Packing & Loading Ready, Hostel / Outstation Ready, Night Shift Ready).',
        'Step 3 (Identity, Salary & Progressive NCVT Disclosure): Captures Name, 10-Digit Mobile, City, Home State, Expected Salary slider (₹14,000–₹32,000), optional NCVT Roll Number attachment, and mandatory DPDP Act 2023 Section 5 & 6 Consent.',
      ],
      technicalSpecs: [
        'Component: src/components/SmartTradeProfileModal.tsx',
        'API Endpoint: POST /api/candidates (saves CandidateProfile + DpdpConsentSettings artifact)',
        'Voice Guide: getVoiceGuideScript("profile-wizard", lang)',
      ],
      actionLabel: 'Launch 3-Tap Gate-Pass Wizard',
      onTrigger: () => {
        onClose();
        onOpenModal('create-profile');
      },
    },
    {
      id: 'mod-worker-profile',
      layer: 'portals',
      title: '3. Worker Profile Dashboard, Offer Inbox & QR Digital Gate-Pass ID',
      subtitle: 'WorkerProfileView.tsx · Complete Candidate Self-Service & Credential Wallet',
      badge: 'Worker Dashboard',
      summary:
        'Dedicated 3-tab dashboard where workers edit their trade profile and readiness badges, accept or decline digital offer letters, track job applications, and download a QR-verified Gate-Pass ID card.',
      granularDetails: [
        'Tab 1 (Editable Trade Profile & Badges): Live editing for Name, Phone, 14 Trades, Skill Category, Readiness Badges, Machines Handled tags, Relocation/Immediate Joiner toggles, and Progressive NCVT Certificate fields (Roll No., Cert No., ITI College, Grade, Practical/Theory scores).',
        'Tab 2 (Digital Offer Letters Inbox & Applied Jobs): Displays formal factory appointment letters with 1-click "Accept Offer & Confirm Joining" or "Decline Offer" actions, alongside real-time application status tracking (Applied, Shortlisted, Offer Issued, Hired, Rejected).',
        'Tab 3 (QR Digital Worker Gate-Pass ID Card): Printable high-contrast industrial ID card with deterministic SVG QR matrix and 1-click ".txt" Gate-Pass download.',
      ],
      technicalSpecs: [
        'Component: src/components/WorkerProfileView.tsx',
        'API Endpoints: PUT /api/candidates/:id · PATCH /api/offers/:id/status',
        'Voice Guide: getVoiceGuideScript("worker-profile", lang)',
      ],
      actionLabel: 'Open Worker Profile & QR ID Card',
      onTrigger: () => {
        onClose();
        onNavigateRole('worker-profile');
      },
    },
    {
      id: 'mod-employer-portal',
      layer: 'portals',
      title: '4. Employer Outbound Talent Hunter & Inbound Plant Postings',
      subtitle: 'EmployerPortal.tsx · Direct Factory Recruitment Without Middlemen',
      badge: 'Employer Portal',
      summary:
        'Dual-mode recruitment console allowing GSTIN-verified factories to hunt verified helpers and ITI operators or manage active bulk production line job openings.',
      granularDetails: [
        'DPDP Section 6(4) Live Filtering: Automatically hides any candidate who has withdrawn DPDP consent or disabled Directory Discovery.',
        'Workforce Category & Machine Control Filters: Filter between All Workers, Helpers/Packers/Loaders, and ITI Operators; search by specific CNC/welding equipment (Fanuc, Siemens, Haas, Fronius, Mitutoyo); filter by NCVT Verified, Inter-State Relocation, and Max Wage slider (₹15k–₹35k).',
        'Rich Candidate Cards: Inspect NCVT Grade or Work-Readiness badges, view 30-second practical shop-floor video demos, bookmark to shortlist, or issue a direct digital offer letter.',
      ],
      technicalSpecs: [
        'Component: src/components/EmployerPortal.tsx',
        'API Endpoints: POST /api/shortlist/toggle · POST /api/offers · POST /api/jobs',
      ],
      actionLabel: 'Launch Employer Talent Hunter',
      onTrigger: () => {
        onClose();
        onNavigateRole('employer');
      },
    },
    {
      id: 'mod-employer-console',
      layer: 'portals',
      title: '5. Employer Factory Console, Applicant Pipeline & GSTIN Showcase',
      subtitle: 'EmployerProfileView.tsx & DigitalOfferModal.tsx · End-to-End HR Operations',
      badge: 'Factory Console',
      summary:
        'Complete plant HR management suite tracking sent digital offer letters, inbound job applicants, bulk vacancy slots, and verified factory credentials.',
      granularDetails: [
        'Tab 1 (Sent Offers & Applicant Pipeline): Track live candidate responses (Issued, Accepted, Declined) on sent offer letters; advance inbound job applicants through Shortlisted -> Offer Issued -> Hired/Rejected.',
        'Tab 2 (Manage Bulk Job Openings): Toggle production line job postings between Active and Closed, or increment/decrement remaining vacancy slots in real time.',
        'Tab 3 (Verified Factory Profile & Plant Gallery): Manage Legal Company Name, 15-Digit GSTIN, Udyam Registration Number, HR Contact details, Plant Welfare Perks (Hostel, Canteen, Bus, Apprenticeship), and Shop-Floor Photo Gallery.',
      ],
      technicalSpecs: [
        'Components: src/components/EmployerProfileView.tsx · src/components/DigitalOfferModal.tsx',
        'API Endpoints: PUT /api/employer · PUT /api/jobs/:id · PATCH /api/applications/:id/status',
      ],
      actionLabel: 'Open Employer Factory Console',
      onTrigger: () => {
        onClose();
        onNavigateRole('employer-profile');
      },
    },
    {
      id: 'mod-dpdp-compliance',
      layer: 'compliance',
      title: '6. DPDP Act 2023 Privacy, Consent & Data Principal Rights Center',
      subtitle: 'DpdpComplianceModal.tsx · Full Statutory Compliance (Sections 5, 6, 11, 12, 13 & 14)',
      badge: 'DPDP Act 2023',
      summary:
        'Comprehensive implementation of India’s Digital Personal Data Protection Act, 2023 giving workers full control over their personal data, consent purposes, family nomination, data erasure, and DPO grievance redressal.',
      granularDetails: [
        'Section 5 & 6 (Itemized Notice & Granular Consent): Plain-language notice in English, Hindi, Marathi & Tamil + 1-tap voice readout ("dpdp-notice"). Generates a timestamped Consent Artifact (CONSENT-DPDP-2026-*). Includes 3 granular toggles (Directory Discovery, Direct HR Contact, Credential Verification) and 1-Tap Withdraw All Consent.',
        'Section 11 & 12 (Right to Access & Right to Erasure): Itemized ledger of every factory (Data Fiduciary) that received the worker’s data via applications or offers, 1-click Portable JSON Data Summary export, and 2-step confirmed Permanent Data Erasure ("Forget Me").',
        'Section 14 (Right to Nominate): Register a family nominee (Spouse, Parent, Child, Sibling, Legal Heir) to exercise data rights in case of death or incapacity.',
        'Section 13 (DPO Grievance Redressal & Audit Ledger): Direct ticket submission to the Data Protection Officer (7-day statutory SLA), escalation info for the Data Protection Board of India (DPBI), and a live Immutable DPDP Compliance Audit Ledger.',
      ],
      technicalSpecs: [
        'Component: src/components/DpdpComplianceModal.tsx',
        'API Endpoints: PUT /api/dpdp/consent/:workerId · PUT /api/dpdp/nominee/:workerId · DELETE /api/dpdp/erase/:workerId · POST /api/dpdp/grievance',
      ],
      actionLabel: 'Open DPDP Act 2023 Rights Center',
      onTrigger: () => {
        onClose();
        onOpenModal('dpdp');
      },
    },
    {
      id: 'mod-ncvt-verification',
      layer: 'compliance',
      title: '7. DGT / NCVT MIS Certificate & Roll Number Verification Engine',
      subtitle: 'NcvtCertificateModal.tsx & NcvtSearchModal.tsx · Authentic Trade Credential Check',
      badge: 'NCVT MIS Verify',
      summary:
        'Eliminates fake paper certificates by allowing employers to verify a technician’s NCVT Roll Number, Certificate Number, ITI College, and practical/theory marks.',
      granularDetails: [
        'Live NCVT Search Modal: Query candidates by NCVT Roll Number (e.g., R220809104421), Certificate Number (e.g., NCVT/2022/UP/884920), or Technician Name.',
        'Digital Trade Certificate Inspector: Displays official DGT metadata including State Directorate, Passing Year, Trade Grade (A+/A/B), Trade Practical Score (out of 250), and Workshop Calculation & Theory Score (out of 100).',
        'DPDP Audit Integration: Every NCVT verification query automatically logs a DATA_EXPORTED entry in the DPDP compliance ledger.',
      ],
      technicalSpecs: [
        'Components: src/components/NcvtSearchModal.tsx · src/components/NcvtCertificateModal.tsx',
        'API Endpoint: GET /api/ncvt/verify?q=<query>',
      ],
      actionLabel: 'Launch NCVT Roll No. Verification',
      onTrigger: () => {
        onClose();
        onOpenModal('ncvt-search');
      },
    },
    {
      id: 'mod-anti-exploitation',
      layer: 'compliance',
      title: '8. Zero-Middleman Wage Calculator & Whistleblower Governance',
      subtitle: 'TakeHomeCalculatorModal.tsx & WhistleblowerModal.tsx · Anti-Thekedar Protection',
      badge: 'Anti-Exploitation',
      summary:
        'Quantifies exact monthly and annual wage leakage to labor contractors and empowers workers to report illegal registration fees or salary cuts.',
      granularDetails: [
        'Zero-Middleman Wage Calculator: Interactive sliders for Factory Monthly Budget (₹15k–₹40k), Thekedar Commission Cut (10%–35%), and Monthly Overtime Hours (0–60 hrs). Computes 1.5x statutory overtime rate, contractor OT skim, Monthly Loss, and Annual Family Savings.',
        'Whistleblower Reporting Portal: Report offending agencies or plants for demanding entry fees, cutting monthly wages, withholding PF/ESIC, or making false hostel promises. Generates an official compliance ticket (WB-2026-*).',
      ],
      technicalSpecs: [
        'Components: src/components/TakeHomeCalculatorModal.tsx · src/components/WhistleblowerModal.tsx',
        'API Endpoint: POST /api/reports',
      ],
      actionLabel: 'Launch Wage Calculator',
      onTrigger: () => {
        onClose();
        onOpenModal('calculator');
      },
    },
    {
      id: 'mod-voice-engine',
      layer: 'voice',
      title: '9. 4-Language Localization & Web Speech API Voice Narrator Engine',
      subtitle: 'translations.ts & audioNarrator.ts · English, Hindi, Marathi & Tamil',
      badge: 'Voice & Vernacular',
      summary:
        'Provides native script translations and spoken audio readouts across all forms, job cards, and statutory privacy notices for semi-literate and regional-language workers.',
      granularDetails: [
        '4 Supported Languages: English (en-IN), Hindi (hi-IN / हिंदी), Marathi (mr-IN / मराठी), and Tamil (ta-IN / தமிழ்).',
        'Dynamic Job Card Audio Narrator: Synthesizes spoken summaries of job designation, company name, hub, exact net take-home pay, gross salary, hourly overtime rate, shift schedule, hostel/canteen perks, and zero-commission guarantee.',
        '4 Contextual Page Voice Guides: Dedicated 1-tap spoken instructions for (1) Worker Job Feed ("worker-feed"), (2) 3-Tap Gate-Pass Wizard ("profile-wizard"), (3) Worker Profile & Inbox ("worker-profile"), and (4) DPDP Act 2023 Privacy Notice ("dpdp-notice").',
      ],
      technicalSpecs: [
        'Files: src/data/translations.ts · src/utils/audioNarrator.ts',
        'Engine: Browser window.speechSynthesis with locale-matched voice selection & safe fallback timers',
      ],
      actionLabel: 'Test Voice Engine on Worker Feed',
      onTrigger: () => {
        onClose();
        onNavigateRole('worker');
      },
    },
    {
      id: 'mod-backend-api',
      layer: 'backend',
      title: '10. Full-Stack Express REST API & Atomic JSON Persistence Engine',
      subtitle: 'server.ts, src/utils/api.ts & data/db.json · 20 Live Endpoints',
      badge: 'Full-Stack Backend',
      summary:
        'Production-grade Express server running on port 3000 with atomic file persistence, automatic seed reconciliation, and real-time multi-user synchronization.',
      granularDetails: [
        '20 REST Endpoints: /api/bootstrap, /api/auth/worker, /api/auth/employer, /api/candidates (POST & PUT), /api/jobs (POST & PUT), /api/applications (POST & PATCH), /api/offers (POST & PATCH), /api/employer (PUT), /api/shortlist/toggle, /api/reports, /api/ncvt/verify, /api/dpdp/consent/:id, /api/dpdp/nominee/:id, /api/dpdp/erase/:id, /api/dpdp/grievance, and /api/reset.',
        'Atomic Write-Then-Rename Storage: Writes state to data/db.json.tmp and atomically renames to data/db.json to prevent file corruption during concurrent writes.',
        'Automatic Seed Reconciliation: Preserves all live user-created profiles, applications, offers, and DPDP audit logs while seamlessly merging pre-seeded jobs and workers.',
      ],
      technicalSpecs: [
        'Files: server.ts · src/utils/api.ts · src/data/initialData.ts · data/db.json',
        'Sync Strategy: Immediate optimistic UI updates + REST mutation + 15-second background polling sync',
      ],
    },
  ];

  const filteredModules = modules.filter((m) => {
    const matchesLayer = activeLayer === 'all' || m.layer === activeLayer;
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.granularDetails.some((d) =>
        d.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      m.technicalSpecs.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesLayer && matchesSearch;
  });

  const handleDownloadFullSpec = () => {
    const lines: string[] = [
      '# HELLO JOBS — COMPLETE APPLICATION OVERVIEW & TECHNICAL SPECIFICATION',
      'Direct Hands for Indian Industry · Zero-Middleman Industrial Workforce Marketplace',
      '================================================================================',
      '',
      '## 1. EXECUTIVE SUMMARY',
      'Hello Jobs connects unskilled/semi-skilled factory helpers (zero certificates required)',
      'and NCVT/SCVT-certified ITI technicians directly with GSTIN-verified manufacturing plants',
      'across India, eliminating 20%-30% contractor wage cuts and enforcing full compliance with',
      'the Digital Personal Data Protection Act, 2023 (DPDP Act, 2023).',
      '',
      '## 2. GRANULAR MODULE & FEATURE ENCYCLOPEDIA',
      '',
    ];

    modules.forEach((mod) => {
      lines.push(`### ${mod.title}`);
      lines.push(`Subtitle: ${mod.subtitle}`);
      lines.push(`Category: ${mod.badge}`);
      lines.push(`Summary : ${mod.summary}`);
      lines.push('Granular Capabilities:');
      mod.granularDetails.forEach((d) => lines.push(`  - ${d}`));
      lines.push('Technical Implementation:');
      mod.technicalSpecs.forEach((s) => lines.push(`  * ${s}`));
      lines.push('');
    });

    lines.push('## 3. COMPLETE REST API ENDPOINT SPECIFICATION (server.ts)');
    lines.push('  - GET    /api/bootstrap                  : Full state snapshot');
    lines.push('  - POST   /api/auth/worker                : Mobile OTP login & registration');
    lines.push('  - POST   /api/auth/employer              : GSTIN / HR Email authentication');
    lines.push('  - POST   /api/candidates                 : Create worker Gate-Pass profile');
    lines.push('  - PUT    /api/candidates/:id             : Update worker profile & NCVT data');
    lines.push('  - POST   /api/jobs                       : Publish factory job opening');
    lines.push('  - PUT    /api/jobs/:id                   : Update job status or vacancies');
    lines.push('  - POST   /api/applications               : 1-Click Direct Job Apply');
    lines.push('  - PATCH  /api/applications/:id/status    : Update applicant pipeline status');
    lines.push('  - POST   /api/offers                     : Issue direct digital offer letter');
    lines.push('  - PATCH  /api/offers/:id/status          : Worker Accept / Decline offer');
    lines.push('  - PUT    /api/employer                   : Update factory GSTIN profile');
    lines.push('  - POST   /api/shortlist/toggle           : Bookmark candidate to shortlist');
    lines.push('  - POST   /api/reports                    : Submit anti-exploitation report');
    lines.push('  - GET    /api/ncvt/verify?q=             : Verify NCVT Roll / Certificate No.');
    lines.push('  - PUT    /api/dpdp/consent/:workerId     : Update DPDP Sec 6 consent toggles');
    lines.push('  - PUT    /api/dpdp/nominee/:workerId     : Register DPDP Sec 14 nominee');
    lines.push('  - DELETE /api/dpdp/erase/:workerId       : Execute DPDP Sec 12 Right to Erasure');
    lines.push('  - POST   /api/dpdp/grievance             : File DPDP Sec 13 DPO grievance');
    lines.push('  - POST   /api/reset                      : Reset database to initial seed');

    const blob = new Blob([lines.join('\n')], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Hello_Jobs_Full_Application_Overview_Specification.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-6xl w-full overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Complete System Dossier
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  10 Core Modules · 20 REST Endpoints · DPDP Act 2023 Compliant
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5">
                Hello Jobs — Full-Fledged Application Overview & Feature Blueprint
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={handleDownloadFullSpec}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Spec (.md)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layer Filter Tabs & Search Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeLayer === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              All Modules (10)
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('portals')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeLayer === 'portals'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Worker & Employer Portals (5)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('compliance')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeLayer === 'compliance'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>2. DPDP Act 2023, NCVT & Governance (3)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('voice')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeLayer === 'voice'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Multilingual Voice Engine (1)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('backend')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeLayer === 'backend'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-blue-500" />
              <span>4. Backend REST API & Storage (1)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('architecture')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeLayer === 'architecture'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>System Architecture & API Table</span>
            </button>
          </div>

          {activeLayer !== 'architecture' && (
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any feature, endpoint, badge..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}
        </div>

        {/* Main Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
          {/* Interactive Quick Feature Launcher Bar */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Interactive Live Feature Launcher — Jump Directly to Any Module
              </span>
              <span className="text-[11px] text-slate-400">
                Click any button below to test that workflow live
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateRole('worker');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Worker Job Feed + Audio TTS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenModal('create-profile');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>3-Tap Easy Gate-Pass Wizard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateRole('worker-profile');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Worker Profile, Inbox & QR ID</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateRole('employer');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Employer Talent Hunter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateRole('employer-profile');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Factory Console & Offer Tracker</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenModal('dpdp');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>DPDP Act 2023 Rights Center</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenModal('ncvt-search');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>NCVT Roll No. Verify</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenModal('calculator');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wage Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenModal('report');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Whistleblower Report</span>
              </button>
            </div>
          </div>

          {activeLayer === 'architecture' ? (
            <div className="space-y-6">
              {/* ASCII System Architecture Blueprint */}
              <div className="bg-slate-950 text-slate-200 p-5 rounded-xl border border-slate-800 overflow-x-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Full-Stack System Topology & Data Lifecycle Diagram
                </h4>
                <pre className="text-[11px] font-mono leading-relaxed text-emerald-300">
{`┌───────────────────────────────────────────────────────────────────────────────────┐
│                        HELLO JOBS — CLIENT SPA (React 19 + TS)                    │
│                                                                                   │
│  ┌──────────────────┐   ┌───────────────────────┐   ┌──────────────────────────┐  │
│  │   Navbar (Top)   │   │   DualLanding View    │   │   Footer (Compliance &   │  │
│  │  • Role Switch   │   │  • Worker/Employer    │   │   Overview Triggers)     │  │
│  │  • 4-Lang Toggle │   │    Entry Split        │   │  • DPDP Rights Center    │  │
│  │  • Tool Triggers │   │  • Proof Metrics      │   │  • Platform Overview Hub │  │
│  └────────┬─────────┘   └───────────┬───────────┘   └────────────┬─────────────┘  │
│           │                         │                            │                │
│           ▼                         ▼                            ▼                │
│  ┌─────────────────────────────────────────┐   ┌───────────────────────────────┐  │
│  │           WORKER WORKFLOWS              │   │      EMPLOYER WORKFLOWS       │  │
│  │  • WorkerPortal (Job Feed + Audio TTS)  │   │  • EmployerPortal (Outbound   │  │
│  │  • SmartTradeProfileModal (3-Tap Pass)  │   │    Talent Hunt + DPDP Filter) │  │
│  │  • WorkerProfileView (Badges, Offer     │   │  • EmployerProfileView (Offer │  │
│  │    Inbox, QR Gate-Pass ID Card)         │   │    Tracker, Pipeline, GSTIN)  │  │
│  └────────────────────┬────────────────────┘   └───────────────┬───────────────┘  │
│                       │                                        │                  │
│                       ▼                                        ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │            GOVERNANCE, VERIFICATION & OVERVIEW MODALS                       │  │
│  │  • DpdpComplianceModal (Sec 5, 6, 11, 12, 13, 14 + Live Audit Ledger)       │  │
│  │  • NcvtCertificateModal & NcvtSearchModal (Roll No. & Practical Scores)     │  │
│  │  • DigitalOfferModal · PracticalVideoModal · TakeHomeCalculatorModal        │  │
│  │  • WhistleblowerModal · AuthModal · AppOverviewModal (Launcher & Spec Export)│  │
│  └─────────────────────────────────────┬───────────────────────────────────────┘  │
└────────────────────────────────────────┼──────────────────────────────────────────┘
                                         │ REST JSON API (/api/*) + 15s Polling Sync
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS FULL-STACK SERVER (server.ts : 3000)                   │
│                                                                                   │
│  • GET    /api/bootstrap                • PUT    /api/dpdp/consent/:workerId      │
│  • POST   /api/auth/worker              • PUT    /api/dpdp/nominee/:workerId      │
│  • POST   /api/auth/employer            • DELETE /api/dpdp/erase/:workerId        │
│  • POST   /api/candidates               • POST   /api/dpdp/grievance              │
│  • PUT    /api/candidates/:id           • GET    /api/ncvt/verify?q=              │
│  • POST   /api/jobs · PUT /api/jobs/:id • POST   /api/shortlist/toggle            │
│  • POST   /api/applications             • POST   /api/offers                      │
│  • PATCH  /api/applications/:id/status  • PATCH  /api/offers/:id/status           │
│  • PUT    /api/employer                 • POST   /api/reports · POST /api/reset   │
│                                         │                                         │
│                                         ▼                                         │
│              ┌─────────────────────────────────────────────────────┐              │
│              │   ATOMIC FILE PERSISTENCE (data/db.json)            │              │
│              │   jobs · candidates · offers · applications         │              │
│              │   employerProfile · shortlistedIds · reports        │              │
│              │   dpdpGrievances · dpdpAuditLogs                    │              │
│              └─────────────────────────────────────────────────────┘              │
└───────────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>

              {/* Complete REST API Reference Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Complete Backend REST API Specification (20 Endpoints in server.ts)
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    Port 3000 · Persistent JSON Store (data/db.json)
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    [
                      'GET /api/bootstrap',
                      'Returns complete live database snapshot (jobs, candidates, offers, applications, employerProfile, shortlistedIds, reports, dpdpGrievances, dpdpAuditLogs).',
                    ],
                    [
                      'POST /api/auth/worker',
                      'Authenticates worker by 10-digit mobile number or registers a new CandidateProfile with a DPDP Section 6 Consent Artifact.',
                    ],
                    [
                      'POST /api/auth/employer',
                      'Authenticates or updates the GSTIN-verified EmployerFactoryProfile.',
                    ],
                    [
                      'POST /api/candidates',
                      'Creates a new worker profile via the 3-Tap Gate-Pass Wizard and records a CONSENT_GRANTED audit log.',
                    ],
                    [
                      'PUT /api/candidates/:id',
                      'Updates worker profile details, readiness badges, machines handled, and NCVT credentials.',
                    ],
                    [
                      'POST /api/jobs',
                      'Publishes a new factory job opening to the live Worker Job Feed.',
                    ],
                    [
                      'PUT /api/jobs/:id',
                      'Toggles job active/closed status or updates remaining vacancy count.',
                    ],
                    [
                      'POST /api/applications',
                      'Submits a 1-Click Direct Job Application and decrements vacanciesLeft on the target job.',
                    ],
                    [
                      'PATCH /api/applications/:id/status',
                      'Advances application status (Applied → Shortlisted → Offer Issued → Hired / Rejected).',
                    ],
                    [
                      'POST /api/offers',
                      'Issues a binding Digital Offer Letter and marks matching job applications as Offer Issued.',
                    ],
                    [
                      'PATCH /api/offers/:id/status',
                      'Worker accepts or declines a Digital Offer Letter; accepting marks the application as Hired.',
                    ],
                    [
                      'PUT /api/employer',
                      'Updates Factory GSTIN, Udyam number, HR contacts, welfare perks, and plant showcase photos.',
                    ],
                    [
                      'POST /api/shortlist/toggle',
                      'Adds or removes a candidateId from the employer shortlist pool.',
                    ],
                    [
                      'POST /api/reports',
                      'Records an anti-exploitation whistleblower report against a middleman or agency.',
                    ],
                    [
                      'GET /api/ncvt/verify?q=',
                      'Searches candidates by NCVT Roll Number, Certificate Number, or Name and logs a DPDP DATA_EXPORTED audit entry.',
                    ],
                    [
                      'PUT /api/dpdp/consent/:workerId',
                      'Updates granular DPDP Section 6(4) consent toggles or withdraws all consent.',
                    ],
                    [
                      'PUT /api/dpdp/nominee/:workerId',
                      'Registers a Section 14 Digital Data Nominee for the worker.',
                    ],
                    [
                      'DELETE /api/dpdp/erase/:workerId',
                      'Executes Section 12 Right to Erasure: permanently purges worker profile, applications, offers, and shortlist references.',
                    ],
                    [
                      'POST /api/dpdp/grievance',
                      'Submits a Section 13 DPO Grievance Ticket with a 7-day statutory resolution SLA.',
                    ],
                    [
                      'POST /api/reset',
                      'Resets data/db.json back to the clean initial seed dataset.',
                    ],
                  ].map(([endpoint, desc]) => (
                    <div
                      key={endpoint}
                      className="grid grid-cols-1 md:grid-cols-12 p-3 gap-2 items-center hover:bg-slate-50"
                    >
                      <span className="md:col-span-4 font-mono font-bold text-blue-700">
                        {endpoint}
                      </span>
                      <span className="md:col-span-8 text-slate-700">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-400">
                          {mod.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {mod.subtitle}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {mod.title}
                      </h4>
                    </div>

                    {mod.actionLabel && mod.onTrigger && (
                      <button
                        type="button"
                        onClick={mod.onTrigger}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shrink-0 cursor-pointer"
                      >
                        <span>{mod.actionLabel}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {mod.summary}
                  </p>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Granular Features & Functions:
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {mod.granularDetails.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {mod.technicalSpecs.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
