export function BrandLogo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const text = tone === 'dark' ? 'text-white' : 'text-slate-900';
  const accent = tone === 'dark' ? 'text-amber-400' : 'text-amber-600';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-extrabold text-slate-900" aria-hidden="true">S</span>
      <span className={`text-xl font-extrabold tracking-tight ${text}`}>Shram<span className={accent}>kart</span></span>
    </span>
  );
}
