import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRANSLATIONS, makeT } from '../src/data/translations';

const LANGS = ['en', 'hi', 'mr', 'ta', 'gu'] as const;

/** Every static t('key') and t(`prefix_${x}`) literal used in the touched UI files. */
function usedKeys(): Set<string> {
  const dirs = ['src/components', 'src/components/ui', 'src'];
  const files = dirs.flatMap((d) =>
    readdirSync(d).filter((f) => f.endsWith('.tsx')).map((f) => join(d, f))
  );
  const keys = new Set<string>();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([A-Za-z0-9_]+)'/g)) keys.add(m[1]!);
  }
  return keys;
}

describe('translations', () => {
  it('define every key used by the UI in all four languages', () => {
    const missing: string[] = [];
    for (const key of usedKeys()) {
      for (const lang of LANGS) {
        if (!TRANSLATIONS[lang]?.[key]) missing.push(`${lang}:${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('have the same keys in every language', () => {
    const en = Object.keys(TRANSLATIONS.en).sort();
    for (const lang of LANGS) {
      expect(Object.keys(TRANSLATIONS[lang]).sort(), lang).toEqual(en);
    }
  });

  it('keep the same {placeholders} as English', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const bad: string[] = [];
    for (const [key, en] of Object.entries(TRANSLATIONS.en)) {
      for (const lang of LANGS) {
        if (ph(TRANSLATIONS[lang][key] ?? '') !== ph(en)) bad.push(`${lang}:${key}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('fill placeholders, use singular forms and fall back safely', () => {
    const t = makeT('en');
    expect(t('bellAria', { n: 3 })).toContain('3');
    expect(t('definitely_not_a_key')).toBe('definitely_not_a_key');
    // A language with a gap falls back to English for that key only.
    const original = TRANSLATIONS.hi.notifTitle;
    delete (TRANSLATIONS.hi as Record<string, string>).notifTitle;
    try {
      expect(makeT('hi')('notifTitle')).toBe(TRANSLATIONS.en.notifTitle);
      expect(makeT('hi')('notifEmptyTitle')).toBe(TRANSLATIONS.hi.notifEmptyTitle);
    } finally {
      TRANSLATIONS.hi.notifTitle = original!;
    }
  });
});
