import 'dotenv/config';
import { loadConfig } from '../server/config.ts';
import { createDb } from '../server/db.ts';
import { formatFindings, reviewConfig } from '../server/lib/doctor.ts';
import { readdirSync } from 'node:fs';

// Usage: NODE_ENV=production npm run doctor   (set the same variables you gave Vercel)
let findings;
try {
  findings = reviewConfig(loadConfig(), process.env);
} catch (e) {
  console.error('ERROR configuration is invalid:', (e as Error).message);
  process.exit(1);
}
console.log(formatFindings(findings));

if (process.env.DATABASE_URL) {
  const db = createDb(process.env.DATABASE_URL);
  try {
    await db.query('SELECT 1');
    const files = readdirSync(new URL('../server/migrations/', import.meta.url)).filter((f) => f.endsWith('.sql'));
    const applied = await db.query('SELECT name FROM schema_migrations').then((r) => r.rows.length, () => 0);
    console.log(`OK    [Database] connected. ${applied} of ${files.length} migration(s) applied${applied < files.length ? ' (the rest apply on first request, or run npm run db:migrate)' : ''}.`);
  } catch (e) {
    console.log(`ERROR [Database] cannot connect: ${(e as Error).message}`);
    findings.push({ level: 'error', area: 'Database', message: 'unreachable' });
  } finally {
    await db.close();
  }
}
process.exit(findings.some((f) => f.level === 'error') ? 1 : 0);
