import { Router } from 'express';
import { wrap, parse } from '../lib/http.ts';
import { workerProfileInput } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { workerId } from '../lib/guards.ts';
import { forbidden, notFound } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { respond } from '../lib/respond.ts';
import { WORKER_SELECT, workerView } from '../services/serialize.ts';

export const workersRouter = Router();

async function saveOwnProfile(req: any, res: any) {
  const wid = workerId(req);
  if (req.params.id && req.params.id !== wid) throw forbidden('You can only edit your own profile.');
  const input = parse(workerProfileInput, req.body);
  const { db } = req.ctx;

  await db.tx(async (q: any) => {
    const cur = (await q.query('SELECT * FROM workers WHERE id = $1 FOR UPDATE', [wid])).rows[0];
    if (!cur) throw notFound('Profile not found.');
    const old = cur.data ?? {};

    const { name, trade, category, currentCity, homeState, expectedSalary, ncvtCertificate, ...rest } = input;
    const data = { ...old, ...rest } as Record<string, any>;
    delete data.readinessBadges;
    data.readinessBadges = (input.readinessBadges ?? old.readinessBadges ?? []).filter((b: string) => b !== 'Mobile OTP Verified');

    if (ncvtCertificate) {
      const prev = old.ncvtCertificate ?? {};
      data.ncvtCertificate = { ...prev, ...ncvtCertificate };
      const changed = ncvtCertificate.certificateNumber !== (prev.certificateNumber ?? '') || ncvtCertificate.rollNumber !== (prev.rollNumber ?? '');
      if (changed && ncvtCertificate.certificateNumber) {
        await q.query(
          `INSERT INTO verification_records (id, subject_id, subject_name, subject_type, kind, method, data)
           VALUES ($1,$2,$3,'worker','WORKER_NCVT_CERT','MANUAL_PHOTO_REVIEW',$4)`,
          [newId('ver'), wid, name, JSON.stringify({ documentNumber: ncvtCertificate.certificateNumber, evidenceRef: `Roll ${ncvtCertificate.rollNumber}`, evidenceLabel: `${ncvtCertificate.itiCollege} · ${ncvtCertificate.tradeName}` })]
        );
      }
    }
    if (input.hasVideoDemo && input.videoDemoTitle && input.videoDemoTitle !== old.videoDemoTitle) {
      await q.query(
        `INSERT INTO verification_records (id, subject_id, subject_name, subject_type, kind, method, data)
         VALUES ($1,$2,$3,'worker','WORKER_SKILL_VIDEO','MANUAL_PHOTO_REVIEW',$4)`,
        [newId('ver'), wid, name, JSON.stringify({ evidenceRef: input.videoDemoTitle, evidenceLabel: 'Practical skill video (self-declared)' })]
      );
    }

    await q.query(
      `UPDATE workers SET name=$2, trade=$3, category=$4, current_city=$5, home_state=$6, expected_salary=$7, data=$8, updated_at=now() WHERE id=$1`,
      [wid, name, trade, category, currentCity, homeState, expectedSalary, JSON.stringify(data)]
    );
  });

  const me = (await db.query(`${WORKER_SELECT} WHERE w.id = $1`, [wid])).rows[0];
  await respond(req, res, { candidate: workerView(me, 'self') });
}

workersRouter.put('/candidates/:id', requireRole('worker'), wrap(saveOwnProfile));
// Profiles are created at registration; a worker "creating" a profile later just saves their own.
workersRouter.post('/candidates', requireRole('worker'), wrap(saveOwnProfile));
