import type { AppContext, AuthContext } from '../types.ts';
import {
  APPLICATION_SELECT, JOB_SELECT, OFFER_SELECT, WORKER_SELECT,
  applicationView, auditView, checkInView, driveView, employerView, grievanceView, jobView,
  ledgerView, notificationView, offerView, reportView, verificationView, workerView,
} from './serialize.ts';

const PUBLIC_JOB_WHERE = `j.is_active AND j.moderation_status = 'Approved' AND e.kyb_status = 'VERIFIED' AND NOT e.paused AND j.expires_at > now() AND j.vacancies_left > 0`;

async function publicStats(ctx: AppContext) {
  const { rows } = await ctx.db.query<{ workers: number; factories: number; jobs: number }>(
    `SELECT (SELECT count(*) FROM workers) AS workers,
            (SELECT count(*) FROM employers WHERE kyb_status = 'VERIFIED' AND NOT paused) AS factories,
            (SELECT count(*) FROM jobs j JOIN employers e ON e.id = j.employer_id WHERE ${PUBLIC_JOB_WHERE}) AS jobs`
  );
  return rows[0];
}

export async function loadEmployerProfile(ctx: AppContext, employerId: string) {
  const { db } = ctx;
  const [e, unlocked, members, pk] = await Promise.all([
    db.query(`SELECT e.*, a.phone AS hr_phone FROM employers e JOIN accounts a ON a.id = e.owner_account_id WHERE e.id = $1`, [employerId]),
    db.query('SELECT worker_id FROM contact_unlocks WHERE employer_id = $1', [employerId]),
    db.query(
      `SELECT m.*, a.phone FROM employer_members m JOIN accounts a ON a.id = m.account_id WHERE m.employer_id = $1 ORDER BY m.added_at`,
      [employerId]
    ),
    db.query<{ pct: number | null }>(
      `SELECT CASE WHEN count(*) >= 3 THEN round(100.0 * count(*) FILTER (WHERE pay_matches_promise AND hostel_matches_promise) / count(*)) END AS pct
         FROM retention_checkins WHERE employer_id = $1`,
      [employerId]
    ),
  ]);
  if (!e.rows[0]) return null;
  return employerView(e.rows[0], {
    unlockedIds: unlocked.rows.map((r) => r.worker_id),
    members: members.rows,
    promiseKeptPct: pk.rows[0]?.pct != null ? Number(pk.rows[0].pct) : undefined,
  });
}

export async function buildBootstrap(ctx: AppContext, auth: AuthContext | undefined) {
  const { db } = ctx;
  const stats = await publicStats(ctx);
  const empty = {
    jobs: [] as any[], candidates: [] as any[], employerProfile: null as any, applications: [] as any[], offers: [] as any[],
    shortlistedIds: [] as string[], reports: [] as any[], feeReports: [] as any[], dpdpGrievances: [] as any[], dpdpAuditLogs: [] as any[],
    notifications: [] as any[], verificationRecords: [] as any[], creditLedger: [] as any[], hiringDrives: [] as any[], retentionCheckIns: [] as any[],
    session: auth ? { role: auth.role, workerId: auth.workerId, employerId: auth.employerId, adminRole: auth.adminRole, sessionId: auth.sessionId } : null,
    stats: { workers: stats.workers, factories: stats.factories, jobs: stats.jobs },
    paymentsMode: ctx.config.payments.mode,
  };

  const publicJobs = async () =>
    (await db.query(`${JOB_SELECT} WHERE ${PUBLIC_JOB_WHERE} ORDER BY j.created_at DESC LIMIT 500`)).rows.map((r) => jobView(r));

  const drivesFor = async (where: string, params: unknown[], viewer: { ownerEmployerId?: string; workerId?: string }) => {
    const { rows } = await db.query(
      `SELECT d.*, e.company_name,
          (SELECT count(*) FROM offers o JOIN applications a ON a.id = o.application_id WHERE a.employer_id = d.employer_id) AS offers_issued
         FROM hiring_drives d JOIN employers e ON e.id = d.employer_id ${where} ORDER BY d.created_at DESC LIMIT 200`,
      params
    );
    if (!rows.length) return [];
    const regs = await db.query('SELECT drive_id, worker_id, checked_in_at FROM drive_registrations WHERE drive_id = ANY($1)', [rows.map((r) => r.id)]);
    return rows.map((r) => {
      const mine = regs.rows.filter((x) => x.drive_id === r.id);
      const owner = viewer.ownerEmployerId === r.employer_id;
      const visible = owner ? mine : mine.filter((x) => x.worker_id === viewer.workerId);
      return driveView(r, {
        owner,
        registered: visible.map((x) => x.worker_id),
        checkedIn: visible.filter((x) => x.checked_in_at).map((x) => x.worker_id),
      });
    });
  };

  if (!auth) {
    return { ...empty, jobs: await publicJobs(), hiringDrives: await drivesFor('WHERE e.kyb_status = \'VERIFIED\' AND NOT e.paused', [], {}) };
  }

  if (auth.role === 'worker' && auth.workerId) {
    const wid = auth.workerId;
    const [jobs, me, apps, offers, notes, drives, checkins, vr, audits] = await Promise.all([
      publicJobs(),
      db.query(`${WORKER_SELECT} WHERE w.id = $1`, [wid]),
      db.query(`${APPLICATION_SELECT} WHERE a.worker_id = $1 ORDER BY a.created_at DESC`, [wid]),
      db.query(`${OFFER_SELECT} WHERE o.worker_id = $1 ORDER BY o.created_at DESC`, [wid]),
      db.query(`SELECT * FROM notifications WHERE recipient_role = 'worker' AND recipient_id = $1 ORDER BY created_at DESC LIMIT 100`, [wid]),
      drivesFor("WHERE e.kyb_status = 'VERIFIED' AND NOT e.paused", [], { workerId: wid }),
      db.query(
        `SELECT r.*, w.name AS worker_name, e.company_name FROM retention_checkins r JOIN workers w ON w.id = r.worker_id JOIN employers e ON e.id = r.employer_id WHERE r.worker_id = $1 ORDER BY r.created_at DESC`,
        [wid]
      ),
      db.query(`SELECT * FROM verification_records WHERE subject_id = $1 ORDER BY created_at DESC`, [wid]),
      db.query(`SELECT * FROM audit_logs WHERE principal_id = $1 ORDER BY created_at DESC LIMIT 100`, [wid]),
    ]);
    return {
      ...empty,
      jobs,
      candidates: me.rows[0] ? [workerView(me.rows[0], 'self')] : [],
      applications: apps.rows.map((r) => applicationView(r, 'worker')),
      offers: offers.rows.map(offerView),
      notifications: notes.rows.map(notificationView),
      hiringDrives: drives,
      retentionCheckIns: checkins.rows.map(checkInView),
      verificationRecords: vr.rows.map(verificationView),
      dpdpAuditLogs: audits.rows.map(auditView),
    };
  }

  if (auth.role === 'employer' && auth.employerId) {
    const eid = auth.employerId;
    const profile = await loadEmployerProfile(ctx, eid);
    const verified = profile?.kybVerificationStatus === 'VERIFIED';
    const [pub, own, dir, apps, offers, shortlist, ledger, notes, drives, checkins, vr, audits] = await Promise.all([
      publicJobs(),
      db.query(`${JOB_SELECT} WHERE j.employer_id = $1 ORDER BY j.created_at DESC`, [eid]),
      verified
        ? db.query(
            `${WORKER_SELECT} WHERE w.directory_visible AND EXISTS (SELECT 1 FROM accounts ac WHERE ac.id = w.account_id AND ac.status = 'active') ORDER BY w.updated_at DESC LIMIT 500`
          )
        : Promise.resolve({ rows: [] as any[] }),
      db.query(`${APPLICATION_SELECT} WHERE a.employer_id = $1 ORDER BY a.created_at DESC LIMIT 1000`, [eid]),
      db.query(`${OFFER_SELECT} WHERE o.employer_id = $1 ORDER BY o.created_at DESC LIMIT 1000`, [eid]),
      db.query('SELECT worker_id FROM shortlists WHERE employer_id = $1', [eid]),
      db.query('SELECT * FROM credit_ledger WHERE employer_id = $1 ORDER BY created_at DESC LIMIT 200', [eid]),
      db.query(`SELECT * FROM notifications WHERE recipient_role = 'employer' AND recipient_id = $1 ORDER BY created_at DESC LIMIT 100`, [eid]),
      drivesFor('WHERE d.employer_id = $1', [eid], { ownerEmployerId: eid }),
      db.query(
        `SELECT r.*, w.name AS worker_name, e.company_name FROM retention_checkins r JOIN workers w ON w.id = r.worker_id JOIN employers e ON e.id = r.employer_id WHERE r.employer_id = $1 ORDER BY r.created_at DESC LIMIT 500`,
        [eid]
      ),
      db.query(`SELECT * FROM verification_records WHERE subject_id = $1 ORDER BY created_at DESC`, [eid]),
      db.query(`SELECT * FROM audit_logs WHERE principal_id = $1 ORDER BY created_at DESC LIMIT 100`, [eid]),
    ]);
    const unlocked = new Set(profile?.unlockedCandidateIds ?? []);
    const ownIds = new Set(own.rows.map((r) => r.id));
    const jobs = [...own.rows.map((r) => jobView(r, { owner: true })), ...pub.filter((j) => !ownIds.has(j.id))];
    return {
      ...empty,
      jobs,
      employerProfile: profile,
      candidates: dir.rows.map((r) => workerView(r, unlocked.has(r.id) ? 'employer-unlocked' : 'employer-masked')),
      applications: apps.rows.map((r) => applicationView(r, 'employer')),
      offers: offers.rows.map(offerView),
      shortlistedIds: shortlist.rows.map((r) => r.worker_id),
      creditLedger: ledger.rows.map(ledgerView),
      notifications: notes.rows.map(notificationView),
      hiringDrives: drives,
      retentionCheckIns: checkins.rows.map(checkInView),
      verificationRecords: vr.rows.map(verificationView),
      dpdpAuditLogs: audits.rows.map(auditView),
    };
  }

  return empty;
}
