/** Run maintenance directly against the database: `npm run jobs:cleanup` */
import { cleanupExpiredOtps } from "../src/lib/maintenance";
import { db } from "../src/lib/db";

cleanupExpiredOtps()
  .then((n) => console.log(`Deleted ${n} expired OTP challenge(s).`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
