import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '../src/index.css';
import { languageForCookie } from '../src/utils/routes';

const title = 'Shramkart — Direct Hands for Indian Industry';
const description = 'Direct Hands for Indian Industry. Zero Middlemen. 100% Fair Pay. Two-way blue and grey-collar workforce marketplace connecting manufacturing units with verified ITI technicians.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#F5A524' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = languageForCookie((await cookies()).get('hj_language')?.value);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}