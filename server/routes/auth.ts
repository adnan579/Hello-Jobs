import { Router } from 'express';
import type { Queryable } from '../db.ts';
import { wrap, parse, clientIp } from '../lib/http.ts';
import { authVerifySchema, otpSendSchema } from '../lib/schemas.ts';
import { badRequest, forbidden, notFound } from '../lib/errors.ts';
import { newId, newToken } from '../lib/ids.ts';
import { TRADE_CATEGORY, POLICY_VERSION } from '../lib/enums.ts';
import { audit } from '../lib/audit.ts';
import { sendOtp, verifyOtp } from '../auth/otp.ts';
import { clearSessionCookie, createSession, requireAuth, setSessionCookie } from '../auth/session.ts';
import { sessionView } from '../services/serialize.ts';
import type { z } from 'zod';

type Verify = z.output<typeof authVerifySchema>;

export const authRouter = Router();

authRouter.post(
  '/otp/send',
  wrap(async (req, res) => {
    const { phone, role } = parse(otpSendSchema, req.body);
    const result = await sendOtp(req.ctx, { phone, role, ip: clientIp(req) });
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    res.json({
      sent: true,
      channel: result.channel,
      expiresInSec: result.expiresInSec,
      resendAfterSec: result.resendAfterSec,
      // Present only on dev/test or an allow-listed private demo; never when a real provider sends the code.
      ...(result.devCode ? { demoCode: result.devCode } : {}),
    });
  })
);

async function registerWorker(q: Queryable, body: Extract<Verify, { role: 'worker' }>, accountId: string, phone: string, ip: string): Promise<string> {
  const reg = body.registration!;
  const workerId = newId('cand');
  const category = reg.category ?? TRADE_CATEGORY[reg.trade];
  const consent = body.consent ?? { directoryDiscovery: false, whatsappJobAlerts: false, credentialVerification: true, marketingCommunications: false, noticeLanguage: 'en' as const };
  await q.query(
    `INSERT INTO workers (id, account_id, name, phone, trade, category, current_city, home_state, expected_salary, directory_visible, share_token, adult_confirmed_at, data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now(), $12)`,
    [
      workerId, accountId, reg.name, phone, reg.trade, category, reg.currentCity, reg.homeState, reg.expectedSalary ?? null,
      consent.directoryDiscovery, `hj-card-${newToken(9)}`,
      JSON.stringify({
        readinessBadges: [], experienceYears: 0, machinesOperated: [], languagesSpoken: [], pastEmployments: [], savedJobIds: [],
        willingToRelocate: false, immediateJoiner: false, preferredHubs: [], about: '', hasVideoDemo: false, videoDemoTitle: '',
        isPubliclyShareable: false,
        ncvtCertificate: { isVerified: false, certificateNumber: '', rollNumber: '', tradeName: '', itiCollege: '', stateDirectorate: '', passingYear: 0, grade: 'A', practicalScore: 0, maxPracticalScore: 0, theoryScore: 0, maxTheoryScore: 0, verifiedDate: '' },
      }),
    ]
  );
  await q.query(
    `INSERT INTO consent_records (id, worker_id, policy_version, directory_discovery, whatsapp_job_alerts, credential_verification, marketing, notice_language, adult_confirmed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
    [newId('consent'), workerId, POLICY_VERSION, consent.directoryDiscovery, consent.whatsappJobAlerts, consent.credentialVerification, consent.marketingCommunications, consent.noticeLanguage]
  );
  await audit(q, {
    actorAccountId: accountId, principalId: workerId, principalName: reg.name, action: 'CONSENT_GRANTED', ip,
    details: `Consent recorded (policy ${POLICY_VERSION}) with 18+ confirmation at registration. Directory discovery: ${consent.directoryDiscovery ? 'ON' : 'OFF'}.`,
  });
  return workerId;
}

async function registerEmployer(q: Queryable, body: Extract<Verify, { role: 'employer' }>, accountId: string, phone: string, ip: string): Promise<string> {
  const reg = body.registration!;
  const employerId = newId('emp');
  await q.query(
    `INSERT INTO employers (id, owner_account_id, company_name, gstin, data) VALUES ($1,$2,$3,$4,$5)`,
    [
      employerId, accountId, reg.companyName, reg.gstin, 
      JSON.stringify({
        udyamNumber: reg.udyamNumber ?? '', hrManagerName: reg.hrManagerName, industrialHub: reg.industrialHub, state: reg.state ?? '',
        factoryLicenseNumber: '', hrEmail: '', plantAddress: '', totalWorkforceCount: 0, industrySector: '', factoryShowcase: [], plants: [],
        facilities: { hasHostel: false, hasSubsidizedMess: false, hasBusPickup: false, esiPfCovered: false, safetyGearProvided: false, canteenRate: '', hostelDetails: '' },
      }),
    ]
  );
  await q.query(`INSERT INTO employer_members (employer_id, account_id, member_role, name) VALUES ($1,$2,'Owner',$3)`, [employerId, accountId, reg.hrManagerName]);
  await q.query(
    `INSERT INTO verification_records (id, subject_id, subject_name, subject_type, kind, method, data)
     VALUES ($1,$2,$3,'employer','FACTORY_GSTIN_KYB','GST_REGISTRY_LOOKUP',$4)`,
    [newId('ver'), employerId, reg.companyName, JSON.stringify({ documentNumber: reg.gstin, evidenceRef: `GSTIN ${reg.gstin}`, evidenceLabel: `Udyam: ${reg.udyamNumber ?? 'not provided'}` })]
  );
  await audit(q, { actorAccountId: accountId, principalId: employerId, principalName: reg.companyName, action: 'CONSENT_GRANTED', ip, details: `Factory account registered with terms and privacy policy ${POLICY_VERSION}.` });
  void phone;
  return employerId;
}

authRouter.post(
  '/auth/verify',
  wrap(async (req, res) => {
    const body = parse(authVerifySchema, req.body);
    const { phone, role } = body;
    const ip = clientIp(req);

    if (body.mode === 'register') {
      if (!body.adultConfirmed) throw badRequest('Please confirm that you are 18 years of age or older.');
      if (!body.termsAccepted) throw badRequest('Please accept the Terms and Privacy Policy to create an account.');
      if (role === 'worker' && !body.registration) throw badRequest('Please fill in your name, trade and city.');
      if (role === 'employer' && !body.registration) throw badRequest('Please fill in your company details.');
    }

    // Validate everything BEFORE spending the one-time code.
    const otp = await verifyOtp(req.ctx, { phone, role, code: body.code });
    if (!otp.ok) return res.status(otp.status).json({ error: otp.error });

    const label = body.deviceLabel || String(req.headers['user-agent'] ?? 'Browser');
    const out = await req.ctx.db.tx(async (q) => {
      const found = await q.query<{ id: string; status: string }>('SELECT id, status FROM accounts WHERE phone = $1 AND role = $2 FOR UPDATE', [phone, role]);
      let accountId = found.rows[0]?.id;
      let isNew = false;
      if (found.rows[0] && found.rows[0].status !== 'active') throw forbidden('This account is not active. Please contact support.');

      if (!accountId) {
        if (body.mode !== 'register') throw notFound('No account found for this number. Please register first.');
        const ins = await q.query<{ id: string }>('INSERT INTO accounts (phone, role) VALUES ($1, $2) RETURNING id', [phone, role]);
        accountId = ins.rows[0].id;
        isNew = true;
        if (role === 'worker') await registerWorker(q, body as any, accountId, phone, ip);
        else if (role === 'employer') await registerEmployer(q, body as any, accountId, phone, ip);
      }
      const session = await createSession(q, { accountId, deviceLabel: label, ip });
      return { token: session.token, isNew };
    });

    setSessionCookie(res, out.token, req.ctx.config.isProd);
    res.status(out.isNew ? 201 : 200).json({ ok: true, isNew: out.isNew });
  })
);

authRouter.get(
  '/auth/me',
  wrap(async (req, res) => {
    const a = req.auth;
    res.json({
      session: a ? { sessionId: a.sessionId, role: a.role, workerId: a.workerId, employerId: a.employerId, adminRole: a.adminRole } : null,
    });
  })
);

authRouter.post(
  '/auth/logout',
  wrap(async (req, res) => {
    if (req.auth) await req.ctx.db.query('UPDATE sessions SET revoked_at = now() WHERE id = $1', [req.auth.sessionId]);
    clearSessionCookie(res, req.ctx.config.isProd);
    res.json({ ok: true });
  })
);

authRouter.get(
  '/sessions',
  requireAuth,
  wrap(async (req, res) => {
    const { rows } = await req.ctx.db.query(
      `SELECT s.*, a.phone, a.role FROM sessions s JOIN accounts a ON a.id = s.account_id
        WHERE s.account_id = $1 AND s.revoked_at IS NULL AND s.expires_at > now() ORDER BY s.last_seen_at DESC`,
      [req.auth!.accountId]
    );
    res.json({ sessions: rows.map((r) => sessionView(r, req.auth!.sessionId)) });
  })
);

authRouter.post(
  '/sessions/revoke',
  requireAuth,
  wrap(async (req, res) => {
    const { sessionId, all } = (req.body ?? {}) as { sessionId?: string; all?: boolean };
    const accountId = req.auth!.accountId;
    // Always scoped to the caller's own account: you can only ever sign out your own devices.
    if (all) await req.ctx.db.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [accountId]);
    else if (typeof sessionId === 'string') await req.ctx.db.query('UPDATE sessions SET revoked_at = now() WHERE id::text = $1 AND account_id = $2 AND revoked_at IS NULL', [sessionId, accountId]);
    const { rows } = await req.ctx.db.query(
      `SELECT s.*, a.phone, a.role FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.account_id = $1 AND s.revoked_at IS NULL AND s.expires_at > now() ORDER BY s.last_seen_at DESC`,
      [accountId]
    );
    if (all) clearSessionCookie(res, req.ctx.config.isProd);
    res.json({ sessions: rows.map((r) => sessionView(r, req.auth!.sessionId)) });
  })
);
