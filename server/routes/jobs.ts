import { Router } from 'express';
import { wrap } from '../lib/http.ts';
import { requireRole } from '../auth/session.ts';
import { respond } from '../lib/respond.ts';
import { createJob, updateJob } from '../services/jobs.ts';

export const jobsRouter = Router();

jobsRouter.post(
  '/jobs',
  requireRole('employer'),
  wrap(async (req, res) => {
    await respond(req, res, { job: await createJob(req.ctx, req.auth, req.body) }, 201);
  })
);

jobsRouter.put(
  '/jobs/:id',
  requireRole('employer'),
  wrap(async (req, res) => {
    await respond(req, res, { job: await updateJob(req.ctx, req.auth, String(req.params.id), req.body) });
  })
);
