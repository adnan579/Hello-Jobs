import type { Db, Queryable } from '../db.ts';
import type { Config } from '../config.ts';
import { hashPassword, passwordProblem } from '../lib/password.ts';
import { badRequest, conflict } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';
import type { AdminRole } from '../lib/permissions.ts';

/** Creates a staff account. The first sign-in forces a new password and authenticator setup. */
export async function createAdminAccount(
  q: Queryable,
  input: { email: string; name: string; role: AdminRole; password: string; createdBy?: string; skipPolicy?: boolean }
): Promise<string> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('Enter a valid email address.');
  const problem = input.skipPolicy ? null : passwordProblem(input.password, email);
  if (problem) throw badRequest(problem);
  const exists = await q.query('SELECT 1 FROM admin_credentials WHERE lower(email) = $1', [email]);
  if (exists.rowCount) throw conflict('A staff account with this email already exists.');
  const acc = await q.query<{ id: string }>(`INSERT INTO accounts (phone, role, admin_role) VALUES ($1, 'admin', $2) RETURNING id`, [`admin:${email}`, input.role]);
  const id = acc.rows[0].id;
  await q.query(
    `INSERT INTO admin_credentials (account_id, email, display_name, password_hash, must_change_password, created_by) VALUES ($1,$2,$3,$4,true,$5)`,
    [id, email, input.name.trim().slice(0, 80) || email, await hashPassword(input.password), input.createdBy ?? null]
  );
  await audit(q, { actorAccountId: input.createdBy, principalId: id, principalName: email, action: 'STAFF_CREATED', details: `Staff account created with role ${input.role}.` });
  return id;
}

/**
 * Browser-only way to get the first admin: set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD.
 * The account is a Super Admin and must change the password at first sign-in.
 * ADMIN_BOOTSTRAP_RESET=true re-applies the password and clears the authenticator (use if you are locked out).
 */
export async function ensureBootstrapAdmin(db: Db, config: Config): Promise<void> {
  const { bootstrapEmail: email, bootstrapPassword: password, bootstrapReset } = config.admin;
  if (!email || !password) return;
  await db.tx(async (q) => {
    const existing = (await q.query<{ account_id: string }>('SELECT account_id FROM admin_credentials WHERE lower(email) = $1', [email])).rows[0];
    if (!existing) {
      await createAdminAccount(q, { email, name: 'Super Admin', role: 'Super Admin', password, skipPolicy: config.isProd ? false : true });
      return;
    }
    if (bootstrapReset) {
      await q.query(
        `UPDATE admin_credentials SET password_hash = $2, must_change_password = true, totp_secret_enc = NULL, totp_enabled = false,
                totp_last_step = 0, failed_attempts = 0, lock_count = 0, locked_until = NULL WHERE account_id = $1`,
        [existing.account_id, await hashPassword(password)]
      );
      await q.query(`UPDATE accounts SET status = 'active', admin_role = 'Super Admin' WHERE id = $1`, [existing.account_id]);
      await q.query(`UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL`, [existing.account_id]);
      await audit(q, { principalId: existing.account_id, principalName: email, action: 'ADMIN_BOOTSTRAP_RESET', details: 'Password and authenticator reset from server settings.' });
    }
  });
}
