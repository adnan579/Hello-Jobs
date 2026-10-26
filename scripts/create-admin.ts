import 'dotenv/config';
import { createDb, migrate } from '../server/db.ts';
import { createAdminAccount } from '../server/services/adminAccounts.ts';
import { ADMIN_ROLES, type AdminRole } from '../server/lib/permissions.ts';

// Usage: npm run admin:create -- you@company.com "Your Name" "Super Admin" "TempPassword-123"
const [email, name, role = 'Super Admin', password] = process.argv.slice(2);
if (!email || !name || !password || !(ADMIN_ROLES as readonly string[]).includes(role)) {
  console.error(`Usage: npm run admin:create -- <email> "<name>" "<${ADMIN_ROLES.join('" | "')}>" "<temporary password, 12+ characters>"`);
  process.exit(1);
}
const db = createDb(process.env.DATABASE_URL ?? '');
await migrate(db);
await db.tx((q) => createAdminAccount(q, { email, name, role: role as AdminRole, password }));
console.log(`Staff account ready: ${email} (${role}). Open /admin, sign in, then set your own password and authenticator.`);
await db.close();
