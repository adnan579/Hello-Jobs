'use client';

import { useRouter } from 'next/navigation';
import { EmployerPitch } from '../../../src/components/EmployerPitch';
import { makeT } from '../../../src/data/translations';
import type { Language } from '../../../src/types';

export function EmployerPitchClient({ language }: { language: Language }) {
  const router = useRouter();
  const t = makeT(language);
  return (
    <EmployerPitch
      t={t}
      onRegister={() => router.push('/login?role=employer&mode=register')}
      onLogin={() => router.push('/login?role=employer')}
      onSeeHow={() => router.push('/about')}
    />
  );
}