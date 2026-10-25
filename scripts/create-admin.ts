import 'dotenv/config';
import { createDb, migrate } from '../server/db.ts';
import { normalizeIndianPhone } from '../server/lib/phone.ts';

// Usage: npm run admin:create -- 9876543210 "Trust & Safety"
const [rawPhone, roleArg = 'Trust & Safety'] = process.argv.slice(2);
const phone = normalizeIndianPhone(rawPhone ?? '');
const roles = ['Verifier', 'Support', 'Trust & Safety'];
if (!phone || !roles.includes(roleArg)) {
  console.error(`Usage: npm run admin:create -- <10-digit mobile> "<${roles.join('" | "')}>"`);
  process.exit(1);
}
const db = createDb(process.env.DATABASE_URL ?? '');
await migrate(db);
await db.query(
  `INSERT INTO accounts (phone, role, admin_role) VALUES ($1, 'admin', $2)
   ON CONFLICT (phone, role) DO UPDATE SET admin_role = $2, status = 'active'`,
  [phone, roleArg]
);
console.log(`Admin ready: ${phone} (${roleArg}). Sign in from the site's Admin entry with this number.`);
await db.close();
