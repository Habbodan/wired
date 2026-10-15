import { describe, expect, it, vi } from 'vitest';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fi } from './fi';
import { fr } from './fr';
import { it as italian } from './it';
import { nl } from './nl';
import { ptBR } from './pt-BR';
import { tr } from './tr';

vi.mock('@/lib/storage', () => ({ readString: () => null, writeString: () => undefined }));

type Tree = { [key: string]: string | Tree };

function placeholders(tree: Tree, prefix = ''): Record<string, string[]> {
  return Object.entries(tree).reduce<Record<string, string[]>>((all, [key, value]) => {
    const path = `${prefix}${key}`;
    if (typeof value === 'string') {
      all[path] = [...value.matchAll(/{{\s*(\w+)/g)].map((match) => match[1] ?? '').sort();
      return all;
    }
    return { ...all, ...placeholders(value, `${path}.`) };
  }, {});
}

const locales = { tr, de, es, fi, fr, it: italian, nl, 'pt-BR': ptBR };

describe('translations', () => {
  const reference = placeholders(en);

  it.each(Object.entries(locales))('%s keeps every placeholder from English', (_code, messages) => {
    expect(placeholders(messages)).toEqual(reference);
  });

  it.each(Object.entries(locales))('%s has no empty strings', (_code, messages) => {
    const empty = Object.entries(placeholders(messages)).filter(([path]) => {
      const value = path.split('.').reduce<unknown>((node, key) => (node as Tree)[key], messages);
      return typeof value === 'string' && value.trim() === '';
    });
    expect(empty).toEqual([]);
  });
});

describe('detectLanguage', () => {
  it.each([
    ['Europe/Istanbul', ['en-US'], 'tr'],
    ['Europe/Paris', ['en-US'], 'fr'],
    ['America/Sao_Paulo', ['en-US'], 'pt-BR'],
    ['Europe/Berlin', ['tr-TR'], 'de'],
    ['America/New_York', ['tr-TR'], 'en'],
    ['Asia/Tokyo', ['ja-JP'], 'en'],
  ])('opens %s visitors in their hotel language (%j)', async (timeZone, languages, expected) => {
    vi.resetModules();
    vi.stubGlobal('document', { documentElement: { lang: '' } });
    vi.stubGlobal('navigator', { languages });
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone,
    } as Intl.ResolvedDateTimeFormatOptions);

    const { detectLanguage } = await import('./index');
    expect(detectLanguage()).toBe(expected);
  });
});
