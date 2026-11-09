import React from 'react';

/**
 * The Shramkart badge (a welder in an orange ring), served from /icon.svg so it is cached and not part of the page
 * script. Next to the written name it is decorative, so BrandLogo passes `decorative`; on its own it is named.
 */
export const BrandMark: React.FC<{ className?: string; decorative?: boolean }> = ({ className = 'w-9 h-9', decorative = false }) => (
  // biome-ignore lint/performance/noImgElement: next/image does not optimise SVG, so a plain <img> is correct here
  <img src="/icon.svg" alt={decorative ? '' : 'Shramkart'} width={36} height={37} decoding="async" draggable={false} className={`${className} shrink-0 object-contain`} />
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
      <BrandMark decorative className={size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'} />
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
