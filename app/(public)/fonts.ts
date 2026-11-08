import localFont from 'next/font/local';

/**
 * Self-hosted variable fonts (the @fontsource-variable packages), so pages make no request to Google
 * and need no extra security-policy entries. Latin loads first; Devanagari (Hindi, Marathi) is only
 * downloaded when a page shows a character the Latin file does not have (including the ₹ sign).
 */
export const notoSans = localFont({
  src: '../../node_modules/@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-noto-sans',
  display: 'swap',
});

export const notoSansDevanagari = localFont({
  src: '../../node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-noto-sans-devanagari',
  display: 'swap',
  preload: false,
});
