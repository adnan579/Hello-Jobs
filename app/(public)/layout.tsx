import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '../../src/index.css';
import { languageForCookie } from '../../src/utils/routes';
import { notoSans, notoSansDevanagari } from './fonts';

const title = 'Shramkart — Direct Hands for Indian Industry';
const description = 'Direct Hands for Indian Industry. Zero Middlemen. 100% Fair Pay. Two-way blue and grey-collar workforce marketplace connecting manufacturing units with verified ITI technicians.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = { themeColor: '#F5A524' };

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = languageForCookie((await cookies()).get('hj_language')?.value);
  return (
    <html lang={lang} className={`${notoSans.variable} ${notoSansDevanagari.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
