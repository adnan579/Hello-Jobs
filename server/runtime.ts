import { loadConfig } from './config.ts';
import { formatFindings, reviewConfig } from './lib/doctor.ts';
import { createDb, migrate, type Db } from './db.ts';
import type { AppContext } from './types.ts';

let contextPromise: Promise<AppContext> | undefined;

async function initialize(): Promise<AppContext> {
  let stage = 'config';
  let db: Db | undefined;
  try {
    const config = loadConfig();
    if (config.isProd) {
      const notes = reviewConfig(config).filter((finding) => finding.level !== 'ok');
      if (notes.length) console.warn('[config]\n' + formatFindings(notes));
    }
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not set. Add your Postgres connection string to the environment variables.');
    stage = 'database';
    db = createDb(config.databaseUrl);
    await db.query('SELECT 1');
    stage = 'migrations';
    if (process.env.AUTO_MIGRATE !== 'false') await migrate(db);
    return { db, config, deps: { fetch: globalThis.fetch, now: () => new Date() } };
  } catch (error) {
    await db?.close();
    const failure = error instanceof Error ? error : new Error(String(error));
    Object.assign(failure, { startupStage: stage });
    throw failure;
  }
}

export function getServerContext(): Promise<AppContext> {
  contextPromise ??= initialize().catch((error) => {
    contextPromise = undefined;
    throw error;
  });
  return contextPromise;
}