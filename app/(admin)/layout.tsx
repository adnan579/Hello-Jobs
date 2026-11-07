import type { Metadata } from 'next';
import './admin/admin.css';

export const metadata: Metadata = {
  title: 'Shramkart Staff Console',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}