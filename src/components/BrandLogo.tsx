import React from 'react';

/** The Shramkart mark: an amber tile with a bold S and a hi-vis safety stripe. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Shramkart" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="sk-tile"><rect width="64" height="64" rx="15" /></clipPath>
    </defs>
    <g clipPath="url(#sk-tile)">
      <rect width="64" height="64" fill="#F5A524" />
      <g fill="#14181F">
        <path d="M-2 64 L14 48 H26 L10 64 Z" />
        <path d="M22 64 L38 48 H50 L34 64 Z" />
        <path d="M46 64 L62 48 H74 L58 64 Z" />
      </g>
    </g>
    <path d="M44 15 H26 C19 15 19 27 26 27 H38 C45 27 45 39 38 39 H20" fill="none" stroke="#14181F" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  /** 'light' for white backgrounds, 'dark' for dark backgrounds. */
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<Props> = ({ tone = 'light', size = 'md', showTagline = false }) => {
  const shram = tone === 'dark' ? 'text-white' : 'text-slate-900';
  const kart = tone === 'dark' ? 'text-amber-400' : 'text-amber-600';
  const tag = tone === 'dark' ? 'text-slate-400' : 'text-slate-500';
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark className={size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'} />
      <span className="flex flex-col leading-none text-left">
        <span className={`${size === 'sm' ? 'text-base' : 'text-xl'} font-extrabold tracking-tight`}>
          <span className={shram}>Shram</span>
          <span className={kart}>kart</span>
        </span>
        {showTagline && (
          <span className={`mt-1 hidden sm:block text-[10px] font-bold uppercase tracking-[0.14em] ${tag}`}>
            Direct hands · Fair pay
          </span>
        )}
      </span>
    </span>
  );
};
