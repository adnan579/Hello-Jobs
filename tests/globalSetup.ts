import { createDb, migrate } from '../server/db.ts';

let stop: (() => Promise<unknown>) | undefined;

export default async function setup() {
  let url = process.env.TEST_DATABASE_URL;
  if (!url) {
    const { startLocalPostgres } = await import('../scripts/dev-postgres.mjs');
    const pg = await startLocalPostgres();
    url = pg.url as string;
    stop = pg.stop;
  }
  process.env.TEST_DATABASE_URL = url;
  const db = createDb(url);
  // Start every run from an empty schema so migrations are exercised from scratch.
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate(db);
  await db.close();
  return async () => {
    await stop?.();
  };
}
