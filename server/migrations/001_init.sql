-- Hello Jobs production schema (v1).
-- Design: security- and money-critical facts are real columns with constraints;
-- the rich UI shapes (trade cards, job cards, offer letters) live in `data jsonb`
-- and are validated by the API before they are stored.

CREATE TABLE accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         text NOT NULL,
  role          text NOT NULL CHECK (role IN ('worker', 'employer', 'admin')),
  admin_role    text CHECK (admin_role IN ('Verifier', 'Support', 'Trust & Safety')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'erased')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  UNIQUE (phone, role),
  CHECK ((role = 'admin') = (admin_role IS NOT NULL))
);

CREATE TABLE otp_challenges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  role        text NOT NULL,
  code_hash   text NOT NULL,
  channel     text NOT NULL,
  ip          text,
  attempts    int  NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_challenges_phone_created ON otp_challenges (phone, created_at DESC);
CREATE INDEX otp_challenges_expires ON otp_challenges (expires_at);

-- Generic fixed-window counters and lockouts (OTP sends per phone/IP, bad guesses, report spam...).
CREATE TABLE throttles (
  key          text PRIMARY KEY,
  count        int  NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  device_label text NOT NULL DEFAULT 'Browser',
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz
);
CREATE INDEX sessions_account ON sessions (account_id);

CREATE TABLE workers (
  id                 text PRIMARY KEY,
  account_id         uuid NOT NULL UNIQUE REFERENCES accounts(id),
  name               text NOT NULL,
  phone              text NOT NULL,
  trade              text NOT NULL,
  category           text NOT NULL,
  current_city       text,
  home_state         text,
  expected_salary    int,
  directory_visible  boolean NOT NULL DEFAULT false,
  share_token        text UNIQUE,
  adult_confirmed_at timestamptz,
  data               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workers_directory ON workers (trade, current_city) WHERE directory_visible;

CREATE TABLE employers (
  id               text PRIMARY KEY,
  owner_account_id uuid NOT NULL REFERENCES accounts(id),
  company_name     text NOT NULL,
  gstin            text,
  kyb_status       text NOT NULL DEFAULT 'PENDING' CHECK (kyb_status IN ('VERIFIED', 'PENDING', 'CANCELLED_GSTIN')),
  kyb_verified_at  timestamptz,
  hunt_credits     int  NOT NULL DEFAULT 0 CHECK (hunt_credits >= 0),
  paused           boolean NOT NULL DEFAULT false,
  data             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
-- A verified GSTIN can belong to only one employer account.
CREATE UNIQUE INDEX employers_verified_gstin ON employers (gstin) WHERE kyb_status = 'VERIFIED';

CREATE TABLE employer_members (
  employer_id text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  account_id  uuid NOT NULL REFERENCES accounts(id),
  member_role text NOT NULL CHECK (member_role IN ('Owner', 'Recruiter', 'Viewer')),
  name        text,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employer_id, account_id)
);
CREATE UNIQUE INDEX employer_members_one_per_account ON employer_members (account_id);

CREATE TABLE jobs (
  id                text PRIMARY KEY,
  employer_id       text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  title             text NOT NULL,
  trade             text NOT NULL,
  state             text,
  industrial_hub    text,
  take_home_salary  int NOT NULL CHECK (take_home_salary > 0),
  vacancies_left    int NOT NULL DEFAULT 0 CHECK (vacancies_left >= 0),
  is_active         boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'Approved',
  expires_at        timestamptz NOT NULL,
  data              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_public ON jobs (created_at DESC) WHERE is_active AND moderation_status = 'Approved';
CREATE INDEX jobs_employer ON jobs (employer_id);

CREATE TABLE applications (
  id          text PRIMARY KEY,
  job_id      text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id   text NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  employer_id text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'Applied',
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_id)
);
CREATE INDEX applications_worker ON applications (worker_id);
CREATE INDEX applications_employer ON applications (employer_id);

CREATE TABLE offers (
  id             text PRIMARY KEY,
  application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  worker_id      text NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  employer_id    text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Accepted', 'Declined', 'Joined Confirmed')),
  data           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX offers_worker ON offers (worker_id);
CREATE INDEX offers_employer ON offers (employer_id);
-- At most one live offer per application.
CREATE UNIQUE INDEX offers_one_live_per_application ON offers (application_id) WHERE status IN ('Issued', 'Accepted', 'Joined Confirmed');

CREATE TABLE shortlists (
  employer_id text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  worker_id   text NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employer_id, worker_id)
);

-- Who may see a worker's phone number.
CREATE TABLE contact_unlocks (
  employer_id text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  worker_id   text NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  source      text NOT NULL CHECK (source IN ('credit', 'application')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employer_id, worker_id)
);

CREATE SEQUENCE invoice_seq START 1;

-- Kept for tax records even after an employer erases their account (hence no cascade).
CREATE TABLE credit_ledger (
  id            text PRIMARY KEY,
  employer_id   text NOT NULL REFERENCES employers(id),
  change        int  NOT NULL,
  reason        text NOT NULL,
  reference     text,
  balance_after int  NOT NULL CHECK (balance_after >= 0),
  invoice_no    text,
  amount_inr    numeric(12, 2),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credit_ledger_employer ON credit_ledger (employer_id, created_at DESC);

CREATE TABLE payment_orders (
  id                  text PRIMARY KEY,
  employer_id         text NOT NULL REFERENCES employers(id),
  pack_id             text NOT NULL,
  credits             int  NOT NULL CHECK (credits > 0),
  amount_paise        bigint NOT NULL CHECK (amount_paise > 0),
  provider            text NOT NULL,
  provider_order_id   text UNIQUE,
  provider_payment_id text UNIQUE,
  status              text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  paid_at             timestamptz
);

CREATE TABLE notifications (
  id             text PRIMARY KEY,
  recipient_role text NOT NULL CHECK (recipient_role IN ('worker', 'employer')),
  recipient_id   text NOT NULL,
  event_type     text NOT NULL,
  channel        text NOT NULL DEFAULT 'In-App Inbox',
  title          text NOT NULL,
  body           text NOT NULL,
  read           boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_recipient ON notifications (recipient_role, recipient_id, created_at DESC);

CREATE TABLE verification_records (
  id          text PRIMARY KEY,
  subject_id  text NOT NULL,
  subject_name text NOT NULL,
  subject_type text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('FACTORY_GSTIN_KYB', 'WORKER_NCVT_CERT', 'WORKER_SKILL_VIDEO')),
  status      text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
  method      text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_account_id uuid REFERENCES accounts(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX verification_status ON verification_records (status, created_at);
CREATE INDEX verification_subject ON verification_records (subject_id, kind);

CREATE TABLE reports (
  id         text PRIMARY KEY,
  status     text NOT NULL DEFAULT 'New',
  data       jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE grievances (
  id         text PRIMARY KEY,
  status     text NOT NULL DEFAULT 'Registered with DPO',
  data       jsonb NOT NULL,
  sla_due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring_drives (
  id          text PRIMARY KEY,
  employer_id text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  check_in_code text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE drive_registrations (
  drive_id      text NOT NULL REFERENCES hiring_drives(id) ON DELETE CASCADE,
  worker_id     text NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  checked_in_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (drive_id, worker_id)
);

CREATE TABLE retention_checkins (
  id          text PRIMARY KEY,
  worker_id   text NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  employer_id text NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  milestone   text NOT NULL CHECK (milestone IN ('Day1', 'Day7', 'Day30', 'Day90')),
  pay_matches_promise boolean,
  hostel_matches_promise boolean,
  still_employed boolean,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, employer_id, milestone)
);

-- DPDP: every consent decision is a new row; the latest row is the current state.
CREATE TABLE consent_records (
  id                     text PRIMARY KEY,
  worker_id              text NOT NULL,
  policy_version         text NOT NULL,
  directory_discovery    boolean NOT NULL,
  whatsapp_job_alerts    boolean NOT NULL,
  credential_verification boolean NOT NULL,
  marketing              boolean NOT NULL DEFAULT false,
  notice_language        text NOT NULL DEFAULT 'en',
  is_withdrawn           boolean NOT NULL DEFAULT false,
  adult_confirmed_at     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consent_worker ON consent_records (worker_id, created_at DESC);

CREATE TABLE nominees (
  worker_id     text PRIMARY KEY REFERENCES workers(id) ON DELETE CASCADE,
  nominee_name  text NOT NULL,
  relationship  text NOT NULL,
  nominee_phone text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- Append-only. principal_id is text on purpose so rows survive erasure of the principal.
CREATE TABLE audit_logs (
  id               bigserial PRIMARY KEY,
  actor_account_id uuid,
  principal_id     text NOT NULL,
  principal_name   text NOT NULL,
  action           text NOT NULL,
  details          text NOT NULL,
  ip               text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_principal ON audit_logs (principal_id, created_at DESC);
