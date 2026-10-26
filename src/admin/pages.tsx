import { useEffect, useState } from 'react';
import { api, ApiError } from './api.ts';
import { Badge, Btn, Card, Field, ListView, Modal, ReasonDialog, fmt, inputCls, inr, statusTone, useToast, type Col } from './ui.tsx';
import { ChangePassword } from './Login.tsx';

type Can = (p: string) => boolean;

// ---------- Overview ----------
function Stat({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: 'red' }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className={`mt-1 text-2xl font-extrabold ${tone === 'red' ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>{sub && <div className="text-xs text-slate-500">{sub}</div>}</div>;
}
export function Overview({ go, can }: { go: (p: string) => void; can: Can }) {
  const [d, setD] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api('GET', '/admin/overview').then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <p role="alert" className="text-red-600">{err}</p>;
  if (!d) return <p className="text-slate-500">Loading…</p>;
  const max = Math.max(1, ...d.signups.map((s: any) => s.workers + s.employers));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Workers" value={d.workers.total} sub={`${d.workers.week} joined this week`} />
        <Stat label="Factories" value={d.employers.total} sub={`${d.employers.verified} verified · ${d.employers.paused} paused`} />
        <Stat label="Live jobs" value={d.jobs.live} sub={`${d.jobs.hidden} hidden by staff`} />
        <Stat label="Applications" value={d.applications.total} sub={`${d.applications.joined} joined`} />
        <Stat label="Verification queue" value={d.verification.pending} sub={d.verification.pending ? `oldest waiting ${d.verification.oldestHours}h` : 'all clear'} tone={d.verification.oldestHours > 48 ? 'red' : undefined} />
        <Stat label="Open fee complaints" value={d.reports.open} />
        <Stat label="Open privacy grievances" value={d.grievances.open} sub={d.grievances.overdue ? `${d.grievances.overdue} past deadline` : 'none overdue'} tone={d.grievances.overdue ? 'red' : undefined} />
        <Stat label="Revenue (paid)" value={inr(d.revenue.total)} sub={`${inr(d.revenue.last30)} in 30 days · ${d.revenue.orders} orders`} />
      </div>
      {(can('verification') && d.verification.pending > 0) && <Card title="Needs your attention"><div className="flex flex-wrap gap-2">
        <Btn onClick={() => go('verification')}>Review {d.verification.pending} pending verification(s)</Btn>
        {can('grievances') && d.grievances.overdue > 0 && <Btn tone="red" onClick={() => go('grievances')}>{d.grievances.overdue} grievance(s) overdue</Btn>}
      </div></Card>}
      <Card title="New sign-ups, last 30 days">
        <div className="flex h-32 items-end gap-1" role="img" aria-label="Daily sign-ups bar chart">
          {d.signups.map((s: any) => <div key={s.day} title={`${s.day}: ${s.workers} workers, ${s.employers} factories`} className="flex flex-1 flex-col justify-end"><div className="bg-blue-600" style={{ height: `${(s.employers / max) * 100}%` }} /><div className="bg-slate-800" style={{ height: `${(s.workers / max) * 100}%` }} /></div>)}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 bg-slate-800" />Workers</span><span><i className="mr-1 inline-block h-2 w-2 bg-blue-600" />Factories</span></div>
      </Card>
    </div>
  );
}

// ---------- Verification ----------
export function Verification() {
  const [key, setKey] = useState(0); const [sel, setSel] = useState<any>(null); const t = useToast();
  const cols: Col<any>[] = [
    { head: 'Submitted', cell: (r) => fmt(r.submittedAt) },
    { head: 'Who', cell: (r) => <><div className="font-semibold">{r.subjectName}</div><div className="text-xs text-slate-500">{r.subjectType}</div></> },
    { head: 'Check', cell: (r) => r.kind.replace(/_/g, ' ').toLowerCase() },
    { head: 'Number / evidence', cell: (r) => <><div>{r.documentNumber || '—'}</div><div className="text-xs text-slate-500">{r.evidence}</div></> },
    { head: 'Status', cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { head: 'Reviewed by', cell: (r) => r.reviewer ?? '—' },
    { head: '', cell: (r) => r.status === 'PENDING' ? <Btn small onClick={() => setSel(r)}>Review</Btn> : null },
  ];
  return (
    <>
      <ListView path="/admin/verifications" cols={cols} reloadKey={key} fixed={{}} filters={[{ key: 'status', label: 'Status', options: ['PENDING', 'VERIFIED', 'REJECTED'] }]} empty="No verification records." />
      {sel && <Review rec={sel} onClose={() => setSel(null)} done={(m) => { t.toast(m); setKey(key + 1); }} />}
      {t.node}
    </>
  );
}
function Review({ rec, onClose, done }: { rec: any; onClose: () => void; done: (m: string) => void }) {
  const [reject, setReject] = useState(false); const [code, setCode] = useState('DOCUMENT_UNCLEAR');
  const call = (status: 'VERIFIED' | 'REJECTED') => async (notes: string) => { await api('POST', '/admin/verify', { recordId: rec.id, status, reasonCode: status === 'REJECTED' ? code : undefined, reviewerNotes: notes || undefined }); done(`${rec.subjectName}: ${status.toLowerCase()}`); };
  if (reject) return <ReasonDialog title={`Reject ${rec.subjectName}`} cta="Reject" tone="red" onClose={onClose} onSubmit={call('REJECTED')} extra={<Field label="Reason type"><select className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}>{['DOCUMENT_UNCLEAR', 'DETAILS_MISMATCH', 'GSTIN_CANCELLED', 'SUSPECTED_FAKE', 'OTHER'].map((c) => <option key={c}>{c}</option>)}</select></Field>} />;
  return (
    <Modal title={`Review: ${rec.subjectName}`} onClose={onClose}>
      <dl className="space-y-2 text-sm"><div><dt className="text-slate-500">Check</dt><dd className="font-semibold">{rec.kind.replace(/_/g, ' ')}</dd></div><div><dt className="text-slate-500">Number</dt><dd className="font-semibold">{rec.documentNumber || '—'}</dd></div><div><dt className="text-slate-500">Evidence</dt><dd>{rec.evidence || '—'}</dd></div></dl>
      <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Check the GSTIN on the government GST portal and match the legal name before approving. Approving a factory also gives it its welcome credits.</p>
      <div className="mt-4 flex justify-end gap-2"><Btn tone="light" onClick={onClose}>Close</Btn><Btn tone="red" onClick={() => setReject(true)}>Reject…</Btn><Btn tone="green" onClick={async () => { try { await call('VERIFIED')(''); onClose(); } catch (e) { alert(e instanceof ApiError ? e.message : 'Failed'); } }}>Approve</Btn></div>
    </Modal>
  );
}

// ---------- Workers ----------
export function Workers({ can }: { can: Can }) {
  const [key, setKey] = useState(0); const [open, setOpen] = useState<string | null>(null);
  const cols: Col<any>[] = [
    { head: 'Worker', cell: (r) => <><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.id}</div></> },
    { head: 'Phone', cell: (r) => r.phone }, { head: 'Trade', cell: (r) => r.trade }, { head: 'City', cell: (r) => r.city },
    { head: 'Applications', cell: (r) => r.applications }, { head: 'Joined', cell: (r) => fmt(r.joinedAt) },
    { head: 'Account', cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];
  return <>
    <ListView path="/admin/workers" cols={cols} reloadKey={key} onRow={(r) => setOpen(r.id)} filters={[{ key: 'q', label: 'Search name, city, ID or phone digits', search: true }, { key: 'status', label: 'Account', options: ['active', 'suspended'] }]} />
    {open && <WorkerDetail id={open} can={can} onClose={() => { setOpen(null); setKey(key + 1); }} />}
  </>;
}
function WorkerDetail({ id, can, onClose }: { id: string; can: Can; onClose: () => void }) {
  const [d, setD] = useState<any>(null); const [act, setAct] = useState(false); const [n, setN] = useState(0);
  useEffect(() => { api('GET', `/admin/workers/${id}`).then(setD).catch(() => onClose()); }, [id, n]);
  if (!d) return null;
  const w = d.worker; const sus = w.status === 'suspended';
  return <Modal wide title={w.name} onClose={onClose}>
    <p className="mb-3 rounded bg-slate-50 p-2 text-xs text-slate-600">Opening this record was logged. Use personal details only for the task at hand.</p>
    <div className="grid grid-cols-2 gap-2 text-sm"><div>Phone: <b>{w.phone}</b></div><div>Trade: <b>{w.trade}</b></div><div>City: <b>{w.city}</b></div><div>Home state: <b>{w.state}</b></div><div>Expected pay: <b>{w.expectedSalary ? inr(w.expectedSalary) : '—'}</b></div><div>In directory: <b>{w.directoryVisible ? 'Yes' : 'No'}</b></div><div>Joined: <b>{fmt(w.joinedAt)}</b></div><div>Last sign-in: <b>{fmt(w.lastLoginAt)}</b></div><div>Account: <Badge tone={statusTone(w.status)}>{w.status}</Badge></div></div>
    <h4 className="mt-4 font-bold">Applications ({d.applications.length})</h4>
    <ul className="text-sm">{d.applications.map((a: any) => <li key={a.id} className="border-t py-1">{a.job} · {a.company} · <Badge tone={statusTone(a.status)}>{a.status}</Badge> · {fmt(a.at)}</li>)}</ul>
    <h4 className="mt-3 font-bold">Offers ({d.offers.length})</h4>
    <ul className="text-sm">{d.offers.map((a: any) => <li key={a.id} className="border-t py-1">{a.company} · {a.monthlyInHand ? inr(a.monthlyInHand) : ''} · {a.status}</li>)}</ul>
    <h4 className="mt-3 font-bold">Verification</h4>
    <ul className="text-sm">{d.verifications.map((a: any) => <li key={a.id} className="border-t py-1">{a.kind.replace(/_/g, ' ')} · <Badge tone={statusTone(a.status)}>{a.status}</Badge></li>)}{!d.verifications.length && <li className="text-slate-500">None submitted</li>}</ul>
    <h4 className="mt-3 font-bold">Latest consent</h4>
    <p className="text-sm">{d.consent ? `Policy ${d.consent.policyVersion} · directory ${d.consent.directory ? 'yes' : 'no'} · WhatsApp ${d.consent.whatsapp ? 'yes' : 'no'}${d.consent.withdrawn ? ' · withdrawn' : ''} · ${fmt(d.consent.at)}` : 'None on record'}</p>
    {can('users.suspend') && <div className="mt-4 flex justify-end"><Btn tone={sus ? 'green' : 'red'} onClick={() => setAct(true)}>{sus ? 'Restore account' : 'Suspend account'}</Btn></div>}
    {act && <ReasonDialog title={sus ? 'Restore worker' : 'Suspend worker'} intro={sus ? 'They will be able to sign in again.' : 'They are signed out at once and removed from the factory search.'} cta={sus ? 'Restore' : 'Suspend'} tone={sus ? 'green' : 'red'} onClose={() => setAct(false)} onSubmit={async (reason) => { await api('POST', `/admin/workers/${id}/suspend`, { suspend: !sus, reason }); setN(n + 1); }} />}
  </Modal>;
}

// ---------- Factories ----------
export function Factories({ can }: { can: Can }) {
  const [key, setKey] = useState(0); const [open, setOpen] = useState<string | null>(null);
  const cols: Col<any>[] = [
    { head: 'Factory', cell: (r) => <><div className="font-semibold">{r.company}</div><div className="text-xs text-slate-500">{r.gstin}</div></> },
    { head: 'KYB', cell: (r) => <Badge tone={statusTone(r.kyb)}>{r.kyb}</Badge> },
    { head: 'Credits', cell: (r) => r.credits }, { head: 'Jobs', cell: (r) => r.jobs },
    { head: 'State', cell: (r) => <>{r.paused && <Badge tone="red">paused</Badge>} {r.status === 'suspended' && <Badge tone="red">suspended</Badge>}{!r.paused && r.status !== 'suspended' && <Badge tone="green">normal</Badge>}</> },
    { head: 'Joined', cell: (r) => fmt(r.joinedAt) },
  ];
  return <>
    <ListView path="/admin/employers" cols={cols} reloadKey={key} onRow={(r) => setOpen(r.id)} filters={[{ key: 'q', label: 'Search name, GSTIN or ID', search: true }, { key: 'kyb', label: 'KYB', options: ['PENDING', 'VERIFIED', 'CANCELLED_GSTIN'] }]} />
    {open && <FactoryDetail id={open} can={can} onClose={() => { setOpen(null); setKey(key + 1); }} />}
  </>;
}
function FactoryDetail({ id, can, onClose }: { id: string; can: Can; onClose: () => void }) {
  const [d, setD] = useState<any>(null); const [n, setN] = useState(0); const [act, setAct] = useState<string | null>(null); const [delta, setDelta] = useState('10');
  useEffect(() => { api('GET', `/admin/employers/${id}`).then(setD).catch(() => onClose()); }, [id, n]);
  if (!d) return null;
  const e = d.employer; const sus = e.status === 'suspended';
  const post = (path: string, body: any) => async (reason: string) => { await api('POST', `/admin/employers/${id}/${path}`, { ...body, reason }); setN(n + 1); };
  return <Modal wide title={e.company} onClose={onClose}>
    <p className="mb-3 rounded bg-slate-50 p-2 text-xs text-slate-600">Opening this record was logged.</p>
    <div className="grid grid-cols-2 gap-2 text-sm"><div>GSTIN: <b>{e.gstin}</b></div><div>KYB: <Badge tone={statusTone(e.kyb)}>{e.kyb}</Badge></div><div>HR: <b>{e.hr || '—'}</b></div><div>HR phone: <b>{e.hrPhone || '—'}</b></div><div>Credits: <b>{e.credits}</b></div><div>Joined: <b>{fmt(e.joinedAt)}</b></div><div>Posting: {e.paused ? <Badge tone="red">paused</Badge> : <Badge tone="green">allowed</Badge>}</div><div>Account: <Badge tone={statusTone(e.status)}>{e.status}</Badge></div></div>
    <h4 className="mt-4 font-bold">Jobs ({d.jobs.length})</h4><ul className="text-sm">{d.jobs.map((j: any) => <li key={j.id} className="border-t py-1">{j.title} · {j.moderation} · {j.vacancies} open</li>)}</ul>
    <h4 className="mt-3 font-bold">Team</h4><ul className="text-sm">{d.team.map((m: any, i: number) => <li key={i} className="border-t py-1">{m.name} · {m.role} · {m.phone}</li>)}</ul>
    <h4 className="mt-3 font-bold">Credit history</h4><ul className="text-sm">{d.ledger.map((l: any) => <li key={l.id} className="border-t py-1">{fmt(l.at)} · {l.change > 0 ? '+' : ''}{l.change} · {l.reason} · balance {l.balance}</li>)}</ul>
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      {can('credits.adjust') && <><input aria-label="Credits to add or remove" className={`${inputCls} !w-24`} value={delta} onChange={(x) => setDelta(x.target.value)} /><Btn tone="light" onClick={() => setAct('credits')}>Adjust credits</Btn></>}
      {can('verification') && <Btn tone="light" onClick={() => setAct('reopen')}>Re-check GSTIN</Btn>}
      {can('users.suspend') && <><Btn tone="light" onClick={() => setAct('pause')}>{e.paused ? 'Resume posting' : 'Pause posting'}</Btn><Btn tone={sus ? 'green' : 'red'} onClick={() => setAct('suspend')}>{sus ? 'Restore factory' : 'Suspend factory'}</Btn></>}
    </div>
    {act === 'credits' && <ReasonDialog title="Adjust credits" intro={`Change by ${Number(delta) > 0 ? '+' : ''}${delta}. The factory is notified and this goes in the ledger.`} cta="Apply" onClose={() => setAct(null)} onSubmit={post('credits', { change: Math.trunc(Number(delta)) })} />}
    {act === 'reopen' && <ReasonDialog title="Send back to verification" intro="Its jobs go private until it is approved again." cta="Re-open" onClose={() => setAct(null)} onSubmit={post('reopen-verification', {})} />}
    {act === 'pause' && <ReasonDialog title={e.paused ? 'Resume posting' : 'Pause posting'} cta="Confirm" onClose={() => setAct(null)} onSubmit={post('pause', { paused: !e.paused })} />}
    {act === 'suspend' && <ReasonDialog title={sus ? 'Restore factory' : 'Suspend factory'} intro={sus ? undefined : 'All its staff are signed out and its jobs are hidden.'} cta="Confirm" tone={sus ? 'green' : 'red'} onClose={() => setAct(null)} onSubmit={post('suspend', { suspend: !sus })} />}
  </Modal>;
}

// ---------- Jobs ----------
export function Jobs({ can }: { can: Can }) {
  const [key, setKey] = useState(0); const [sel, setSel] = useState<any>(null);
  const cols: Col<any>[] = [
    { head: 'Job', cell: (r) => <><div className="font-semibold">{r.title}</div><div className="text-xs text-slate-500">{r.company} · {r.hub}</div></> },
    { head: 'Trade', cell: (r) => r.trade }, { head: 'Take-home', cell: (r) => (r.pay ? inr(r.pay) : '—') },
    { head: 'Flags', cell: (r) => r.flagged.length ? <Badge tone="amber">{r.flagged.join(', ')}</Badge> : '—' },
    { head: 'Status', cell: (r) => <Badge tone={statusTone(r.moderation)}>{r.moderation === 'Paused' ? 'Hidden by staff' : r.moderation}</Badge> },
    { head: 'Posted', cell: (r) => fmt(r.postedAt) },
    { head: '', cell: (r) => can('jobs.moderate') ? <Btn small tone="light" onClick={() => setSel(r)}>{r.moderation === 'Paused' ? 'Restore' : 'Hide'}</Btn> : null },
  ];
  return <>
    <ListView path="/admin/jobs" cols={cols} reloadKey={key} filters={[{ key: 'q', label: 'Search title, company or ID', search: true }, { key: 'moderation', label: 'Status', options: ['Approved', 'Paused'] }]} />
    {sel && <ReasonDialog title={`${sel.moderation === 'Paused' ? 'Restore' : 'Hide'}: ${sel.title}`} intro="The factory is notified with your reason." cta="Confirm" onClose={() => setSel(null)} onSubmit={async (reason) => { await api('POST', `/admin/jobs/${sel.id}/moderate`, { action: sel.moderation === 'Paused' ? 'restore' : 'hide', reason }); setKey(key + 1); }} />}
  </>;
}

// ---------- Fee complaints ----------
export function Reports() {
  const [key, setKey] = useState(0); const [sel, setSel] = useState<any>(null);
  const cols: Col<any>[] = [
    { head: 'Company', cell: (r) => <><div className="font-semibold">{r.company}</div><div className="text-xs text-slate-500">{r.thekedar && `Contractor: ${r.thekedar}`}</div></> },
    { head: 'Issue', cell: (r) => <><div>{r.issue}{r.amount ? ` · ${inr(r.amount)}` : ''}</div><div className="max-w-md text-xs text-slate-500">{r.details}</div></> },
    { head: 'Reporter', cell: (r) => r.reporterPhone || '—' },
    { head: 'Status', cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { head: 'Factory', cell: (r) => r.companyPaused === null ? 'Not on platform' : r.companyPaused ? <Badge tone="red">paused</Badge> : 'posting' },
    { head: 'When', cell: (r) => fmt(r.at) }, { head: '', cell: (r) => <Btn small onClick={() => setSel(r)}>Act</Btn> },
  ];
  return <>
    <ListView path="/admin/reports" cols={cols} reloadKey={key} filters={[{ key: 'status', label: 'Status', options: ['New', 'Investigating', 'Under Investigation', 'Confirmed — Factory Paused', 'Resolved', 'Dismissed'] }]} />
    {sel && <ReportAct r={sel} onClose={() => { setSel(null); setKey(key + 1); }} />}
  </>;
}
function ReportAct({ r, onClose }: { r: any; onClose: () => void }) {
  const [status, setStatus] = useState('Investigating'); const [pause, setPause] = useState(false); const [resume, setResume] = useState(false);
  return <ReasonDialog title={`Report against ${r.company}`} cta="Save" onClose={onClose} onSubmit={async (note) => { await api('PATCH', `/admin/reports/${r.id}`, { status, outcomeNote: note, pauseFactoryPostings: pause || undefined, resumeFactoryPostings: resume || undefined }); }}
    extra={<div className="space-y-2"><Field label="New status"><select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>{['Investigating', 'Under Investigation', 'Confirmed — Factory Paused', 'Resolved', 'Dismissed'].map((s) => <option key={s}>{s}</option>)}</select></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pause} onChange={(e) => { setPause(e.target.checked); if (e.target.checked) setResume(false); }} /> Pause this factory's job posting</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={resume} onChange={(e) => { setResume(e.target.checked); if (e.target.checked) setPause(false); }} /> Resume this factory's posting</label></div>} />;
}

// ---------- Grievances ----------
export function Grievances() {
  const [key, setKey] = useState(0); const [sel, setSel] = useState<any>(null);
  const cols: Col<any>[] = [
    { head: 'Person', cell: (r) => <><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.phone} · {r.role}</div></> },
    { head: 'Request', cell: (r) => <><div>{r.category}</div><div className="max-w-md text-xs text-slate-500">{r.description}</div></> },
    { head: 'Status', cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { head: 'Deadline', cell: (r) => <span className={r.overdue ? 'font-bold text-red-600' : ''}>{fmt(r.dueAt)}{r.overdue ? ' (overdue)' : ''}</span> },
    { head: '', cell: (r) => r.status !== 'Resolved' ? <Btn small onClick={() => setSel(r)}>Update</Btn> : null },
  ];
  return <>
    <ListView path="/admin/grievances" cols={cols} reloadKey={key} filters={[{ key: 'status', label: 'Status', options: ['Registered with DPO', 'Under Investigation', 'Resolved'] }]} />
    {sel && <GrievanceAct g={sel} onClose={() => { setSel(null); setKey(key + 1); }} />}
  </>;
}
function GrievanceAct({ g, onClose }: { g: any; onClose: () => void }) {
  const [status, setStatus] = useState('Under Investigation');
  return <ReasonDialog title="Update grievance" cta="Save" needReason={status === 'Resolved'} onClose={onClose} intro="Describe what was done. Required when resolving." onSubmit={async (note) => { await api('PATCH', `/admin/grievances/${g.id}`, { status, note: note || undefined }); }}
    extra={<Field label="New status"><select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>{['Under Investigation', 'Resolved'].map((s) => <option key={s}>{s}</option>)}</select></Field>} />;
}

// ---------- Payments ----------
export function Payments() {
  const [tab, setTab] = useState<'orders' | 'ledger'>('orders');
  const orders: Col<any>[] = [{ head: 'When', cell: (r) => fmt(r.at) }, { head: 'Factory', cell: (r) => r.company }, { head: 'Pack', cell: (r) => `${r.pack} · ${r.credits} credits` }, { head: 'Amount', cell: (r) => inr(r.amount) }, { head: 'Status', cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> }, { head: 'Provider ref', cell: (r) => r.providerPaymentId ?? '—' }];
  const ledger: Col<any>[] = [{ head: 'When', cell: (r) => fmt(r.at) }, { head: 'Factory', cell: (r) => r.company }, { head: 'Change', cell: (r) => `${r.change > 0 ? '+' : ''}${r.change}` }, { head: 'Reason', cell: (r) => r.reason }, { head: 'Note', cell: (r) => r.reference ?? '—' }, { head: 'Balance', cell: (r) => r.balance }, { head: 'Invoice', cell: (r) => r.invoice ?? '—' }];
  return <div><div className="mb-3 flex gap-2"><Btn tone={tab === 'orders' ? 'dark' : 'light'} onClick={() => setTab('orders')}>Payments</Btn><Btn tone={tab === 'ledger' ? 'dark' : 'light'} onClick={() => setTab('ledger')}>Credit ledger</Btn></div>
    {tab === 'orders' ? <ListView key="o" path="/admin/orders" cols={orders} filters={[{ key: 'status', label: 'Status', options: ['created', 'paid', 'failed'] }]} /> : <ListView key="l" path="/admin/ledger" cols={ledger} filters={[{ key: 'reason', label: 'Reason', options: ['CREDIT_PACK_PURCHASE', 'PILOT_TRIAL_GRANT', 'CANDIDATE_INVITE_UNLOCK', 'ADMIN_ADJUSTMENT'] }]} />}</div>;
}

// ---------- Notifications ----------
export function Notifications() {
  const cols: Col<any>[] = [{ head: 'When', cell: (r) => fmt(r.at) }, { head: 'To', cell: (r) => r.to }, { head: 'Type', cell: (r) => r.type }, { head: 'Message', cell: (r) => <><div className="font-semibold">{r.title}</div><div className="text-xs text-slate-500">{r.body}</div></> }, { head: 'Read', cell: (r) => (r.read ? 'Yes' : 'No') }];
  return <ListView path="/admin/notifications" cols={cols} />;
}

// ---------- Audit ----------
export function Audit() {
  const [actions, setActions] = useState<string[]>([]);
  const cols: Col<any>[] = [{ head: 'When', cell: (r) => fmt(r.at) }, { head: 'Action', cell: (r) => <Badge>{r.action}</Badge> }, { head: 'About', cell: (r) => <><div className="font-semibold">{r.subject}</div><div className="text-xs text-slate-500">{r.subjectId}</div></> }, { head: 'Details', cell: (r) => <span className="text-xs">{r.details}</span> }, { head: 'Staff', cell: (r) => r.actor ?? 'system / user' }, { head: 'IP', cell: (r) => r.ip ?? '—' }];
  return <div>
    <div className="mb-2 flex justify-end"><a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold" href="/api/admin/audit.csv" download>Download CSV (latest 5,000)</a></div>
    <ListView path="/admin/audit" cols={cols} bump={({ extra }) => extra.actions && setActions(extra.actions)} filters={[{ key: 'q', label: 'Search name, ID or details', search: true }, { key: 'actor', label: 'Staff email', search: true }, ...(actions.length ? [{ key: 'action', label: 'Action', options: actions }] : [])]} />
  </div>;
}

// ---------- Staff ----------
export function Staff() {
  const [key, setKey] = useState(0); const [roles, setRoles] = useState<string[]>([]); const [create, setCreate] = useState(false); const [act, setAct] = useState<{ kind: string; row: any } | null>(null); const t = useToast();
  const patch = (row: any, body: any) => api('PATCH', `/admin/staff/${row.id}`, body).then(() => { setKey(key + 1); t.toast('Saved'); }).catch((e) => t.toast(e.message, true));
  const cols: Col<any>[] = [
    { head: 'Staff', cell: (r) => <><div className="font-semibold">{r.name} {r.you && <Badge tone="blue">you</Badge>}</div><div className="text-xs text-slate-500">{r.email}</div></> },
    { head: 'Role', cell: (r) => r.you ? r.role : <select aria-label={`Role for ${r.email}`} className={`${inputCls} !w-auto`} value={r.role} onChange={(e) => patch(r, { role: e.target.value })}>{roles.map((x) => <option key={x}>{x}</option>)}</select> },
    { head: 'State', cell: (r) => <>{r.status === 'active' ? <Badge tone="green">active</Badge> : <Badge tone="red">disabled</Badge>} {r.locked && <Badge tone="amber">locked</Badge>} {!r.authenticator && <Badge tone="amber">no authenticator</Badge>} {r.mustChangePassword && <Badge tone="amber">temp password</Badge>}</> },
    { head: 'Last sign-in', cell: (r) => fmt(r.lastLoginAt) },
    { head: '', cell: (r) => r.you ? null : <div className="flex flex-wrap gap-1"><Btn small tone="light" onClick={() => setAct({ kind: 'pw', row: r })}>Reset password</Btn><Btn small tone="light" onClick={() => setAct({ kind: 'auth', row: r })}>Reset authenticator</Btn>{r.locked && <Btn small tone="light" onClick={() => api('POST', `/admin/staff/${r.id}/unlock`, {}).then(() => setKey(key + 1))}>Unlock</Btn>}<Btn small tone={r.status === 'active' ? 'red' : 'green'} onClick={() => patch(r, { disabled: r.status === 'active' })}>{r.status === 'active' ? 'Disable' : 'Enable'}</Btn></div> },
  ];
  return <div>
    <div className="mb-3 flex justify-end"><Btn onClick={() => setCreate(true)}>Add staff member</Btn></div>
    <ListView path="/admin/staff" cols={cols} reloadKey={key} bump={({ extra }) => extra.roles && setRoles(extra.roles)} />
    {create && <CreateStaff roles={roles} onClose={() => setCreate(false)} done={() => { setKey(key + 1); t.toast('Staff member added'); }} />}
    {act?.kind === 'pw' && <TempPassword row={act.row} onClose={() => setAct(null)} />}
    {act?.kind === 'auth' && <ReasonDialog needReason={false} title={`Reset authenticator for ${act.row.email}`} intro="They are signed out and will set up a new authenticator at next sign-in." cta="Reset" tone="red" onClose={() => setAct(null)} onSubmit={async () => { await api('POST', `/admin/staff/${act.row.id}/reset-authenticator`, {}); setKey(key + 1); }} />}
    {t.node}
  </div>;
}
function CreateStaff({ roles, onClose, done }: { roles: string[]; onClose: () => void; done: () => void }) {
  const [f, setF] = useState({ email: '', name: '', role: 'Verifier', password: '' });
  return <ReasonDialog needReason={false} title="Add staff member" cta="Create" onClose={onClose} onSubmit={async () => { await api('POST', '/admin/staff', f); done(); }} intro="Give them the temporary password privately. They must choose their own and set up an authenticator at first sign-in."
    extra={<div className="space-y-2"><Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Work email"><input className={inputCls} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Role" hint="Super Admin: everything. Trust & Safety: moderation. Verifier: KYB and documents. Support: grievances and notices. Finance: payments and credits."><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Temporary password (12+ characters)"><input className={inputCls} type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field></div>} />;
}
function TempPassword({ row, onClose }: { row: any; onClose: () => void }) {
  const [pw, setPw] = useState('');
  return <ReasonDialog needReason={false} title={`Reset password for ${row.email}`} cta="Reset" tone="red" intro="They are signed out and must choose a new password at next sign-in." onClose={onClose} onSubmit={async () => { await api('POST', `/admin/staff/${row.id}/reset-password`, { password: pw }); }} extra={<Field label="Temporary password"><input className={inputCls} autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>} />;
}

// ---------- System ----------
export function System() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api('GET', '/admin/system').then(setD); }, []);
  if (!d) return <p className="text-slate-500">Loading…</p>;
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Database" value={d.database.ok ? 'Healthy' : 'DOWN'} sub={`${d.database.latencyMs} ms · ${d.database.sizeMb} MB`} tone={d.database.ok ? undefined : 'red'} /><Stat label="Active user sessions" value={d.sessions.users} /><Stat label="Active staff sessions" value={d.sessions.staff} /><Stat label="Runtime" value={d.environment.mode} sub={`Node ${d.environment.node} · up ${d.environment.uptimeMin} min`} /></div>
    <Card title="Configuration check (no secrets shown)"><ul className="space-y-1 text-sm">{d.configuration.map((f: any, i: number) => <li key={i}><Badge tone={f.level === 'ok' ? 'green' : f.level === 'warn' ? 'amber' : 'red'}>{f.level}</Badge> <b>{f.area}</b> {f.message}</li>)}</ul></Card>
    <Card title="Database migrations"><ul className="text-sm">{d.database.migrations.map((m: any) => <li key={m.name}>{m.name} <span className="text-slate-500">{fmt(m.at)}</span></li>)}</ul></Card>
  </div>;
}

// ---------- My account ----------
export function Account({ me, onChanged }: { me: any; onChanged: () => void }) {
  const [rows, setRows] = useState<any[]>([]); const t = useToast();
  const load = () => api('GET', '/admin-auth/sessions').then((d) => setRows(d.sessions));
  useEffect(() => { load(); }, []);
  return <div className="space-y-4">
    <Card title="Your account"><p className="text-sm">{me.displayName} · {me.email} · <b>{me.adminRole}</b></p></Card>
    <Card title="Change password"><ChangePassword onDone={() => { t.toast('Password changed. Other sessions were ended.'); onChanged(); load(); }} /></Card>
    <Card title="Where you are signed in" right={<Btn small tone="light" onClick={() => api('POST', '/admin-auth/sessions/revoke-others', {}).then(() => { t.toast('Other sessions ended'); load(); })}>Sign out everywhere else</Btn>}>
      <ul className="text-sm">{rows.map((s) => <li key={s.id} className="border-t py-1.5">{s.device?.slice(0, 70)} · {s.ip} · started {fmt(s.startedAt)} {s.current && <Badge tone="green">this device</Badge>}</li>)}</ul>
    </Card>
    {t.node}
  </div>;
}
