import { describe, expect, it } from 'vitest';
import { acceptedLanguages, languages, loadMessages, pickLanguage } from '../src/i18n/index.ts';

describe('language', () => {
  it('picks the first supported tag, by primary subtag', () => {
    expect(pickLanguage(['fr-CA', 'en'])).toBe('fr');
    expect(pickLanguage(['xx', 'de-AT'])).toBe('de');
    expect(pickLanguage(['nb-NO'])).toBe('no');
    expect(pickLanguage(['', null, undefined, 'tlh'])).toBe('en');
    expect(pickLanguage(['tlh'], 'fr')).toBe('fr');
  });

  it('reads an Accept-Language header by preference', () => {
    expect(acceptedLanguages('en;q=0.8, fr-CH, fr;q=0.9, *;q=0.1, de;q=0')).toEqual(['fr-CH', 'fr', 'en']);
    expect(acceptedLanguages(undefined)).toEqual([]);
    expect(pickLanguage(acceptedLanguages('es-MX,es;q=0.9'))).toBe('es');
  });

  it('loads every language on demand', async () => {
    expect(languages).toHaveLength(36);
    expect((await loadMessages('fr')).acceptAll).toBe('Tout accepter');
    expect((await loadMessages('de')).denyAll).toBeTruthy();
  });
});
