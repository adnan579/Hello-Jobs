-- Admin console: staff sign in with email + password + authenticator code (not a phone code).

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_admin_role_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_admin_role_check
  CHECK (admin_role IS NULL OR admin_role IN ('Super Admin', 'Trust & Safety', 'Verifier', 'Support', 'Finance'));

CREATE TABLE admin_credentials (
  account_id          uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  email               text NOT NULL UNIQUE,
  display_name        text NOT NULL,
  password_hash       text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  totp_secret_enc     text,
  totp_enabled        boolean NOT NULL DEFAULT false,
  totp_last_step      bigint NOT NULL DEFAULT 0,
  failed_attempts     int NOT NULL DEFAULT 0,
  lock_count          int NOT NULL DEFAULT 0,
  locked_until        timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Admin sessions are a different kind: short idle timeout, hard absolute limit.
ALTER TABLE sessions ADD COLUMN kind text NOT NULL DEFAULT 'user' CHECK (kind IN ('user', 'admin'));
ALTER TABLE sessions ADD COLUMN absolute_expires_at timestamptz;

-- Staff actions are listed by actor, so index it.
CREATE INDEX audit_actor ON audit_logs (actor_account_id, created_at DESC);
CREATE INDEX audit_created ON audit_logs (created_at DESC);
