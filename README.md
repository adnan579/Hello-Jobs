# 🏭 Hello Jobs

> **Direct Hands for Indian Industry. Zero Middlemen. 100% Fair Pay.**  
> A two-way blue and grey-collar workforce marketplace connecting India's ITI holders and semi-skilled workers directly with verified manufacturing units.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)

---

## 🚨 The Problem

India’s manufacturing ecosystem faces a critical paradox:
1. **Severe Labour Shortage in Factories:** MSMEs and large industrial plants across major industrial corridors face production slowdowns or closures due to a shortage of reliable skilled and semi-skilled floor workers.
2. **Unemployed Certified Youth:** Millions of **ITI (NCVT/SCVT)** graduates, diploma technicians, and experienced machine operators struggle to discover verified factory jobs outside their local districts.
3. **Exploitative Middlemen (*Thekedars*):** Because white-collar platforms like LinkedIn are built for English-speaking corporate roles, industrial workers rely on third-party outsourcing contractors who routinely deduct **15% to 30% of the worker's monthly salary** as commission while delivering unverified, high-attrition labor to employers.

---

## 💡 The Solution: Hello Jobs

**Hello Jobs** replaces exploitative middlemen with a **transparent, two-way digital marketplace** built specifically for the shop floor:

* **Inbound Mode (For Workers):** ITI holders and semi-skilled workers build a visual Trade Card in 60 seconds (no PDF resume required), view exact **net take-home salary + overtime rates + hostel/canteen perks**, and apply or call factory HR in one tap.
* **Outbound Mode (For Factories):** Verified manufacturing units don't just wait for applications—they actively **hunt talent** in the searchable worker directory using granular filters (ITI Trade, CNC/Welding/Lathe machine tags, experience, and relocation readiness) and send direct job invites to the worker's phone/WhatsApp.

---

## ✨ Key Platform Features

| Pillar | Worker Experience (ITI & Semi-Skilled) | Factory / Employer Experience |
| :--- | :--- | :--- |
| **Two-Way Discovery** | **1-Tap Apply & Direct HR Call** on verified factory job cards. | **Active Talent Hunter** to filter and invite ready-to-join workers in bulk. |
| **Skill Proof** | **30-Second Practical Video CV** demonstrating real machine/tool handling. | **NCVT/SCVT & Aadhaar Badges** for pre-screened technical hiring. |
| **Wage Transparency** | Mandatory display of **In-Hand Salary, Gross Pay, OT Rate (₹/hr), and Shift Hours**. | Standardized **1-Click Digital Offer Letter** generator (Hindi + English). |
| **Migration Support** | Filter jobs by **Free Hostel/Room, Subsidized Canteen, and PF/ESIC**. | Showcase shop-floor photos and worker dormitories to reduce outstation drop-offs. |
| **Anti-Exploitation** | **0% Commission Guarantee** + built-in SOS button to report agent fee demands. | **GSTIN & Udyam KYB Verification** to keep fake agents off the platform. |

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
* **Backend:** Next.js Serverless API Routes
* **Database & ORM:** PostgreSQL with Prisma ORM
* **Authentication (Planned):** Mobile Number + 4-Digit SMS/WhatsApp OTP
* **Integrations (Roadmap):** WhatsApp Business Cloud API, DigiLocker / NCVT Roll Number Verification, AWS S3 / Cloudflare R2 (for 30s practical skill videos)

---

## 🗄️ Database Architecture (`prisma/schema.prisma`)

The core PostgreSQL schema powers both inbound applications and outbound talent hunting through a unified pipeline:

* **`User`** — Unified phone-based authentication (`WORKER`, `EMPLOYER`, `ADMIN`) with regional language preferences (`hi`, `en`, `mr`, `gu`, `ta`).
* **`WorkerProfile`** — Captures trade (`ITI Fitter`, `Welder`, `CNC Operator`, `Electrician`), skill category, NCVT/SCVT verification, relocation readiness, expected salary, and 30s skill video URL.
* **`EmployerProfile`** — Stores factory details, industrial cluster, GSTIN/Udyam verification status, and outbound talent-hunt credits.
* **`JobPosting`** — Enforces strict wage transparency (`inHandSalaryMonthly`, `overtimeRatePerHour`, `shiftHours`, and accommodation/food flags).
* **`JobInteraction`** — Unified two-way state machine tracking whether a match was initiated via `WORKER_APPLY` or `EMPLOYER_HUNT` across stages (`INITIATED` → `SHORTLISTED` → `OFFERED` → `JOINED`, plus `REJECTED` / `WITHDRAWN`). One row per worker per job.
* **`OtpChallenge`** — Hashed, single-use, expiring login codes with attempt limits.
* **`AgentFeeReport`** — Anti-exploitation reports from workers (login not required).

---

## 🚀 Getting Started (Local Development)

### Prerequisites

* Node.js 20.9+ (22 recommended)
* A PostgreSQL 14+ database (local, Docker, Neon, Supabase, …)

### Setup

```bash
git clone https://github.com/adnan579/Hello-Jobs.git
cd Hello-Jobs
npm install                      # also runs `prisma generate`

cp .env.example .env             # then edit DATABASE_URL and SESSION_SECRET
npm run db:migrate -- --name init   # create tables (or `npm run db:push` for a quick start)
npm run db:seed                  # optional demo factories, jobs and workers

npm run dev                      # http://localhost:3000
```

Quick local Postgres with Docker:

```bash
docker run --name hellojobs-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hello_jobs -p 5432:5432 -d postgres:16
```

### Demo accounts (after `npm run db:seed`)

In development the OTP is printed in the server console **and** shown on the login screen.

| Role | Phone | Notes |
| :--- | :--- | :--- |
| Admin | `90000 00000` | Approves factory verification at `/admin/employers` |
| Factory | `90000 00001` | Verified, 10 Talent Hunt credits |
| Factory | `90000 00002` | Verification pending (Talent Hunt locked) |
| Worker | `90000 00101` – `00104` | Trade Cards already filled in |

### Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) for validation, pipeline rules, sessions, OTP |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:push` / `db:seed` / `db:studio` | Prisma database tasks |

---

## 🧭 What Works Today (MVP)

* **Login:** mobile number + 4-digit OTP (hashed, expiring, 5 attempts, rate-limited). One number = one role.
* **Worker:** Trade Card onboarding/editing, wage-transparent job feed with filters, job detail, one-tap apply, call HR, dashboard with invites and application status, withdraw, opt out of the directory.
* **Factory:** registration with GSTIN/Udyam format checks, bulk job posting (in-hand, gross, overtime and shift hours are mandatory), pipeline dashboard (shortlist → offer → joined / reject), pause/close jobs.
* **Talent Hunt:** searchable worker directory (trade, state, machine tag, experience, relocation, availability). Workers' phone numbers are revealed only after an invite, which costs one credit and requires a verified factory.
* **Anti-exploitation:** public "Report an agent / fee demand" form; admin review list.
* **Admin:** approve or reject factory verification.

## 🛣️ Not Built Yet

* **OTP delivery:** `deliverOtp()` in `src/lib/otp.ts` only logs in development and refuses to run in production until a WhatsApp Business Cloud API or SMS gateway is wired in.
* **Verification integrations:** NCVT/SCVT roll-number lookup, Aadhaar KYC (DigiLocker) and automated GSTIN/Udyam checks. Today these stay `PENDING` until an admin acts; the app never marks a credential `VERIFIED` by itself.
* **Skill video upload:** workers paste an `https` link; direct upload to S3/R2 is planned.
* **Vernacular UI:** labels are English with Hindi trade names. Full Hindi/Marathi/Gujarati/Tamil translation and voice-assisted onboarding are planned.
* **WhatsApp bot, audio job cards, digital offer letters, retention tracker, payments for credits / pay-per-hire, ITI campus drives.**
