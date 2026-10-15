import { describe, expect, it } from 'vitest';
import { regionalLanguage } from './region';

describe('regionalLanguage', () => {
  it.each([
    ['Europe/Istanbul', ['en-US'], 'tr'],
    ['Europe/Paris', ['en-GB'], 'fr'],
    ['Europe/Berlin', ['en'], 'de'],
    ['Europe/Vienna', [], 'de'],
    ['Europe/Madrid', ['ca-ES'], 'es'],
    ['America/Mexico_City', ['en-US'], 'es'],
    ['America/Argentina/Buenos_Aires', [], 'es'],
    ['Europe/Helsinki', ['sv-FI'], 'fi'],
    ['Europe/Rome', [], 'it'],
    ['Europe/Amsterdam', [], 'nl'],
    ['America/Sao_Paulo', ['en'], 'pt-BR'],
    ['Europe/Lisbon', [], 'pt-BR'],
  ])('maps %s to %s', (timeZone, languages, expected) => {
    expect(regionalLanguage(timeZone, languages)).toBe(expected);
  });

  it.each([
    ['Europe/Brussels', ['fr-BE', 'en'], 'fr'],
    ['Europe/Brussels', ['nl-BE'], 'nl'],
    ['Europe/Brussels', ['en'], 'nl'],
    ['Europe/Zurich', ['fr-CH'], 'fr'],
    ['Europe/Zurich', ['it-CH'], 'it'],
    ['Europe/Zurich', ['en'], 'de'],
  ])('picks the browser language in multilingual %s', (timeZone, languages, expected) => {
    expect(regionalLanguage(timeZone, languages)).toBe(expected);
  });

  it.each([
    ['America/New_York', ['es-US']],
    ['Europe/London', ['fr-FR']],
    ['Asia/Tokyo', ['ja']],
    ['UTC', []],
  ])('has no regional language for %s', (timeZone, languages) => {
    expect(regionalLanguage(timeZone, languages)).toBeUndefined();
  });
});
