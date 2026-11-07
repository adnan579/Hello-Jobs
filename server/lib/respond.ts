import type { Request, Response } from 'express';
import type { AppContext, AuthContext } from '../types.ts';
import { buildBootstrap } from '../services/bootstrap.ts';

/** The body of a mutation response: the caller's fresh, role-scoped snapshot plus any extra keys. */
export async function snapshotWith(ctx: AppContext, auth: AuthContext | undefined, extra: Record<string, unknown> = {}) {
  return { ...(await buildBootstrap(ctx, auth)), ...extra };
}

/** Mutations answer with the caller's fresh, role-scoped snapshot plus any extra keys. */
export async function respond(req: Request, res: Response, extra: Record<string, unknown> = {}, status = 200) {
  res.status(status).json(await snapshotWith(req.ctx, req.auth, extra));
}
