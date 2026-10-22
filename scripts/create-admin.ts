/**
 * Create an admin account:  npm run admin:create -- 98765 43210
 * (point DATABASE_URL at the target database first; use the DIRECT connection string on Neon)
 */
import { ensureAdmin } from "../src/lib/admin";
import { db } from "../src/lib/db";

const phone = process.argv.slice(2).join(" ").trim();
if (!phone) {
  console.error("Usage: npm run admin:create -- <mobile number>");
  process.exit(1);
}

ensureAdmin(phone)
  .then((r) => {
    if (!r.ok) {
      console.error(r.error);
      process.exitCode = 1;
    } else {
      console.log(r.created ? `Created admin ${r.phone}.` : `${r.phone} is already an admin.`);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
