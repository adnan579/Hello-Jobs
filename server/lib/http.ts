import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import { badRequest } from './errors.ts';
import { firstIssue } from './schemas.ts';

export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw badRequest(firstIssue(r.error));
  return r.data;
}

export function clientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
}
