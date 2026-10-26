import { useCallback, useEffect, useRef, useState } from 'react';
import { api, setUnauthorizedHandler, type Me } from './api.ts';
import { ChangePassword, Login } from './Login.tsx';
import { Account, Audit, Factories, Grievances, Jobs, Notifications, Overview, Payments, Reports, Staff, System, Verification, Workers } from './pages.tsx';

const IDLE_MS = 30 * 60_000;

const NAV: { id: string; label: string; perm: string }[] = [
  { id: 'overview', label: 'Overview', perm: 'dashboard' },
  { id: 'verification', label: 'Verification', perm: 'verification' },
  { id: 'workers', label: 'Workers', perm: 'users.view' },
  { id: 'factories', label: 'Factories', perm: 'users.view' },
  { id: 'jobs', label: 'Jobs', perm: 'jobs.moderate' },
  { id: 'reports', label: 'Fee complaints', perm: 'reports' },
  { id: 'grievances', label: 'Privacy requests', perm: 'grievances' },
  { id: 'payments', label: 'Payments & credits', perm: 'payments.view' },
  { id: 'notifications', label: 'Notifications', perm: 'notifications' },
  { id: 'audit', label: 'Audit log', perm: 'audit' },
  { id: 'staff', label: 'Staff', perm: 'staff' },
  { id: 'system', label: 'System', perm: 'system' },
];

export function AdminApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(() => location.hash.slice(1) || 'overview');
  const [menu, setMenu] = useState(false);
  const last = useRef(Date.now());

  const loadMe = useCallback(() => api('GET', '/admin-auth/me').then((d) => setMe(d.me)).catch(() => setMe(null)), []);
  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => { setUnauthorizedHandler(() => { setMe((m) => { if (m) setNotice('You were signed out. Please sign in again.'); return null; }); }); }, []);
  useEffect(() => { const h = () => setPage(location.hash.slice(1) || 'overview'); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);

  // Signs the screen out after 30 idle minutes (the server enforces the same limit).
  useEffect(() => {
    if (!me) return;
    const touch = () => { last.current = Date.now(); };
    const evs = ['mousemove', 'keydown', 'click', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, touch));
    const iv = setInterval(() => { if (Date.now() - last.current > IDLE_MS) { api('POST', '/admin-auth/logout', {}).catch(() => {}); setNotice('Signed out after 30 minutes of no activity.'); setMe(null); } }, 30_000);
    return () => { evs.forEach((e) => window.removeEventListener(e, touch)); clearInterval(iv); };
  }, [me]);

  const go = (p: string) => { location.hash = p; setMenu(false); };
  const logout = async () => { await api('POST', '/admin-auth/logout', {}).catch(() => {}); setNotice('You are signed out.'); setMe(null); };

  if (me === undefined) return <p className="p-8 text-slate-500">Loading…</p>;
  if (me === null) return <Login notice={notice} onDone={(m) => { setNotice(''); last.current = Date.now(); setMe(m); }} />;
  if (me.mustChangePassword) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-6">
      <h1 className="mb-3 text-lg font-extrabold">Set your own password</h1><ChangePassword forced onDone={loadMe} />
    </div></main>
  );

  const can = (p: string) => me.permissions.includes(p);
  const items = NAV.filter((n) => can(n.perm));
  const active = page === 'account' ? 'account' : items.find((i) => i.id === page)?.id ?? items[0]?.id ?? 'account';
  const title = active === 'account' ? 'My account' : items.find((i) => i.id === active)?.label;

  return (
    <div className="flex min-h-screen">
      <aside className={`${menu ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-40 w-60 overflow-y-auto bg-slate-900 p-3 text-slate-200 lg:static lg:block`}>
        <div className="mb-4 px-2 pt-2"><div className="text-lg font-extrabold text-white">Hello Jobs</div><div className="text-xs text-slate-400">Staff console</div></div>
        <nav aria-label="Console sections" className="space-y-0.5">
          {items.map((n) => <button key={n.id} onClick={() => go(n.id)} aria-current={active === n.id ? 'page' : undefined} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${active === n.id ? 'bg-white text-slate-900' : 'hover:bg-slate-800'}`}>{n.label}</button>)}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="flex items-center gap-3"><button className="lg:hidden rounded border px-2 py-1 text-sm" aria-label="Menu" onClick={() => setMenu(!menu)}>☰</button><h1 className="text-lg font-extrabold">{title}</h1></div>
          <div className="flex items-center gap-3 text-sm"><button onClick={() => go('account')} className="font-semibold underline-offset-2 hover:underline">{me.displayName} · {me.adminRole}</button><button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1 font-semibold">Sign out</button></div>
        </header>
        <main className="p-4">
          {active === 'overview' && <Overview go={go} can={can} />}
          {active === 'verification' && <Verification />}
          {active === 'workers' && <Workers can={can} />}
          {active === 'factories' && <Factories can={can} />}
          {active === 'jobs' && <Jobs can={can} />}
          {active === 'reports' && <Reports />}
          {active === 'grievances' && <Grievances />}
          {active === 'payments' && <Payments />}
          {active === 'notifications' && <Notifications />}
          {active === 'audit' && <Audit />}
          {active === 'staff' && <Staff />}
          {active === 'system' && <System />}
          {active === 'account' && <Account me={me} onChanged={loadMe} />}
        </main>
      </div>
    </div>
  );
}
