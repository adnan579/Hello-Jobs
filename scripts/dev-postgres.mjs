// Starts a throwaway local PostgreSQL (no Docker needed) for development and tests.
//   node scripts/dev-postgres.mjs            -> keeps running, prints DATABASE_URL
// Used automatically by the test setup when TEST_DATABASE_URL is not provided.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export async function startLocalPostgres({ port = 54329, dir = path.resolve('.local-pg') } = {}) {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  fs.mkdirSync(dir, { recursive: true });
  if (isRoot) {
    // Postgres refuses to run as root; the embedded binaries run as the `postgres` user in that case.
    execSync(`chmod 777 "${path.dirname(dir)}" && chown -R postgres "${dir}" 2>/dev/null || true`);
  }
  const dataDir = path.join(dir, 'data');
  const fresh = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));
  const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: 'hj', password: 'hj', port, persistent: true, postgresFlags: ['-c', 'fsync=off'] });
  if (fresh) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase('hellojobs_test');
  } catch {
    /* already exists */
  }
  return { url: `postgres://hj:hj@localhost:${port}/hellojobs_test`, stop: () => pg.stop() };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { url } = await startLocalPostgres();
  console.log(`Local Postgres running.\nDATABASE_URL=${url}\nPress Ctrl+C to stop.`);
  process.on('SIGINT', () => process.exit(0));
  setInterval(() => {}, 1 << 30);
}
