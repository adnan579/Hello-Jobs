import { useState, type FormEvent } from 'react';
import { api, ApiError, type Me } from './api.ts';
import { Btn, Field, inputCls } from './ui.tsx';

type Step = { kind: 'password' } | { kind: 'code'; challenge: string } | { kind: 'enroll'; challenge: string; secret: string; qr: string };

export function Login({ onDone, notice }: { onDone: (me: Me) => void; notice?: string }) {
  const [step, setStep] = useState<Step>({ kind: 'password' });
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [code, setCode] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e instanceof ApiError ? e.message : 'Something went wrong.'); } setBusy(false); };

  const submitPassword = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api('POST', '/admin-auth/login', { email, password });
    setPassword(''); setCode('');
    setStep(r.next === 'enroll' ? { kind: 'enroll', challenge: r.challenge, secret: r.secret, qr: r.qr } : { kind: 'code', challenge: r.challenge });
  }); };
  const submitCode = (e: FormEvent) => { e.preventDefault(); if (step.kind === 'password') return; const challenge = step.challenge; run(async () => {
    const r = await api('POST', '/admin-auth/verify', { challenge, code });
    onDone(r.me);
  }); };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h1 className="text-xl font-extrabold text-slate-900">Hello Jobs Staff Console</h1>
        <p className="mb-4 text-sm text-slate-500">Authorised staff only. Everything you do here is recorded.</p>
        {notice && <p role="status" className="mb-3 rounded-lg bg-amber-50 p-2 text-sm font-semibold text-amber-800">{notice}</p>}
        {step.kind === 'password' ? (
          <form onSubmit={submitPassword} className="space-y-3">
            <Field label="Work email"><input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></Field>
            <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            {err && <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>}
            <Btn type="submit" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</Btn>
          </form>
        ) : (
          <form onSubmit={submitCode} className="space-y-3">
            {step.kind === 'enroll' && (
              <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-semibold">Set up your authenticator app (one time)</p>
                <p className="text-slate-600">Open Google Authenticator, Microsoft Authenticator or similar, add an account, and scan this code. Then type the 6 digits it shows.</p>
                <img src={step.qr} alt="Authenticator QR code" width={180} height={180} className="mx-auto rounded bg-white" />
                <p className="text-xs text-slate-500">Can't scan? Enter this key by hand:</p>
                <code className="block break-all rounded bg-white p-2 text-xs">{step.secret}</code>
              </div>
            )}
            <Field label="6-digit code from your authenticator app"><input className={`${inputCls} text-center text-lg tracking-widest`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus /></Field>
            {err && <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>}
            <div className="flex gap-2"><Btn type="submit" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Sign in'}</Btn><Btn tone="light" onClick={() => { setStep({ kind: 'password' }); setErr(''); }}>Back</Btn></div>
          </form>
        )}
      </div>
    </main>
  );
}

export function ChangePassword({ forced, onDone }: { forced?: boolean; onDone: () => void }) {
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [again, setAgain] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== again) return setErr('The two new passwords do not match.');
    setBusy(true); setErr('');
    try { await api('POST', '/admin-auth/change-password', { current, next }); setCurrent(''); setNext(''); setAgain(''); onDone(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      {forced && <p className="rounded-lg bg-amber-50 p-2 text-sm font-semibold text-amber-800">Choose your own password before you continue.</p>}
      <Field label="Current password"><input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></Field>
      <Field label="New password" hint="At least 12 characters. Not your email, not a common password."><input className={inputCls} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required /></Field>
      <Field label="New password again"><input className={inputCls} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required /></Field>
      {err && <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>}
      <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</Btn>
    </form>
  );
}
