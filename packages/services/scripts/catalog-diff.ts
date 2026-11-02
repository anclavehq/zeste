/**
 * Markdown summary of what changed between two generated catalogs, for the update pull request.
 *
 *   node scripts/catalog-diff.ts <previous catalog.ts>
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CatalogEntry } from '../src/catalog.ts';

const load = async (path: string) =>
  ((await import(pathToFileURL(resolve(path)).href)) as { catalog: CatalogEntry[] }).catalog;

const before = new Map((await load(process.argv[2])).map((e) => [e.key, e]));
const after = new Map((await load(new URL('../src/catalog.ts', import.meta.url).pathname)).map((e) => [e.key, e]));

const label = (e: CatalogEntry) => `\`${e.key}\` (${e.name}, ${e.type})`;
const added = [...after.values()].filter((e) => !before.has(e.key));
const removed = [...before.values()].filter((e) => !after.has(e.key));
const changed: string[] = [];

for (const [key, next] of after) {
  const prev = before.get(key);
  if (!prev) continue;
  const fields = (Object.keys(next) as (keyof CatalogEntry)[])
    .filter((f) => JSON.stringify(prev[f]) !== JSON.stringify(next[f]))
    .map((f) => `${f}: \`${JSON.stringify(prev[f])}\` → \`${JSON.stringify(next[f])}\``);
  if (fields.length) changed.push(`- \`${key}\`: ${fields.join(', ')}`);
}

const isConsent = (line: string) => line.includes('needConsent') || line.includes('preConsentRequests');
const consent = changed.filter(isConsent);
const other = changed.filter((line) => !isConsent(line));
const lines: string[] = [];
if (consent.length) lines.push('### Consent behaviour changes', '', ...consent, '');
if (added.length) lines.push('### Added', '', ...added.map((e) => `- ${label(e)}`), '');
if (removed.length) lines.push('### Removed', '', ...removed.map((e) => `- ${label(e)}`), '');
if (other.length) lines.push('### Changed metadata', '', ...other, '');
console.log(lines.length ? lines.join('\n') : 'No catalog metadata changes.');
