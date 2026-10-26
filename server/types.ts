import type { Config } from './config.ts';
import type { Db } from './db.ts';

export interface AuthContext {
  sessionId: string;
  accountId: string;
  role: 'worker' | 'employer' | 'admin';
  adminRole?: import('./lib/permissions.ts').AdminRole;
  /** Admin sessions only */
  email?: string;
  displayName?: string;
  mustChangePassword?: boolean;
  phone: string;
  /** Present for role=worker */
  workerId?: string;
  /** Present for role=employer */
  employerId?: string;
  memberRole?: 'Owner' | 'Recruiter' | 'Viewer';
}

export interface Deps {
  /** Injectable for tests. Defaults to global fetch. */
  fetch: typeof fetch;
  now: () => Date;
}

export interface AppContext {
  db: Db;
  config: Config;
  deps: Deps;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      /** Set only for a valid admin console session (cookie hj_admin). */
      admin?: AuthContext;
      ctx: AppContext;
    }
  }
}
