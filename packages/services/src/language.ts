import { languages, type Language } from './i18n/index.ts';

/** Browser tags whose primary subtag differs from the tarteaucitron code. */
const aliases: Record<string, Language> = { nb: 'no', nn: 'no' };

/**
 * First supported language among BCP 47 tags in order of preference (`fr-CA`, `de`, `en-US`…),
 * `fallback` (English by default) otherwise.
 */
export function pickLanguage(tags: Iterable<string | null | undefined>, fallback: Language = 'en'): Language {
  for (const tag of tags) {
    const primary = tag?.trim().toLowerCase().split(/[-_]/)[0];
    if (!primary) continue;
    const code = aliases[primary] ?? primary;
    if ((languages as readonly string[]).includes(code)) return code as Language;
  }
  return fallback;
}

/** Tags of an `Accept-Language` header, most preferred first: `fr-CH, fr;q=0.9, en;q=0.8` → `['fr-CH', 'fr', 'en']`. */
export function acceptedLanguages(header: string | null | undefined): string[] {
  return (header ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((entry) => entry.tag);
}

/**
 * In the browser, like tarteaucitron: the page language (`<html lang>`), then the browser languages.
 * On the server, pass the page language and `acceptedLanguages(request header)` to `pickLanguage` instead.
 */
export function detectLanguage(fallback: Language = 'en'): Language {
  if (typeof document === 'undefined') return fallback;
  const browser = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  return pickLanguage([document.documentElement.lang, ...browser], fallback);
}
