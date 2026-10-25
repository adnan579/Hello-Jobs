import { Router } from 'express';
import { wrap } from '../lib/http.ts';
import { buildBootstrap } from '../services/bootstrap.ts';

export const bootstrapRouter = Router();

bootstrapRouter.get(
  '/bootstrap',
  wrap(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(await buildBootstrap(req.ctx, req.auth));
  })
);
