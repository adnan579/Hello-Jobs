import 'dotenv/config';
import { createDb, migrate } from '../server/db.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}
const db = createDb(url);
const applied = await migrate(db);
console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
await db.close();
