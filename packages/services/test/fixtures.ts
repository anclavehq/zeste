/**
 * Dummy config and expected HTML elements for each service, inferred from its code.
 * Shared by the unit tests (happy-dom) and the browser tests (Playwright).
 */
import type { ServiceDefinition } from '@zeste/core';
import type { CatalogEntry } from '../src/catalog.ts';

export type ServiceFactory = (options: Record<string, unknown>) => ServiceDefinition;

/** Finds a service's function by its export name (e.g. `youtube`) in a module. */
export function factoryOf(mod: object, exportName: string): ServiceFactory {
  const fn: unknown = Reflect.get(mod, exportName);
  if (typeof fn !== 'function') throw new Error(`export "${exportName}" not found`);
  return fn as ServiceFactory;
}

// Google Consent Mode switches: no effect of their own, they are driven by the googleConsentMode() plugin.
export const CONSENT_MODE_SWITCHES = new Set([
  'gcmanalyticsstorage', 'gcmadstorage', 'gcmadsuserdata', 'gcmpersonalization', 'gcmfunctionality', 'gcmsecurity',
]);

function optionValue(key: string, type: string): unknown {
  if (type === 'string[]') return ['TEST123'];
  if (type === 'boolean') return true;
  if (/url|path|src/i.test(key)) return 'https://example.com/x.js';
  if (/host/i.test(key)) return 'https://example.com/';
  return 'TEST123';
}

export function fixtureOptions(entry: CatalogEntry): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entry.optionTypes)
      // no callbacks, nor "already loaded" flags that would short-circuit the service
      .filter(([k, type]) => type !== '() => void' && !/AlreadyLoaded$/.test(k))
      .map(([k, type]) => [k, optionValue(k, type)]),
  );
}

function attrValue(attr: string): string {
  if (/^(width|height)$/i.test(attr)) return '300';
  if (/url|src|href|link/i.test(attr)) return 'https://example.com/embed';
  return 'TEST123';
}

/** HTML of the elements the service targets (`.youtube_player`, …), derived from its source code. */
export function fixtureHtml(source: string): string {
  const classes = [
    ...[...source.matchAll(/fallback\(\s*\[([^\]]*)\]/g)].flatMap((m) =>
      [...m[1]!.matchAll(/['"]([\w-]+)['"]/g)].map((c) => c[1]!),
    ),
    // class passed through a variable, e.g. `var IDENTIFIER = "aduptech_conversion"`
    ...[...source.matchAll(/IDENTIFIER\s*=\s*['"]([\w-]+)['"]/g)].map((m) => m[1]!),
  ];
  const attrs = new Set([...source.matchAll(/getElemAttr\(\s*\w+\s*,\s*['"]([\w-]+)['"]/g)].map((m) => m[1]!));
  return [...new Set(classes)]
    .map((cls) => `<div class="${cls}" ${[...attrs].map((a) => `${a}="${attrValue(a)}"`).join(' ')}></div>`)
    .join('');
}
