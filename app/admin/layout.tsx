import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shramkart Staff Console',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}