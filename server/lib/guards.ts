import type { Request } from 'express';
import { forbidden, unauthorized } from './errors.ts';

export function workerId(req: Request): string {
  if (!req.auth) throw unauthorized();
  if (req.auth.role !== 'worker' || !req.auth.workerId) throw forbidden('This action is for worker accounts.');
  return req.auth.workerId;
}

/** Employer team member who may change data (Owner or Recruiter). Viewers are read-only. */
export function employerWriter(req: Request): string {
  if (!req.auth) throw unauthorized();
  if (req.auth.role !== 'employer' || !req.auth.employerId) throw forbidden('This action is for factory accounts.');
  if (req.auth.memberRole === 'Viewer') throw forbidden('Your team role is view-only.');
  return req.auth.employerId;
}

export function employerOwner(req: Request): string {
  const id = employerWriter(req);
  if (req.auth!.memberRole !== 'Owner') throw forbidden('Only the account owner can do this.');
  return id;
}
