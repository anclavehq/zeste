import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { catalog, type CatalogEntry } from '@zeste/services/catalog';
import { sourceRoot } from './add.ts';

/** A place in the project: `src/app.html:12`. */
export interface Location {
  file: string;
  line: number;
}

export interface DetectedService {
  key: string;
  /** Name of the `@zeste/services` function. */
  exportName: string;
  name: string;
  /** Options found in the project (`tarteaucitron.user.*`, ids in the snippets). */
  options: Record<string, string | number | boolean>;
  /** Required options that were not found: to fill in by hand. */
  missing: string[];
  /** Options that hold code (`gtagMore`…): to copy by hand. */
  code: string[];
  found: Location[];
}

export interface Finding extends Location {
  /** What to do there. */
  message: string;
}

export interface InitOptions {
  cwd: string;
  /** Output file, relative to `cwd` (default: `lib/consent.ts` in the source folder). */
  out?: string;
  force?: boolean;
  /** Only report, write nothing. */
  dryRun?: boolean;
  /**
   * `module`: a TypeScript module for the npm packages; `script`: a `window.zesteConfig` file for the
   * `<script>` version. By default, `module` when the project has a package.json.
   */
  format?: 'module' | 'script';
}

export interface InitResult {
  services: DetectedService[];
  /** Scripts and tarteaucitron calls to remove: zeste loads the services itself, after consent. */
  remove: Finding[];
  /** Embeds (videos, maps) to put behind `<ConsentGate>`. */
  embeds: Finding[];
  /** `tarteaucitron.job` entries that are not in the catalog (custom services). */
  unknown: Finding[];
  /** Name of the tarteaucitron cookie, when it is not the default one. */
  cookieName?: string;
  /** Domain of the tarteaucitron cookie, when it is shared across subdomains. */
  cookieDomain?: string;
  /** tarteaucitron had Google Consent Mode enabled. */
  googleConsentMode: boolean;
  file: string;
  source: string;
  written: boolean;
}

const SCANNED = new Set([
  '.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.mts', '.jsx', '.tsx', '.svelte', '.vue', '.astro',
  '.php', '.twig', '.liquid', '.njk', '.hbs', '.ejs', '.erb', '.jinja', '.j2',
]);
const SKIPPED = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output', '.svelte-kit', '.vercel', '.netlify',
  'coverage', 'vendor', '.turbo', '.cache', 'test-results', 'playwright-report',
]);
const MAX_SIZE = 1_000_000;

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED.has(entry.name) && !entry.name.startsWith('.')) yield* files(path);
    } else if (SCANNED.has(extname(entry.name)) && !entry.name.endsWith('.min.js') && statSync(path).size <= MAX_SIZE) {
      yield path;
    }
  }
}

/**
 * Well-known snippets pasted as is in a page. Hand-written and deliberately short: `zeste init` reads
 * what the project declares; it does not try to recognize every third party.
 */
interface SnippetRule {
  key: string;
  /** The snippet itself: its line is reported. */
  pattern: RegExp;
  /** Ids to read anywhere in the same file. */
  options?: Record<string, RegExp>;
  /** `script`: remove it (zeste loads it after consent); `embed`: put it behind <ConsentGate>. */
  kind: 'script' | 'embed';
}

const GA4_ID = /(?:gtag\/js\?id=|gtag\(\s*['"]config['"]\s*,\s*['"])((?:G|UA)-[\w-]+)/;
const SNIPPETS: SnippetRule[] = [
  { key: 'gtag', kind: 'script', pattern: /googletagmanager\.com\/gtag\/js\?id=(?:G|UA)-/, options: { gtagUa: GA4_ID } },
  {
    key: 'googleads',
    kind: 'script',
    pattern: /googletagmanager\.com\/gtag\/js\?id=AW-/,
    options: { googleadsId: /(?:gtag\/js\?id=|['"]config['"]\s*,\s*['"])(AW-[\w-]+)/ },
  },
  {
    key: 'googletagmanager',
    kind: 'script',
    pattern: /googletagmanager\.com\/gtm\.js/,
    options: { googletagmanagerId: /['"](GTM-[A-Z0-9]+)['"]/ },
  },
  {
    key: 'matomocloud',
    kind: 'script',
    pattern: /_paq\.push\(\s*\[\s*['"]setSiteId['"][\s\S]{0,400}?\.matomo\.cloud|\.matomo\.cloud[\s\S]{0,400}?setSiteId/,
    options: {
      matomoId: /['"]setSiteId['"]\s*,\s*['"]?(\d+)/,
      matomoHost: /['"](https:\/\/[\w.-]+\.matomo\.cloud\/)/,
    },
  },
  {
    key: 'matomo',
    kind: 'script',
    pattern: /_paq\.push\(\s*\[\s*['"]setSiteId['"]/,
    options: {
      matomoId: /['"]setSiteId['"]\s*,\s*['"]?(\d+)/,
      matomoHost: /(?:\bu\s*=\s*|['"]setTrackerUrl['"]\s*,\s*)['"]((?:https?:)?\/\/[^'"]+?\/)(?:matomo\.php)?['"]/,
    },
  },
  { key: 'hotjar', kind: 'script', pattern: /static\.hotjar\.com/, options: { hotjarId: /\bhjid\s*:\s*(\d+)/ } },
  {
    key: 'facebookpixel',
    kind: 'script',
    pattern: /connect\.facebook\.net\/[\w_]+\/fbevents\.js|fbq\(\s*['"]init['"]/,
    options: { facebookpixelId: /fbq\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/ },
  },
  {
    key: 'clarity',
    kind: 'script',
    pattern: /clarity\.ms\/tag\//,
    options: { clarity: /['"]clarity['"]\s*,\s*['"]script['"]\s*,\s*['"](\w+)['"]/ },
  },
  {
    key: 'googlemaps',
    kind: 'script',
    pattern: /maps\.googleapis\.com\/maps\/api\/js/,
    options: { googlemapsKey: /maps\/api\/js\?[^'"\s]*?key=([\w-]+)/ },
  },
  { key: 'youtube', kind: 'embed', pattern: /youtube(?:-nocookie)?\.com\/embed\// },
  { key: 'vimeo', kind: 'embed', pattern: /player\.vimeo\.com\/video\// },
  { key: 'googlemapsembed', kind: 'embed', pattern: /google\.com\/maps\/embed/ },
];

const JOB = /tarteaucitron\.job[^;\n]*?\.push\(\s*['"]([\w-]+)['"]\s*\)/g;
const USER = /tarteaucitron\.user\.(\w+)\s*=\s*([^;\n]+)/g;
const COOKIE_NAME = /['"]?cookieName['"]?\s*:\s*['"]([^'"]+)['"]/g;
const COOKIE_DOMAIN = /['"]?cookieDomain['"]?\s*:\s*['"]([^'"]+)['"]/g;
const CONSENT_MODE = /['"]?googleConsentMode['"]?\s*:\s*true/g;
const TAC_SCRIPT = /<script[^>]+tarteaucitron(?:\.min)?\.js|tarteaucitron\.init\(/;

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/** The match sits on a commented-out line (`// "cookieDomain": …`, `<!-- <script … -->`). */
function commented(text: string, index: number): boolean {
  const start = text.lastIndexOf('\n', index - 1) + 1;
  const before = text.slice(start, index).trim();
  if (/^(\/\/|\*|\/\*|<!--)/.test(before)) return true;
  // Inside a block comment or an HTML comment that is still open at this point
  const lastOpen = Math.max(text.lastIndexOf('/*', index), text.lastIndexOf('<!--', index));
  const lastClose = Math.max(text.lastIndexOf('*/', index), text.lastIndexOf('-->', index));
  return lastOpen > lastClose;
}

/** Matches of a global pattern that are not commented out. */
const live = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].filter((m) => !commented(text, m.index));

/** A JS literal from tarteaucitron.user: a string, a number or a boolean; anything else is code. */
function literal(raw: string): string | number | boolean | undefined {
  const value = raw.trim().replace(/,$/, '');
  const string = /^(['"`])(.*)\1$/.exec(value);
  if (string) return string[2];
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === 'true' || value === 'false') return value === 'true';
  return undefined;
}

export function detect(cwd: string, ignore?: string): Omit<InitResult, 'file' | 'source' | 'written'> {
  const byKey = new Map(catalog.map((e) => [e.key, e]));
  const embedClasses = catalog.flatMap((e) => e.embedClasses.map((c) => [c, e.key] as const));
  const found = new Map<string, { found: Location[]; options: Record<string, string | number | boolean>; code: Set<string> }>();
  const users: Array<{ key: string; value: string | number | boolean | undefined }> = [];
  const remove: Finding[] = [];
  const embeds: Finding[] = [];
  const unknown: Finding[] = [];
  let cookieName: string | undefined;
  let cookieDomain: string | undefined;
  let googleConsentMode = false;

  const use = (key: string, at: Location) => {
    const entry = found.get(key) ?? { found: [], options: {}, code: new Set<string>() };
    if (!entry.found.some((l) => l.file === at.file && l.line === at.line)) entry.found.push(at);
    found.set(key, entry);
    return entry;
  };

  for (const path of files(cwd)) {
    const file = relative(cwd, path);
    if (file === ignore) continue;
    const text = readFileSync(path, 'utf8');

    if (text.includes('tarteaucitron')) {
      for (const match of live(text, JOB)) {
        const at = { file, line: lineOf(text, match.index) };
        if (byKey.has(match[1]!)) use(match[1]!, at);
        else unknown.push({ ...at, message: `"${match[1]}" is not in the catalog: declare it with defineService()` });
      }
      for (const match of live(text, USER)) users.push({ key: match[1]!, value: literal(match[2]!) });
      const name = live(text, COOKIE_NAME)[0]?.[1];
      if (name && name !== 'tarteaucitron') cookieName = name;
      cookieDomain ??= live(text, COOKIE_DOMAIN)[0]?.[1];
      googleConsentMode ||= live(text, CONSENT_MODE).length > 0;
      const script = live(text, new RegExp(TAC_SCRIPT, 'g'))[0];
      if (script) {
        remove.push({ file, line: lineOf(text, script.index), message: 'tarteaucitron: remove it, zeste replaces it' });
      }
    }

    // Already wrapped tarteaucitron markup (`<div class="youtube_player">`) keeps working with zeste.
    for (const [className, key] of embedClasses) {
      const match = live(text, new RegExp(`class(?:Name)?=["'][^"']*\\b${className}\\b`, 'g'))[0];
      if (match) use(key, { file, line: lineOf(text, match.index) });
    }

    for (const rule of SNIPPETS) {
      const match = live(text, new RegExp(rule.pattern, 'g'))[0];
      if (!match) continue;
      // Matomo Cloud is a Matomo snippet: report the most specific one only.
      if (rule.key === 'matomo' && found.get('matomocloud')?.found.some((l) => l.file === file)) continue;
      const at = { file, line: lineOf(text, match.index) };
      const entry = use(rule.key, at);
      for (const [option, pattern] of Object.entries(rule.options ?? {})) {
        const value = pattern.exec(text)?.[1];
        if (value !== undefined) entry.options[option] ??= value;
      }
      const name = byKey.get(rule.key)?.name ?? rule.key;
      if (rule.kind === 'script') remove.push({ ...at, message: `${name}: remove this snippet, zeste loads it after consent` });
      else embeds.push({ ...at, message: `${name}: put this embed behind <ConsentGate service="${rule.key}">` });
    }
  }

  // tarteaucitron.user options are global: each one goes to the services that know it.
  for (const [key, entry] of found) {
    const service = byKey.get(key)!;
    for (const { key: option, value } of users) {
      if (!service.userKeys.includes(option)) continue;
      if (value === undefined) entry.code.add(option);
      else entry.options[option] = value;
    }
  }

  const services = [...found]
    .map(([key, entry]): DetectedService => {
      const service = byKey.get(key) as CatalogEntry;
      return {
        key,
        exportName: service.exportName,
        name: service.name,
        options: entry.options,
        missing: service.requiredKeys.filter((k) => !(k in entry.options) && !entry.code.has(k)),
        code: [...entry.code],
        found: entry.found,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  return { services, remove, embeds, unknown, cookieName, cookieDomain, googleConsentMode };
}

const quote = (value: string | number | boolean) =>
  typeof value === 'string' ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : String(value);

export function render(services: DetectedService[]): string {
  const imports = services.map((s) => s.exportName).sort();
  const calls = services.map((s) => {
    const options = [
      ...Object.entries(s.options).map(([k, v]) => `${k}: ${quote(v)}`),
      ...s.missing.map((k) => `${k}: 'TODO' /* required: not found in the project */`),
    ];
    const todo = s.code.map((k) => ` /* TODO: copy your tarteaucitron.user.${k} function as ${k} */`).join('');
    return `  ${s.exportName}(${options.length ? `{ ${options.join(', ')} }` : ''})${todo ? `,${todo}` : ','}`;
  });
  return `${imports.length ? `import { ${imports.join(', ')} } from '@zeste/services';\n\n` : ''}/**
 * The site's services, detected by \`zeste init\`: check them, then pass them to createZeste().
 * A function: the list is recreated for every request on the server.
 */
export const services = () => [
${calls.join('\n')}
];
`;
}

/** `window.zesteConfig` for the `<script>` version (@zeste/browser). */
export function renderScript(detection: Omit<InitResult, 'file' | 'source' | 'written'>): string {
  const entries = detection.services.map((s) => {
    const options = [
      ...Object.entries(s.options).map(([k, v]) => `${k}: ${quote(v)}`),
      ...s.missing.map((k) => `${k}: 'TODO' /* required: not found in the project */`),
    ];
    const todo = s.code.map((k) => ` /* TODO: copy your tarteaucitron.user.${k} function as ${k} */`).join('');
    return `    ${/^[a-z_$][\w$]*$/i.test(s.key) ? s.key : quote(s.key)}: { ${options.join(', ')} },${todo}`.replace('{  }', '{}');
  });
  const extra = [
    detection.cookieName && `  cookieName: ${quote(detection.cookieName)},`,
    detection.cookieDomain && `  cookieDomain: ${quote(detection.cookieDomain)},`,
  ].filter(Boolean);
  return `// The site's services, detected by \`zeste init\`: check them, then load this file before zeste.js:
// <script src="/zeste.config.js"></script> <script src="/zeste/zeste.js"></script>
window.zesteConfig = {
  services: {
${entries.join('\n')}
  },
${extra.length ? `${extra.join('\n')}\n` : ''}};
`;
}

export function init(options: InitOptions): InitResult {
  const { cwd, force = false, dryRun = false } = options;
  const format = options.format ?? (existsSync(join(cwd, 'package.json')) ? 'module' : 'script');
  const file = options.out ?? (format === 'script' ? 'zeste.config.js' : join(sourceRoot(cwd), 'lib', 'consent.ts'));
  const detection = detect(cwd, file);
  const source = format === 'script' ? renderScript(detection) : render(detection.services);
  const target = join(cwd, file);
  const written = !dryRun && (force || !existsSync(target));
  if (written) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, source);
  }
  return { ...detection, file, source, written };
}
