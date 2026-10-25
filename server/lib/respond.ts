import type { Request, Response } from 'express';
import { buildBootstrap } from '../services/bootstrap.ts';

/** Mutations answer with the caller's fresh, role-scoped snapshot plus any extra keys. */
export async function respond(req: Request, res: Response, extra: Record<string, unknown> = {}, status = 200) {
  const snapshot = await buildBootstrap(req.ctx, req.auth);
  res.status(status).json({ ...snapshot, ...extra });
}
