import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, qs, ApiError } from './api.ts';

export const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'red' | 'amber' | 'blue' }) {
  const t = { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', blue: 'bg-blue-100 text-blue-800' }[tone];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${t}`}>{children}</span>;
}
export const statusTone = (s: string): 'slate' | 'green' | 'red' | 'amber' | 'blue' =>
  /verified|active|paid|approved|resolved|restored/i.test(s) ? 'green' : /reject|suspend|paused|fail|cancel|hidden|overdue/i.test(s) ? 'red' : /pending|issued|review|registered|investigat|flagged/i.test(s) ? 'amber' : 'slate';

export function Btn({ children, onClick, tone = 'dark', disabled, type = 'button', small }: { children: ReactNode; onClick?: () => void; tone?: 'dark' | 'light' | 'red' | 'green'; disabled?: boolean; type?: 'button' | 'submit'; small?: boolean }) {
  const t = { dark: 'bg-slate-900 text-white hover:bg-slate-700', light: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50', red: 'bg-red-600 text-white hover:bg-red-700', green: 'bg-emerald-600 text-white hover:bg-emerald-700' }[tone];
  return <button type={type} disabled={disabled} onClick={onClick} className={`rounded-lg font-semibold disabled:opacity-50 ${small ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'} ${t}`}>{children}</button>;
}

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none';
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-sm"><span className="mb-1 block font-semibold text-slate-700">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</label>;
}

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {(title || right) && <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="font-bold text-slate-900">{title}</h3>{right}</header>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`mt-10 w-full ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-xl bg-white shadow-xl`}>
        <header className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-bold">{title}</h2><button aria-label="Close" onClick={onClose} className="text-xl leading-none text-slate-500">×</button></header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); }, [msg]);
  const node = msg ? <div role="status" className={`fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${msg.bad ? 'bg-red-600' : 'bg-slate-900'}`}>{msg.text}</div> : null;
  return { toast: (text: string, bad = false) => setMsg({ text, bad }), node };
}

/** Asks for a written reason, then runs the action. Every sensitive staff action goes through this. */
export function ReasonDialog({ title, intro, cta, tone = 'dark', needReason = true, extra, onClose, onSubmit }: {
  title: string; intro?: ReactNode; cta: string; tone?: 'dark' | 'red' | 'green'; needReason?: boolean; extra?: ReactNode;
  onClose: () => void; onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const go = async () => {
    setBusy(true); setErr('');
    try { await onSubmit(reason.trim()); onClose(); } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {intro && <div className="text-sm text-slate-600">{intro}</div>}
        {extra}
        {needReason && <Field label="Reason (saved in the audit log)"><textarea className={inputCls} rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus /></Field>}
        {err && <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>}
        <div className="flex justify-end gap-2"><Btn tone="light" onClick={onClose}>Cancel</Btn><Btn tone={tone} disabled={busy || (needReason && reason.trim().length < 5)} onClick={go}>{busy ? 'Working…' : cta}</Btn></div>
      </div>
    </Modal>
  );
}

export interface Col<R> { head: string; cell: (r: R) => ReactNode; className?: string }

/** A searchable, paged list backed by one admin endpoint. */
export function ListView<R extends { id: string | number }>({ path, cols, filters, reloadKey, empty = 'Nothing here yet.', fixed, onRow, bump }: {
  path: string; cols: Col<R>[]; filters?: { key: string; label: string; options?: string[]; search?: boolean }[]; reloadKey?: number; empty?: string;
  fixed?: Record<string, string>; onRow?: (r: R) => void; bump?: (n: { total: number; extra: any }) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({});
  const [q, setQ] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ rows: R[]; total: number } | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { const d = await api(`GET`, `${path}${qs({ ...fixed, ...q, page })}`); setData(d); bump?.({ total: d.total, extra: d }); setErr(''); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load'); }
  }, [path, JSON.stringify(q), page, JSON.stringify(fixed), reloadKey]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!filters?.some((x) => x.search)) return; const t = setTimeout(() => { setQ(f); setPage(1); }, 350); return () => clearTimeout(t); }, [f]);
  const apply = (k: string, v: string) => { const n = { ...f, [k]: v }; setF(n); if (!filters?.find((x) => x.key === k)?.search) { setQ(n); setPage(1); } };
  const pages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1;
  return (
    <div>
      {filters && <div className="mb-3 flex flex-wrap gap-2">{filters.map((x) => x.options
        ? <select key={x.key} aria-label={x.label} className={`${inputCls} !w-auto`} value={f[x.key] ?? ''} onChange={(e) => apply(x.key, e.target.value)}><option value="">{x.label}: all</option>{x.options.map((o) => <option key={o}>{o}</option>)}</select>
        : <input key={x.key} aria-label={x.label} placeholder={x.label} className={`${inputCls} !w-64`} value={f[x.key] ?? ''} onChange={(e) => apply(x.key, e.target.value)} />)}</div>}
      {err && <p role="alert" className="mb-2 text-sm font-semibold text-red-600">{err}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{cols.map((c) => <th key={c.head} className="px-3 py-2 font-semibold">{c.head}</th>)}</tr></thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={r.id} onClick={onRow ? () => onRow(r) : undefined} className={`border-t border-slate-100 ${onRow ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
                {cols.map((c) => <td key={c.head} className={`px-3 py-2 align-top ${c.className ?? ''}`}>{c.cell(r)}</td>)}
              </tr>
            ))}
            {data && !data.rows.length && <tr><td colSpan={cols.length} className="px-3 py-8 text-center text-slate-500">{empty}</td></tr>}
            {!data && !err && <tr><td colSpan={cols.length} className="px-3 py-8 text-center text-slate-500">Loading…</td></tr>}
          </tbody>
        </table>
      </div>
      {data && data.total > 25 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>{data.total} total</span>
          <div className="flex items-center gap-2"><Btn small tone="light" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Btn><span>Page {page} of {pages}</span><Btn small tone="light" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Btn></div>
        </div>
      )}
    </div>
  );
}
