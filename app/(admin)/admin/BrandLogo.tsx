export function BrandLogo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const text = tone === 'dark' ? 'text-white' : 'text-slate-900';
  const accent = tone === 'dark' ? 'text-amber-400' : 'text-amber-600';
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* biome-ignore lint/performance/noImgElement: next/image does not optimise SVG, so a plain <img> is correct here */}
      <img src="/icon.svg" alt="" width={36} height={37} decoding="async" draggable={false} className="h-10 w-10 shrink-0 object-contain" />
      <span className={`text-xl font-extrabold tracking-tight ${text}`}>Shram<span className={accent}>kart</span></span>
    </span>
  );
}
