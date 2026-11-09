import type { Metadata } from 'next';
import './admin/admin.css';

// Rendered per request, never prerendered: the strict page policy in proxy.ts lets only scripts that carry
// that request's nonce run, and Next can add the nonce only when it renders the page for the request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shramkart Staff Console',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}