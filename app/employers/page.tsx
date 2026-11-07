import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { EmployerPitchClient } from './EmployerPitchClient';
import { languageForCookie } from '../../src/utils/routes';

export const metadata: Metadata = {
  title: 'Hire verified factory talent | Shramkart',
  description: 'Connect directly with verified manufacturing workers and ITI technicians.',
};

export default async function EmployersPage() {
  const language = languageForCookie((await cookies()).get('hj_language')?.value);
  return (
    <main className="min-h-screen bg-[var(--sk-canvas)]">
      <header className="border-b border-[var(--sk-border)] bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6" aria-label="Main">
          <Link href="/" className="text-lg font-extrabold text-[var(--sk-ink)]">Shramkart</Link>
          <Link href="/jobs" className="text-sm font-semibold text-[var(--sk-body)] hover:text-[var(--sk-ink)]">Find work</Link>
        </nav>
      </header>
      <EmployerPitchClient language={language} />
    </main>
  );
}