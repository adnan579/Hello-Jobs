# Hello Jobs — Direct Hands for Indian Industry
### Full-Fledged Application Overview, Feature Encyclopedia & Technical Architecture Blueprint

**Hello Jobs** is a full-stack, zero-middleman industrial workforce marketplace engineered for India's manufacturing ecosystem. It connects **unskilled/semi-skilled shop-floor helpers** (packers, loaders, assembly hands with zero certificates) and **NCVT/SCVT-certified ITI technicians** (CNC/VMC operators, fitters, welders, machinists, industrial electricians) directly with **GSTIN-verified manufacturing plants** across India's major industrial corridors—eliminating the *thekedar* (labor contractor) commission layer and enforcing full compliance with the **Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)**.

---

## Table of Contents

1. [Core Mission & Problem Solved](#1-core-mission--problem-solved)
2. [System Architecture & Full-Stack Topology](#2-system-architecture--full-stack-topology)
3. [Layer 1: Complete Worker & Employer Portal Workflows & UI Features](#3-layer-1-complete-worker--employer-portal-workflows--ui-features)
   - [3.1 Top Navigation Bar (`Navbar.tsx`)](#31-top-navigation-bar-navbartsx)
   - [3.2 Dual Landing Portal (`DualLanding.tsx`)](#32-dual-landing-portal-duallandingtsx)
   - [3.3 Worker Portal — Inbound Job Feed (`WorkerPortal.tsx`)](#33-worker-portal--inbound-job-feed-workerportaltsx)
   - [3.4 3-Tap Easy Worker Gate-Pass Wizard (`SmartTradeProfileModal.tsx`)](#34-3-tap-easy-worker-gate-pass-wizard-smarttradeprofilemodaltsx)
   - [3.5 Worker Profile, Offer Inbox & QR Digital ID Card (`WorkerProfileView.tsx`)](#35-worker-profile-offer-inbox--qr-digital-id-card-workerprofileviewtsx)
   - [3.6 Employer Portal — Outbound Talent Hunter & Inbound Postings (`EmployerPortal.tsx`)](#36-employer-portal--outbound-talent-hunter--inbound-postings-employerportaltsx)
   - [3.7 Employer Factory Console & Pipeline Manager (`EmployerProfileView.tsx`)](#37-employer-factory-console--pipeline-manager-employerprofileviewtsx)
   - [3.8 Post Factory Vacancy Modal (`PostJobModal.tsx`)](#38-post-factory-vacancy-modal-postjobmodaltsx)
   - [3.9 Dual Instant Authentication Modal (`AuthModal.tsx`)](#39-dual-instant-authentication-modal-authmodaltsx)
   - [3.10 Direct Digital Offer Letter Modal (`DigitalOfferModal.tsx`)](#310-direct-digital-offer-letter-modal-digitaloffermodaltsx)
   - [3.11 30-Second Practical Shop-Floor Video Demo Modal (`PracticalVideoModal.tsx`)](#311-30-second-practical-shop-floor-video-demo-modal-practicalvideomodaltsx)
4. [Layer 2: DPDP Act 2023 Compliance, NCVT Verification & Anti-Exploitation Governance](#4-layer-2-dpdp-act-2023-compliance-ncvt-verification--anti-exploitation-governance)
   - [4.1 DPDP Act 2023 Privacy, Consent & Data Principal Rights Center (`DpdpComplianceModal.tsx`)](#41-dpdp-act-2023-privacy-consent--data-principal-rights-center-dpdpcompliancemodaltsx)
   - [4.2 DGT / NCVT MIS Certificate & Roll Number Verification (`NcvtCertificateModal.tsx` & `NcvtSearchModal.tsx`)](#42-dgt--ncvt-mis-certificate--roll-number-verification-ncvtcertificatemodaltsx--ncvtsearchmodaltsx)
   - [4.3 Zero-Middleman vs. Thekedar Wage Calculator (`TakeHomeCalculatorModal.tsx`)](#43-zero-middleman-vs-thekedar-wage-calculator-takehomecalculatormodaltsx)
   - [4.4 Anti-Exploitation & Whistleblower Reporting Portal (`WhistleblowerModal.tsx`)](#44-anti-exploitation--whistleblower-reporting-portal-whistleblowermodaltsx)
5. [Layer 3: Multilingual Voice Engine, Audio Narration Scripts & Accessibility Mechanics](#5-layer-3-multilingual-voice-engine-audio-narration-scripts--accessibility-mechanics)
   - [5.1 4-Language Localization Matrix (`translations.ts`)](#51-4-language-localization-matrix-translationsts)
   - [5.2 Web Speech API Audio Narrator Engine (`audioNarrator.ts`)](#52-web-speech-api-audio-narrator-engine-audionarratorts)
   - [5.3 Dynamic Spoken Job Card Narration Templates](#53-dynamic-spoken-job-card-narration-templates)
   - [5.4 Contextual 1-Tap Voice Guide Scripts](#54-contextual-1-tap-voice-guide-scripts)
6. [Layer 4: Full-Stack Backend REST API, Data Models & Storage Architecture](#6-layer-4-full-stack-backend-rest-api-data-models--storage-architecture)
   - [6.1 Complete TypeScript Data Model Reference (`src/types/index.ts`)](#61-complete-typescript-data-model-reference-srctypesindexts)
   - [6.2 Express REST API Endpoint Reference (`server.ts`)](#62-express-rest-api-endpoint-reference-serverts)
   - [6.3 Atomic JSON Persistence & Seed Reconciliation Engine (`data/db.json`)](#63-atomic-json-persistence--seed-reconciliation-engine-datadbjson)
   - [6.4 Pre-Seeded Industrial Dataset (`initialData.ts`)](#64-pre-seeded-industrial-dataset-initialdatats)

---

## 1. Core Mission & Problem Solved

In Indian industrial hubs, middlemen contractors (*thekedars*) traditionally sit between factory HR departments and shop-floor workers:
- **20% to 30% Monthly Wage Leakage**: A factory budgets ₹24,000/month per technician, but the contractor hands over ₹17,500 in cash while pocketing up to ₹6,500/month per worker.
- **Evaded Statutory Benefits**: Provident Fund (EPFO) and ESIC contributions are frequently withheld or misreported.
- **Credential Blindness**: Unverified operators are placed on expensive CNC/VMC and hydraulic press lines, causing machine crashes and high scrap rates.
- **High Barrier for Unskilled Hands**: Complex resume portals exclude hardworking helpers, packers, and loaders who do not hold paper certificates.

**Hello Jobs** replaces this broken chain with a **Direct Two-Way Marketplace**:
1. **Inbound Mode (For Workers)**: Browse verified plant openings with exact in-hand salary, gross CTC, hourly overtime rates, hostel/canteen perks, and 1-tap voice narration in **English, Hindi, Marathi, and Tamil**.
2. **Outbound Mode (For Employers)**: Search verified helpers (by Work-Readiness Stamina Badges) and ITI technicians (by NCVT Roll Number, machine controls, and 30s practical video demos), and issue direct digital offer letters.

---

## 2. System Architecture & Full-Stack Topology

```
┌───────────────────────────────────────────────────────────────────────────────────┐
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
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1: Complete Worker & Employer Portal Workflows & UI Features

### 3.1 Top Navigation Bar (`Navbar.tsx`)
- **3-Zone Layout Contract**:
  1. **Left Brand Zone**: Displays the `HJ` Safety Amber badge, `Hello Jobs` title, and localized subtitle (`Direct Hands for Indian Industry`). Clicking stops any active Web Speech API audio narration and returns to `landing`.
  2. **Center Navigation Links**:
     - `Home` (`currentRole === 'landing'`)
     - `For Workers (Jobs)` (`currentRole === 'worker'`)
     - `For Employers (Hire)` (`currentRole === 'employer'`)
     - `NCVT Verify` (Opens `NcvtSearchModal`)
     - `Wage Calculator` (Opens `TakeHomeCalculatorModal`)
  3. **Right Language & Account Zone**:
     - **4-Language Segmented Switcher**: `English (en)`, `हिंदी (hi)`, `मराठी (mr)`, `தமிழ் (ta)`. Immediately updates all UI strings and stops ongoing voice synthesis.
     - **Session-Aware Account Button**:
       - When logged in as **Worker** (`authSession.role === 'worker'`): Renders `My Profile (<Worker First Name>)` in Safety Amber, navigating to `worker-profile`.
       - When logged in as **Employer** (`authSession.role === 'employer'`): Renders `Factory Console` in Industrial Blue, navigating to `employer-profile`.
       - When unauthenticated: Renders `Login / Register`, opening `AuthModal`.

---

### 3.2 Dual Landing Portal (`DualLanding.tsx`)
- **Hero Section**:
  - **Government & Regulatory Kickers**:
    - DGT / ITI Skill India Alignment statement.
    - Interactive **`DPDP Act 2023 Compliant · Data Rights & Consent Center`** badge (`onOpenDpdpModal`).
    - Interactive **`Full Application Overview & Architecture Blueprint`** badge (`onOpenOverviewModal`).
  - **Dual Portal Entry Split Cards**:
    - **Card 1 — Worker Portal (`I Need a Factory Job`)**:
      - Key promises: `100% FREE FOR WORKERS`, voice job cards in 4 languages, QR-verified Digital ITI Worker ID Card & Offer Inbox, zero wage deductions.
      - Primary CTA: `Explore Verified Factory Jobs` (`onSelectRole('worker')`).
      - Secondary CTA: `Open My Worker Profile & Offer Inbox` (if authenticated) or `Worker Login (Mobile OTP) & Digital ITI ID Card`.
    - **Card 2 — Employer Portal (`I Need Skilled Workers`)**:
      - Key promises: `GSTIN VERIFIED PLANTS`, machine-control filtering (Fanuc, Siemens, Haas, Hydraulic Press), verified GSTIN/Udyam profile & shop-floor showcase, direct digital offer letters.
      - Primary CTA: `Post Vacancies or Hunt Talent` (`onSelectRole('employer')`).
      - Secondary CTA: `Open Factory Console` (if authenticated) or `Employer Login (GSTIN / HR Email) & Factory Profile`.
- **4 Quantitative Proof Metrics Strip**:
  - `₹0.00` — Commission Cut (`100% of wages go directly to the worker's bank account`).
  - `24,500+` — Verified Technicians (`NCVT & SCVT certified across 8 core trades`).
  - `520+` — Direct Factory Plants (`Auto, CNC, EV, Electronics & Heavy Engineering`).
  - `48 Hours` — Average Joining Time (`Direct digital offer letter to shop-floor onboarding`).
- **Thekedar Trap vs. Hello Jobs Direct Comparison Table**:
  - Side-by-side breakdown of contractor exploitation vs. direct payroll transparency, paired with a direct link to the **Zero-Middleman Wage Calculator**.
- **National Workforce Corridor Pipeline**:
  - Maps **Talent Origin Corridors** (Uttar Pradesh, Bihar, Madhya Pradesh, Rajasthan & Odisha ITIs) to **Active Manufacturing Hubs** (Pune & Chakan MIDC, NCR Noida & Manesar, Sanand GIDC Gujarat, Chennai & Sriperumbudur).

---

### 3.3 Worker Portal — Inbound Job Feed (`WorkerPortal.tsx`)
- **Top Accessibility & Quick-Entry Banner**:
  - **1-Tap Voice Guide (`Listen: How to Use This Page`)**: Plays spoken navigation instructions in the active language (`worker-feed` script).
  - **3-Tap Quick Gate-Pass Button**: Opens `SmartTradeProfileModal` for instant zero-document registration.
  - **Worker Profile / Inbox Button**: Displays pending offer count (`Offers Pending`) or opens OTP login.
- **3-Tier Workforce Category Selector**:
  1. **All Factory Jobs**: Displays all active openings (`totalActiveJobs`).
  2. **No Certificate / Helper & Packing Jobs**: Filters jobs where `category !== 'skilled'` or `noCertificateRequired === true`. Designed specifically for unskilled and semi-skilled workers (`unskilledCount`).
  3. **ITI & Skilled Machine Operator Jobs**: Filters jobs where `category === 'skilled'` (`skilledCount`).
- **Search & Multi-Filter Bar**:
  - **Keyword Search**: Matches `title`, `companyName`, `trade`, or `industrialHub`.
  - **Trade Quick-Pills**: `All Trades`, `Packing & Box Loading (No Certificate)`, `Factory Floor Helper (No Certificate)`, `Assembly Line Helper`, `CNC / VMC Operator`, `Fitter (Assembly & Bench)`, `Welder (MIG / TIG / ARC)`, `Machinist (Lathe / Milling)`, `Industrial Electrician`.
  - **Industrial Hub Dropdown**: `all`, `Pune / Chakan MIDC`, `Manesar / Gurugram NCR`, `Noida / Greater Noida`, `Sanand / Ahmedabad GIDC`, `Chennai / Sriperumbudur`, `Hosur Industrial Corridor`.
  - **Facility Checkboxes**:
    - `Free/Subsidized Hostel` (`job.benefits.accommodationProvided`)
    - `Shift Canteen Meals` (`job.benefits.canteenProvided`)
- **Shop-Floor Job Card Anatomy**:
  - **Top Status Line**:
    - `NO CERTIFICATE NEEDED · DIRECT JOINING` (emerald badge) or `ITI / NCVT Verified Role` (amber badge).
    - Employment Type (`Direct Payroll` vs. `Fixed Term Contract`).
    - `Urgent Joining` indicator (`job.urgentHiring`).
  - **Vernacular Audio Narrator Button**:
    - Toggles live Web Speech API voice readout (`playJobAudio` / `stopJobAudio`) for that specific job card in English, Hindi, Marathi, or Tamil.
  - **Company & Location Metadata**:
    - Company Name, GSTIN Verification Checkmark, Industrial Hub, Exact Plant Address, and Posted Timestamp.
  - **3-Column Salary & Overtime Breakdown Box**:
    - **Monthly In-Hand (`takeHomeSalary`)**: Net take-home pay in `₹/mo` (`tabular-nums`).
    - **Gross CTC (`grossSalary`)**: Total monthly cost including Employer PF (`pfIncluded`) & ESIC (`esiIncluded`).
    - **Overtime Rate (`overtimeRatePerHour`)**: Explicit hourly rate in `₹/hr` + shift schedule (`8-Hour Rotational`, `12-Hour High-OT`, `General Day Shift`).
  - **Perks & Equipment Strip**:
    - Displays `Free/Subsidized Hostel`, `Shift Canteen Meals`, `Company Bus`, `Medical Insurance`, `Annual Bonus`, and `Skills / Tasks: <equipmentTested>`.
  - **Bottom Action Bar**:
    - Vacancy counter (`X of Y slots open`) + `Zero Middleman Cut` guarantee.
    - `Report middleman / fee demand` link (opens `WhistleblowerModal` pre-populated with `job.companyName`).
    - **`1-Click Direct Apply`** button (`onApplyJob(job)`): Creates a `JobApplication` record on the backend, decrements `vacanciesLeft`, and transitions button state to `Applied — Track in Worker Inbox`.

---

### 3.4 3-Tap Easy Worker Gate-Pass Wizard (`SmartTradeProfileModal.tsx`)
Engineered so unskilled, semi-skilled, and skilled workers can create a verified profile in under 30 seconds without uploading PDF resumes:
- **Header Audio Assistant**: 1-tap `Listen: How to Fill` voice guide (`profile-wizard` script).
- **Tap 1 — Pick Your Work Type (8 Visual Cards)**:
  - **Group A: No Certificate Needed (Direct Joining)**:
    - `Packing & Box Loading (No Certificate)` (`unskilled`, `₹15,500–₹18,500/mo`)
    - `Factory Floor Helper (No Certificate)` (`unskilled`, `₹15,000–₹18,000/mo`)
    - `Assembly Line Helper` (`semi-skilled`, `₹16,000–₹19,000/mo`)
    - `Machine Helper (Semi-Skilled)` (`semi-skilled`, `₹17,000–₹20,500/mo`)
  - **Group B: ITI / Skilled Machine Operator Roles**:
    - `CNC / VMC Operator` (`skilled`, `₹21,000–₹28,000/mo`)
    - `Welder (MIG / TIG / ARC)` (`skilled`, `₹19,500–₹26,000/mo`)
    - `Fitter (Assembly & Bench)` (`skilled`, `₹19,000–₹24,500/mo`)
    - `Industrial Electrician` (`skilled`, `₹19,500–₹25,000/mo`)
- **Tap 2 — Select Work-Readiness Stamina Badges**:
  - 6 visual toggle badges that prove floor reliability to employers even without paper certificates:
    - `Mobile OTP Verified`
    - `Immediate Joiner`
    - `12-Hr Shift Stamina`
    - `Heavy Packing & Loading Ready`
    - `Hostel / Outstation Ready`
    - `Night Shift Ready`
- **Tap 3 — Name, Mobile, Salary & DPDP Act 2023 Consent**:
  - **Core Inputs**: Full Name, 10-Digit Mobile Number, Current City, Home State (`Uttar Pradesh`, `Bihar`, `Madhya Pradesh`, `Maharashtra`, `Rajasthan`, `Odisha`, `Tamil Nadu`, `Gujarat`, `Haryana`), Experience Years, and Expected Monthly In-Hand Salary slider (`₹14,000` to `₹32,000`).
  - **Progressive Disclosure for ITI Credentials**: Expandable checkbox (`I have an NCVT / ITI Roll Number to attach`) revealing NCVT Roll Number and ITI College inputs.
  - **Mandatory DPDP Act 2023 Section 5 & 6 Consent Box**:
    - Displays plain-language itemized notice explaining data collected, purpose (direct factory recruitment), and right to withdraw or erase data.
    - Includes 1-tap `Listen to Notice` audio button (`dpdp-notice` script).
    - Generates a timestamped `DpdpConsentSettings` artifact upon submission.

---

### 3.5 Worker Profile, Offer Inbox & QR Digital ID Card (`WorkerProfileView.tsx`)
- **Identity Header Card**:
  - Displays Avatar initials, Name, Verification badge (`NCVT Grade Certified` vs. `No Certificate Needed · Work-Readiness Verified`), `Mobile OTP Verified` tag, Trade, Category, Location, and Phone.
  - **Header Action Buttons**:
    1. `Voice Guide: Listen to Page` (`worker-profile` script)
    2. `DPDP Privacy, Consent & Nominee Rights` (Opens `DpdpComplianceModal`)
    3. `View NCVT Certificate` (Opens `NcvtCertificateModal` if verified)
    4. `Browse Factory Jobs`
    5. `Sign Out`
- **Tab 1 — Easy Profile & Work-Readiness Badges**:
  - Full live editor for Worker Name, Mobile Number, Work Type / Trade (14 trades), Skill Category (`unskilled` / `semi-skilled` / `skilled`), Expected In-Hand Salary, Floor Experience Years, Current City, Home State, `Willing to Relocate Inter-State` toggle, `Immediate Joiner` toggle, Work-Readiness Badges selector, Machines/Tasks Handled tag list, Practical Video Demo Title, Bio/Summary, and Progressive NCVT Certificate Editor (Certificate Number, Roll Number, ITI College, State Directorate, Passing Year, Grade `A+`/`A`/`B`, Practical Score `/250`, Theory Score `/100`).
- **Tab 2 — Applied Jobs & Offer Letters Inbox**:
  - **Digital Offer Letters Inbox**: Displays formal offer letters issued by factories (`OfferLetter`), including Company Name, Designation, Hub, Issue Date, Joining Date, In-Hand Salary, Overtime Rate, Hostel/Canteen perks, and interactive **`Accept Offer & Confirm Joining`** or **`Decline Offer`** buttons.
  - **Applied Jobs History**: Displays all submitted `JobApplication` records with live status badges (`Applied`, `Shortlisted`, `Offer Issued`, `Hired`, `Rejected`).
- **Tab 3 — QR Digital Worker Gate-Pass ID Card**:
  - Renders an official, shop-floor-ready Digital Gate-Pass ID Card with a deterministic 6x6 SVG QR verification matrix, Worker Identity, NCVT Roll Number or Zero-Document Readiness status, Readiness Badges, and **`Download Official Gate-Pass (.txt)`** / **`Print ID Card`** buttons.

---

### 3.6 Employer Portal — Outbound Talent Hunter & Inbound Postings (`EmployerPortal.tsx`)
- **Plant Hiring Console Header**:
  - Shows authenticated Factory Name & GSTIN (`Mahindra CIE Automotive — Chakan Stamping Division · GSTIN: 27AABCM1234F1Z5`), Shortlisted candidate counter, `Factory Profile & Hiring Console` button, and `+ Post Factory Vacancy` button.
- **Mode 1 — Outbound Talent Hunter (`Candidate Directory`)**:
  - **Real-Time DPDP Section 6(4) Privacy Filter**: Automatically filters out any worker where `dpdpConsent.isWithdrawn === true` or `dpdpConsent.directoryDiscovery === false`.
  - **Quick Workforce Category Toggle**:
    - `All Workers`
    - `Helpers, Packers & Loaders (Work-Readiness Verified)`
    - `ITI & Skilled Machine Operators`
  - **Multi-Criteria Filter Panel**:
    - Search by candidate name, trade, city, state, or specific machine model (e.g., `Fanuc`, `Fronius`, `Mitutoyo`).
    - Trade filter buttons.
    - `NCVT / SCVT Verified Only` checkbox.
    - `Willing to Relocate Inter-State` checkbox.
    - `Max Wage` slider (`₹15,000`–`₹35,000/mo`).
  - **Candidate Profile Cards**:
    - Displays Avatar, Name, Trade, Experience Years, `Shortlist` toggle button, NCVT Grade or Work-Readiness Verification status, City & Home State, Expected Salary, **`DPDP Consent Active`** badge, Work-Readiness Stamina Badges, Machines/Tasks Handled tags, and action buttons:
      - `View NCVT Card` (`onInspectCertificate`)
      - `30s Practical Demo` (`onOpenVideoDemo`)
      - `Issue Direct Offer` (`onOpenIssueOffer`)
- **Mode 2 — Inbound Active Plant Postings**:
  - Tabular view of all posted factory openings showing Job Designation, Plant Name, Hub, Industrial Trade, Monthly In-Hand Salary, and Remaining Vacancies (`vacanciesLeft` of `openingsCount`).

---

### 3.7 Employer Factory Console & Pipeline Manager (`EmployerProfileView.tsx`)
- **Tab 1 — Sent Offers & Applicant Pipeline**:
  - **Sent Digital Offer Letters Tracker**: Lists every offer letter issued by the plant with candidate name, trade, salary, joining date, and live worker response status (`Issued`, `Accepted`, `Declined`).
  - **Inbound Job Applicants Pipeline**: Lists every worker who clicked `1-Click Direct Apply` on the plant's jobs, with instant status actions:
    - `Shortlist` (`PATCH /api/applications/:id/status` → `Shortlisted`)
    - `Issue Offer` (Opens `DigitalOfferModal` for that applicant)
    - `Reject` (`PATCH /api/applications/:id/status` → `Rejected`)
  - **Shortlisted Candidates Pool**: Displays all bookmarked candidates from the Talent Hunter directory with 1-click offer issuance or removal.
- **Tab 2 — Manage Posted Bulk Job Openings**:
  - Allows HR managers to pause/re-open job postings (`Active` vs. `Closed`) or adjust vacancy counts (`+1` / `-1` slots) in real time (`PUT /api/jobs/:id`).
- **Tab 3 — Verified Factory Profile & Plant Showcase**:
  - Full form to update Legal Company Name, 15-Digit GSTIN, Udyam Registration Number, Industry Sector, Industrial Hub, Full Plant Address, HR Contact Person, HR Phone, HR Email, Total Plant Strength, Plant Description, Worker Welfare Checkboxes (`Free/Subsidized Hostel`, `Shift Canteen`, `Employee Bus`, `Apprenticeship Recognized`), and Shop-Floor Photo Gallery URLs (`PUT /api/employer`).

---

### 3.8 Post Factory Vacancy Modal (`PostJobModal.tsx`)
- Allows employers to publish new bulk shop-floor openings (`POST /api/jobs`) with:
  - Job Title, Company Name, Industrial Hub, Exact Location, Trade, Skill Category (`unskilled`, `semi-skilled`, `skilled`), `No Certificate Required` toggle, Employment Type (`Direct Payroll` vs. `Fixed Term Contract`), Monthly Take-Home Salary, Gross CTC, Overtime Rate/hr, Shift Type, Total Openings Count, Equipment/Tasks Tested (comma-separated), and Welfare Perks (`Hostel`, `Canteen`, `Transport Bus`).

---

### 3.9 Dual Instant Authentication Modal (`AuthModal.tsx`)
- **Worker Mobile OTP Tab**:
  - Enter 10-digit mobile number (or pick a quick demo worker account) → Receive instant 4-digit OTP (`1234`).
  - If the mobile number is new, prompts for Worker Name & Primary Trade/Work Type.
  - Enforces **DPDP Act 2023 Section 5 & 6 Consent Notice** before login/registration.
- **Employer GSTIN / HR Email Tab**:
  - Authenticates factory HR managers via 15-digit GSTIN (`27AABCM1234F1Z5`), Company Name, and Corporate HR Email (`POST /api/auth/employer`).

---

### 3.10 Direct Digital Offer Letter Modal (`DigitalOfferModal.tsx`)
- Generates a standardized, zero-middleman digital appointment letter for any selected candidate:
  - Configurable Factory Name, Job Role, Industrial Hub, Joining Date, Monthly Net Take-Home Salary, Overtime Hourly Rate, Free Hostel inclusion, and Shift Canteen inclusion.
  - Persists to `POST /api/offers`, automatically updates matching job applications to `Offer Issued`, and provides a printable/downloadable offer summary.

---

### 3.11 30-Second Practical Shop-Floor Video Demo Modal (`PracticalVideoModal.tsx`)
- Simulates a 30-second shop-floor practical skill demonstration for a candidate (`videoDemoTitle`), highlighting verified practical checkpoints (e.g., Vernier/Micrometer zero-error verification, CNC G-code offset entry, weld bead uniformity) with a direct CTA to issue an offer letter.

---

## 4. Layer 2: DPDP Act 2023 Compliance, NCVT Verification & Anti-Exploitation Governance

### 4.1 DPDP Act 2023 Privacy, Consent & Data Principal Rights Center (`DpdpComplianceModal.tsx`)
Implements India's **Digital Personal Data Protection Act, 2023** across 4 dedicated statutory modules:

| DPDP Act Section | Statutory Requirement | Implementation in Hello Jobs |
| :--- | :--- | :--- |
| **Section 5** | **Itemized Notice in Plain Language & Eighth Schedule Languages** | Presents an itemized notice detailing exact personal data collected (Name, Mobile, Trade, NCVT Roll No., Location) and purpose (Direct Factory Recruitment) in **English, Hindi, Marathi, and Tamil**, plus a **1-Tap Voice Readout (`dpdp-notice`)** for semi-skilled/unskilled accessibility. |
| **Section 6** | **Free, Specific, Informed, Unconditional & Unambiguous Consent** | Generates a unique timestamped **Consent Artifact (`CONSENT-DPDP-2026-*`)** during Worker OTP Login and 3-Tap Gate-Pass creation. |
| **Section 6(4)** | **Right to Withdraw Consent as Easily as Given** | Provides **3 Granular Purpose Toggles** (*Employer Talent Directory Discovery*, *Direct HR Phone & WhatsApp Contact*, *NCVT & Readiness Badge Verification*) and a **1-Tap Withdraw All Consent** button (`PUT /api/dpdp/consent/:workerId`). Withdrawing consent immediately removes the worker from Employer Talent Hunter search results. |
| **Section 11** | **Right to Access Information about Personal Data & Data Fiduciaries** | Displays a live inventory of all personal data stored and an itemized **Data Fiduciary Sharing Ledger** listing every GSTIN-verified factory that received the worker's job application or issued an offer letter, plus a **Download Portable JSON Summary** button. |
| **Section 12** | **Right to Correction & Erasure ("Forget Me")** | Workers can edit/correct all profile fields in `WorkerProfileView` or execute **2-Step Confirmed Permanent Data Erasure** (`DELETE /api/dpdp/erase/:workerId`), which purges their profile, job applications, digital offers, and employer shortlist entries and logs an anonymized erasure receipt. |
| **Section 13** | **Right to Grievance Redressal & Data Protection Officer (DPO)** | Dedicated DPO Desk (`Er. Rajeshwar Kulkarni, CIPP/A · dpo@hellojobs.in`) with a **7-Day Statutory SLA**, interactive grievance filing form (`POST /api/dpdp/grievance`), ticket tracker, and escalation guidance for the **Data Protection Board of India (DPBI)**. |
| **Section 14** | **Right to Nominate** | Allows workers to register a designated family nominee (`DpdpNominee`: Full Name, Relationship — *Spouse, Father, Mother, Son, Daughter, Sibling, Legal Heir* — and 10-digit Mobile Number) via `PUT /api/dpdp/nominee/:workerId` to exercise their data rights in the event of death or incapacity. |

---

### 4.2 DGT / NCVT MIS Certificate & Roll Number Verification (`NcvtCertificateModal.tsx` & `NcvtSearchModal.tsx`)
- **NCVT Search Modal (`NcvtSearchModal.tsx`)**:
  - Allows employers or verifiers to search candidates by **NCVT Roll Number** (`R220809104421`), **Certificate Number** (`NCVT/2022/UP/884920`), or **Technician Name**.
- **Official NCVT Certificate Inspector (`NcvtCertificateModal.tsx`)**:
  - Renders an authenticated digital facsimile of the Directorate General of Training (DGT) National Trade Certificate:
    - Certificate Number & NCVT MIS Roll Number
    - Certified Engineering Trade Name & Passing Year
    - ITI Institute Name & State Directorate
    - Overall Trade Grade (`A+`, `A`, `B`)
    - **Trade Practical Score (`out of 250`)** & **Trade Theory Score (`out of 100`)**
    - QR Verification Seal & Direct Payroll Eligibility stamp.

---

### 4.3 Zero-Middleman vs. Thekedar Wage Calculator (`TakeHomeCalculatorModal.tsx`)
- **Interactive Inputs**:
  1. `Factory Monthly CTC Budget per Worker`: Slider (`₹15,000` to `₹40,000`, step `₹500`).
  2. `Middleman (Thekedar) Commission Cut`: Slider (`10%` to `35%`, default `22%`).
  3. `Monthly Overtime Hours Worked`: Slider (`0` to `60 hours`, step `5 hours`).
- **Exact Financial Formulas**:
  - `hourlyOvertimeRate = Math.round((factoryMonthlyBudget / 26 / 8) * 1.5)` (1.5x statutory shop-floor overtime rate)
  - `overtimeEarnings = overtimeHours * hourlyOvertimeRate`
  - `thekedarCutAmount = Math.round((factoryMonthlyBudget * thekedarCommissionPct) / 100)`
  - `thekedarOvertimeSkim = Math.round(overtimeEarnings * 0.25)` (25% contractor skim on OT hours)
  - `netUnderThekedar = factoryMonthlyBudget - thekedarCutAmount + (overtimeEarnings - thekedarOvertimeSkim)`
  - `netOnHelloJobs = factoryMonthlyBudget + overtimeEarnings` (100% direct transfer)
  - `monthlyLoss = netOnHelloJobs - netUnderThekedar`
  - `annualLoss = monthlyLoss * 12`

---

### 4.4 Anti-Exploitation & Whistleblower Reporting Portal (`WhistleblowerModal.tsx`)
- Protects workers against illegal contractor registration fees, salary skimming, or misleading hostel promises:
  - Captures `Offending Contractor / Agency / Plant Name`, `Industrial Hub`, `Violation Category` (*Demanded Registration / Entry Fee*, *Monthly Salary Commission Cut*, *Withheld PF / ESIC Deposit*, *Fake Salary / Hostel Promise*), `Incident Description`, and optional `Worker Contact Phone`.
  - Submits directly to `POST /api/reports` and generates a compliance reference ticket (`WB-2026-*`).

---

## 5. Layer 3: Multilingual Voice Engine, Audio Narration Scripts & Accessibility Mechanics

### 5.1 4-Language Localization Matrix (`translations.ts`)
- Full UI dictionary (`TRANSLATIONS`) and spoken script generator supporting:
  - **English (`en` → `en-IN`)**
  - **Hindi (`hi` → `hi-IN`)**
  - **Marathi (`mr` → `mr-IN`)**
  - **Tamil (`ta` → `ta-IN`)**

### 5.2 Web Speech API Audio Narrator Engine (`audioNarrator.ts`)
- Uses `window.speechSynthesis` with automatic Indian regional voice matching (`lang.startsWith('hi')`, `lang.startsWith('mr')`, `lang.startsWith('ta')`, `en-IN`), speech rate tuned to `0.95` for clear shop-floor comprehension, and safe fallback timers if speech synthesis is unavailable in a headless browser.

### 5.3 Dynamic Spoken Job Card Narration Templates
When a worker taps `Listen in हिंदी / मराठी / தமிழ் / English` on any job card, `buildJobNarrationText(job, lang)` dynamically constructs a natural-language voice readout announcing:
1. Job Title, Company Name, and Industrial Hub.
2. Exact Monthly In-Hand Salary (`takeHomeSalary`), Gross Salary (`grossSalary`), and Hourly Overtime Rate (`overtimeRatePerHour`).
3. Shift Pattern and whether Free Hostel and Shift Canteen meals are provided.
4. Explicit confirmation that there is **zero thekedar commission cut**.

### 5.4 Contextual 1-Tap Voice Guide Scripts (`getVoiceGuideScript`)
- `'worker-feed'`: Explains how to filter between No-Certificate Helper jobs and ITI Operator jobs, listen to audio job cards, and apply in 1 tap.
- `'profile-wizard'`: Guides unskilled and skilled workers through the 3-tap visual Gate-Pass wizard.
- `'worker-profile'`: Explains how to update work-readiness badges, accept digital offer letters in the inbox, and download the QR Gate-Pass ID card.
- `'dpdp-notice'`: Reads out the statutory DPDP Act 2023 Section 5 & 6 privacy notice, purpose limitation, and right to withdraw consent or erase data in 1 tap.

---

## 6. Layer 4: Full-Stack Backend REST API, Data Models & Storage Architecture

### 6.1 Complete TypeScript Data Model Reference (`src/types/index.ts`)
- **`JobListing`**: `id`, `title`, `companyName`, `companyVerified`, `gstin`, `industrialHub`, `exactLocation`, `trade`, `category` (`unskilled` | `semi-skilled` | `skilled`), `noCertificateRequired`, `employmentType`, `takeHomeSalary`, `grossSalary`, `overtimeRatePerHour`, `shiftType`, `pfIncluded`, `esiIncluded`, `benefits` (`accommodationProvided`, `canteenProvided`, `transportProvided`, `medicalInsurance`, `annualBonus`), `equipmentTested[]`, `openingsCount`, `vacanciesLeft`, `urgentHiring`, `postedAgo`, `isActive`.
- **`CandidateProfile`**: `id`, `name`, `phone`, `avatarSeed`, `trade`, `category`, `readinessBadges[]`, `currentCity`, `homeState`, `willingToRelocate`, `experienceYears`, `expectedSalary`, `ncvtCertificate` (`certificateNumber`, `rollNumber`, `tradeName`, `itiCollege`, `stateDirectorate`, `passingYear`, `grade`, `isVerified`, `practicalScore`, `theoryScore`), `machinesOperated[]`, `hasVideoDemo`, `videoDemoTitle`, `availableFrom`, `immediateJoiner`, `about`, `dpdpConsent` (`DpdpConsentSettings`), `dpdpNominee` (`DpdpNominee`).
- **`OfferLetter`**: `id`, `candidateId`, `candidateName`, `trade`, `companyName`, `jobRole`, `industrialHub`, `takeHomeSalary`, `overtimeRate`, `joiningDate`, `accommodationIncluded`, `canteenIncluded`, `issuedAt`, `status` (`Issued` | `Accepted` | `Declined`).
- **`JobApplication`**: `id`, `jobId`, `jobTitle`, `companyName`, `industrialHub`, `takeHomeSalary`, `candidateId`, `candidateName`, `candidateTrade`, `candidatePhone`, `ncvtVerified`, `appliedAt`, `status` (`Applied` | `Shortlisted` | `Offer Issued` | `Hired` | `Rejected`).
- **`EmployerFactoryProfile`**: `id`, `companyName`, `gstin`, `udyamNumber`, `industrySector`, `industrialHub`, `exactAddress`, `hrContactName`, `hrPhone`, `hrEmail`, `totalPlantStrength`, `verifiedStatus`, `benefitsOffered`, `plantPhotos[]`, `aboutCompany`.
- **DPDP Act 2023 Entities**:
  - `DpdpConsentSettings`: `noticeAccepted`, `noticeVersion`, `consentedAt`, `lastUpdatedAt`, `languageUsed`, `directoryDiscovery`, `directHrContact`, `credentialVerification`, `isWithdrawn`, `consentArtifactId`.
  - `DpdpNominee`: `nomineeName`, `relationship`, `nomineePhone`, `nominatedAt`.
  - `DpdpGrievanceTicket`: `id`, `workerId`, `workerName`, `workerPhone`, `category`, `description`, `status`, `createdAt`, `slaDueBy`, `dpoAssigned`.
  - `DpdpAuditLog`: `id`, `timestamp`, `actorId`, `actorName`, `actionType`, `sectionRef`, `summary`.

---

### 6.2 Express REST API Endpoint Reference (`server.ts`)

| Endpoint | HTTP Method | Request Body / Query | Response Payload & Side Effects |
| :--- | :--- | :--- | :--- |
| `/api/bootstrap` | `GET` | None | Returns full `DatabaseSchema` (`jobs`, `candidates`, `offers`, `applications`, `employerProfile`, `shortlistedIds`, `reports`, `dpdpGrievances`, `dpdpAuditLogs`). |
| `/api/auth/worker` | `POST` | `{ phone, newCandidate? }` | Finds existing worker by last 10 digits of phone or inserts `newCandidate` with default `DpdpConsentSettings` + `CONSENT_GRANTED` audit log. Returns `{ candidate, candidates }`. |
| `/api/auth/employer` | `POST` | `{ updatedEmployer? }` | Updates and returns `{ employerProfile }`. |
| `/api/candidates` | `POST` | `{ candidate }` | Inserts or updates worker profile, ensures `dpdpConsent` artifact is attached, logs `CONSENT_GRANTED`, and returns `{ candidate, candidates }`. |
| `/api/candidates/:id` | `PUT` | `{ candidate }` | Updates existing candidate record and returns `{ candidate, candidates }`. |
| `/api/jobs` | `POST` | `{ job }` | Prepends new `JobListing` and returns `{ job, jobs }`. |
| `/api/jobs/:id` | `PUT` | `{ job }` | Updates job opening (`isActive`, `vacanciesLeft`, etc.) and returns `{ job, jobs }`. |
| `/api/applications` | `POST` | `{ application }` | Checks for duplicate application `(jobId, candidateId)`, inserts `JobApplication`, decrements `vacanciesLeft` on the target job, and returns `{ application, applications, jobs }`. |
| `/api/applications/:id/status` | `PATCH` | `{ status }` | Updates application status and returns `{ applications }`. |
| `/api/offers` | `POST` | `{ offer }` | Inserts new `OfferLetter`, marks matching `JobApplication` as `Offer Issued`, and returns `{ offer, offers, applications }`. |
| `/api/offers/:id/status` | `PATCH` | `{ status }` | Updates offer status (`Accepted` / `Declined`); if `Accepted`, marks matching application as `Hired`. Returns `{ offers, applications }`. |
| `/api/employer` | `PUT` | `{ employerProfile }` | Updates factory profile and returns `{ employerProfile }`. |
| `/api/shortlist/toggle` | `POST` | `{ candidateId }` | Toggles `candidateId` in `shortlistedIds` and returns `{ shortlistedIds }`. |
| `/api/reports` | `POST` | `{ report }` | Saves anti-exploitation whistleblower report and returns `{ report, reports }`. |
| `/api/ncvt/verify` | `GET` | `?q=<rollOrCertOrName>` | Filters candidates by Roll Number, Certificate Number, or Name, logs a DPDP `DATA_EXPORTED` audit entry, and returns `{ results }`. |
| `/api/dpdp/consent/:workerId` | `PUT` | `{ consent }` | Updates worker's `DpdpConsentSettings`, logs `CONSENT_UPDATED` or `CONSENT_WITHDRAWN`, and returns `{ candidate, candidates, dpdpAuditLogs }`. |
| `/api/dpdp/nominee/:workerId` | `PUT` | `{ nominee }` | Updates worker's Section 14 `DpdpNominee`, logs `NOMINEE_REGISTERED`, and returns `{ candidate, candidates, dpdpAuditLogs }`. |
| `/api/dpdp/erase/:workerId` | `DELETE` | None | Permanently erases worker from `candidates`, `applications`, `offers`, and `shortlistedIds`, records an anonymized `DATA_ERASED` audit log, and returns `{ erasedWorkerId, candidates, applications, offers, shortlistedIds, dpdpAuditLogs }`. |
| `/api/dpdp/grievance` | `POST` | `{ grievance }` | Records a Section 13 DPO grievance ticket with a 7-day statutory SLA, logs `GRIEVANCE_FILED`, and returns `{ ticket, dpdpGrievances, dpdpAuditLogs }`. |
| `/api/reset` | `POST` | None | Resets `data/db.json` back to the clean initial seed dataset. |

---

### 6.3 Atomic JSON Persistence & Seed Reconciliation Engine (`data/db.json`)
- **Atomic Write-Then-Rename**: `saveDb()` writes state to `data/db.json.tmp` and atomically renames it to `data/db.json` so concurrent requests never corrupt the database file.
- **Seed Reconciliation**: On startup, `loadDb()` merges any newly introduced seed jobs or seed candidates from `INITIAL_JOBS` and `INITIAL_CANDIDATES` into existing `data/db.json` stores while preserving all live user-created records, applications, offers, and DPDP audit logs.
