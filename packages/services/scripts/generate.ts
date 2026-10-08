/**
 * Splits `tarteaucitron.services.js` into one module per service:
 *
 *   src/services/<key>.ts  synchronous info (name, category, cookies, typed options) — SSR-safe
 *   src/impl/<key>.ts      original code, loaded only when needed
 *
 * The original code is copied as is, wrapped in `function (tarteaucitron, timeExpire)`:
 * references to `tarteaucitron.*` then target the shim passed as a parameter, with no global left.
 */
import { parse, type Expression, type Node, type ObjectExpression, type Property, type SpreadElement } from 'acorn';
import { simple } from 'acorn-walk';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = require.resolve('tarteaucitronjs/tarteaucitron.services.js');
const { version } = require('tarteaucitronjs/package.json') as { version: string };
const source = readFileSync(sourcePath, 'utf8');
const ast = parse(source, { ecmaVersion: 'latest' });

const RESERVED = new Set(
  'break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await'.split(' '),
);

const text = (node: Node) => source.slice(node.start, node.end);

/** Name of a property key or member: `a.b`, `a["b"]`, `{ b: … }`, `{ "b": … }`. */
function keyName(node: Node): string | undefined {
  if (node.type === 'Identifier') return (node as Node & { name: string }).name;
  if (node.type === 'Literal') {
    const value = (node as Node & { value: unknown }).value;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function prop(obj: ObjectExpression, name: string): Expression | undefined {
  const found = obj.properties.find(
    (p: Property | SpreadElement): p is Property => p.type === 'Property' && keyName(p.key) === name,
  );
  return found?.value as Expression | undefined;
}

const literal = (node: Expression | undefined) => (node?.type === 'Literal' ? node.value : undefined);

const isEmptyFunction = (node: Expression | undefined) =>
  node?.type === 'FunctionExpression' &&
  node.body.body.every((st) => st.type === 'ExpressionStatement' && 'directive' in st && Boolean(st.directive));

interface Entry {
  key: string;
  exportName: string;
  name: string;
  type: string;
  uri: string;
  needConsent: boolean;
  cookies: string; // TS code: array literal or function of `tarteaucitron`
  userKeys: string[];
  requiredKeys: string[];
  optionTypes: Record<string, string>;
  deps: string[];
  embed: boolean;
  hasFallback: boolean;
  preConsentRequests: boolean;
  embedClasses: string[];
  body: string;
}

const warnings: string[] = [];
const entries: Entry[] = [];

for (const node of ast.body) {
  // Every top-level statement is `tarteaucitron.services.<key> = { … }` (checked below).
  if (
    node.type !== 'ExpressionStatement' ||
    node.expression.type !== 'AssignmentExpression' ||
    node.expression.left.type !== 'MemberExpression' ||
    node.expression.right.type !== 'ObjectExpression'
  ) {
    throw new Error(`Unexpected statement in the catalog: ${text(node).slice(0, 80)}`);
  }
  const key = keyName(node.expression.left.property);
  if (!key) throw new Error(`Unreadable service key: ${text(node.expression.left)}`);
  const obj = node.expression.right;

  const userKeys = new Set<string>();
  const deps = new Set<string>();
  simple(obj, {
    MemberExpression(m) {
      const path = text(m.object);
      const name = keyName(m.property);
      if (path === 'tarteaucitron.user' && name) userKeys.add(name);
      if (path === 'tarteaucitron.services' && name && name !== key) deps.add(name);
    },
    Literal(l) {
      if (typeof l.value === 'string' && /tarteaucitron\.\w/.test(l.value)) {
        warnings.push(`${key}: string that references the tarteaucitron global → ${l.value.slice(0, 80)}`);
      }
    },
  });

  const body = text(obj);
  // `if (tarteaucitron.user.x === undefined) return;` → required option
  const requiredKeys = [...userKeys].filter((k) =>
    new RegExp(`if\\s*\\(\\s*tarteaucitron\\.user\\.${k}\\s*===?\\s*undefined\\s*\\)\\s*\\{?\\s*return\\b`).test(body),
  );

  // Type of each option, inferred from how the service code uses it.
  const optionTypes = Object.fromEntries(
    [...userKeys].map((k) => {
      const ref = `tarteaucitron\\.user\\.${k}`;
      if (new RegExp(`typeof\\s+${ref}\\s*===?\\s*['"]function`).test(body)) return [k, '() => void'];
      if (new RegExp(`${ref}(\\.(forEach|map|length|join)\\b|\\[)`).test(body)) return [k, 'string[]'];
      if (new RegExp(`${ref}\\s*===?\\s*(true|false)\\b`).test(body)) return [k, 'boolean'];
      return [k, 'unknown'];
    }),
  );

  const cookiesNode = prop(obj, 'cookies');
  let cookies = '[]';
  if (cookiesNode?.type === 'ArrayExpression' && cookiesNode.elements.every((e) => e?.type === 'Literal')) {
    cookies = JSON.stringify(cookiesNode.elements.map((e) => (e?.type === 'Literal' ? e.value : null)));
  } else if (cookiesNode) {
    cookies = `function (tarteaucitron) {\n  return (${text(cookiesNode)});\n}`;
  }

  const meta = Object.fromEntries(['key', 'name', 'type', 'uri', 'needConsent'].map((k) => [k, literal(prop(obj, k))]));
  for (const k of ['key', 'name', 'type']) if (typeof meta[k] !== 'string') warnings.push(`${key}: "${k}" not a literal`);
  if (meta.key !== key) warnings.push(`${key}: internal key differs ("${meta.key}")`);

  const jsNode = prop(obj, 'js');
  const fallbackNode = prop(obj, 'fallback');

  entries.push({
    key,
    exportName: RESERVED.has(key) || !/^[A-Za-z_$][\w$]*$/.test(key) ? `${key.replace(/\W/g, '_')}Service` : key,
    name: String(meta.name ?? key),
    type: String(meta.type ?? 'other'),
    uri: typeof meta.uri === 'string' ? meta.uri : '',
    needConsent: meta.needConsent !== false,
    cookies,
    userKeys: [...userKeys].sort(),
    requiredKeys,
    optionTypes,
    deps: [...deps].sort(),
    embed: jsNode ? /tarteaucitron\.fallback\(/.test(text(jsNode)) : false,
    hasFallback: Boolean(fallbackNode) && !isEmptyFunction(fallbackNode),
    // The fallback (run without consent) may contact a third party: cookieless mode,
    // advanced Consent Mode… Disabled by default in the engine.
    preConsentRequests: Boolean(fallbackNode) && /addScript|this\.js\(|\.src\s*=|makeAsync|new Image/.test(text(fallbackNode)),
    embedClasses: jsNode
      ? [...new Set([...text(jsNode).matchAll(/fallback\(\s*\[([^\]]*)\]/g)].flatMap((m) =>
          [...m[1]!.matchAll(/['"]([\w-]+)['"]/g)].map((c) => c[1]!),
        ))]
      : [],
    body,
  });
}

const keys = new Set(entries.map((e) => e.key));
for (const e of entries) for (const d of e.deps) if (!keys.has(d)) warnings.push(`${e.key}: unknown dependency "${d}"`);

const header = `// Generated by scripts/generate.ts from tarteaucitronjs@${version} — do not edit.
// Services code: https://github.com/AmauriC/tarteaucitron.js — MIT, Copyright (c) 2014 AmauriC.
`;

const out = join(root, 'src');
rmSync(join(out, 'services'), { recursive: true, force: true });
rmSync(join(out, 'impl'), { recursive: true, force: true });
mkdirSync(join(out, 'services'), { recursive: true });
mkdirSync(join(out, 'impl'), { recursive: true });

const pascal = (s: string) => s.replace(/(^|[^A-Za-z0-9])([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

for (const e of entries) {
  writeFileSync(
    join(out, 'impl', `${e.key}.ts`),
    // The body is untyped original JS (@ts-nocheck), but the exported signature is typed.
    `${header}// @ts-nocheck\n/* eslint-disable */\nimport type { TacRuntime, TacService } from '@zeste/core/tarteaucitron';\n\nexport default function (tarteaucitron: TacRuntime, timeExpire: number): TacService {\n  return ${e.body};\n}\n`,
  );

  const typeName = `${pascal(e.exportName)}Options`;
  const fields = e.userKeys.map((k) => `  ${k}${e.requiredKeys.includes(k) ? '' : '?'}: ${e.optionTypes[k]};`).join('\n');
  const hasRequired = e.requiredKeys.length > 0;
  const dynamicCookies = e.cookies.startsWith('function');
  const deps = e.deps.map((d) => `    ${JSON.stringify(d)}: () => import('../impl/${d}.ts'),`).join('\n');

  writeFileSync(
    join(out, 'services', `${e.key}.ts`),
    `${header}import { defineTacService } from '@zeste/core/tarteaucitron';
${dynamicCookies ? `import { ${e.exportName}Cookies } from '../cookies.ts';\n` : ''}
export interface ${typeName} {
${fields || '  [key: string]: never;'}
}

/**
 * ${e.name.replace(/\*\//g, '* /')}${e.uri ? `\n *\n * Privacy policy: ${e.uri}` : ''}
 */
export function ${e.exportName}(options${hasRequired ? '' : '?'}: ${typeName}) {
  return defineTacService(
    {
      key: ${JSON.stringify(e.key)},
      name: ${JSON.stringify(e.name)},
      type: ${JSON.stringify(e.type)},
      uri: ${JSON.stringify(e.uri)},
      needConsent: ${e.needConsent},
      cookies: ${dynamicCookies ? `${e.exportName}Cookies` : e.cookies},
      embed: ${e.embed},
      hasFallback: ${e.hasFallback},
      preConsentRequests: ${e.preConsentRequests},${e.embedClasses.length ? `\n      embedClasses: ${JSON.stringify(e.embedClasses)},` : ''}
      load: () => import('../impl/${e.key}.ts'),
      deps: {${deps ? `\n${deps}\n    ` : ''}},
    },
    options,
  );
}
`,
  );
}

writeFileSync(
  join(out, 'index.ts'),
  header + entries.map((e) => `export { ${e.exportName} } from './services/${e.key}.ts';`).join('\n') + '\n',
);

rmSync(join(out, 'catalog.json'), { force: true });
const catalog = entries.map(
  ({ key, exportName, name, type, uri, needConsent, userKeys, requiredKeys, optionTypes, deps, embed, hasFallback, preConsentRequests, embedClasses }) => ({
    key, exportName, name, type, uri, needConsent, userKeys, requiredKeys, optionTypes, deps, embed, hasFallback, preConsentRequests, embedClasses,
  }),
);
writeFileSync(
  join(out, 'catalog.ts'),
  `${header}
/** Description of a catalog service (tooling, documentation, tests). */
export interface CatalogEntry {
  key: string;
  /** Name of the function exported by \`@zeste/services\`. */
  exportName: string;
  name: string;
  /** tarteaucitron category: \`analytic\`, \`ads\`, \`video\`… */
  type: string;
  uri: string;
  needConsent: boolean;
  userKeys: string[];
  requiredKeys: string[];
  /** TypeScript type of each option, inferred from the service code. */
  optionTypes: Record<string, string>;
  deps: string[];
  embed: boolean;
  hasFallback: boolean;
  preConsentRequests: boolean;
  embedClasses: string[];
}

export const catalog: CatalogEntry[] = ${JSON.stringify(catalog, null, 2)};
`,
);

// UI messages, taken from the tarteaucitron language files: one complete module per language,
// with keys missing from a language filled in from English.
interface CategoryLabel {
  title: string;
  details: string;
}
type LangFile = Record<string, string | CategoryLabel>;

const langDir = join(dirname(sourcePath), 'lang');
const readLang = (file: string): LangFile => {
  const sandbox: { tarteaucitron: { lang?: LangFile } } = { tarteaucitron: {} };
  runInNewContext(readFileSync(join(langDir, file), 'utf8'), sandbox);
  if (!sandbox.tarteaucitron.lang) throw new Error(`${file}: no translation found`);
  return sandbox.tarteaucitron.lang;
};
const isLabel = (v: string | CategoryLabel | undefined): v is CategoryLabel => typeof v === 'object' && v !== null;

const english = readLang('tarteaucitron.en.js');
const stringKeys = Object.keys(english).filter((k) => typeof english[k] === 'string').sort();
const categoryKeys = Object.keys(english).filter((k) => isLabel(english[k])).sort();

rmSync(join(out, 'i18n'), { recursive: true, force: true });
mkdirSync(join(out, 'i18n'), { recursive: true });
writeFileSync(
  join(out, 'i18n', 'types.ts'),
  `${header}
export interface CategoryLabel {
  title: string;
  details: string;
}

/** tarteaucitron UI texts. */
export interface Messages {
${stringKeys.map((k) => `  ${JSON.stringify(k)}: string;`).join('\n')}
  /** Title and description of each service category. */
  categories: Partial<Record<string, CategoryLabel>>;
}
`,
);

const languages: string[] = [];
const incomplete: string[] = [];
for (const file of readdirSync(langDir).filter((f) => /^tarteaucitron\.\w+\.js$/.test(f))) {
  const lang = file.split('.')[1]!;
  const strings = readLang(file);
  const missing = stringKeys.filter((k) => typeof strings[k] !== 'string');
  if (missing.length) incomplete.push(`${lang} (${missing.length})`);
  const messages = {
    ...Object.fromEntries(stringKeys.map((k) => [k, typeof strings[k] === 'string' ? strings[k] : english[k]])),
    categories: Object.fromEntries(
      categoryKeys.map((k) => {
        const label = isLabel(strings[k]) ? strings[k] : english[k];
        return [k, label];
      }),
    ),
  };
  languages.push(lang);
  writeFileSync(
    join(out, 'i18n', `${lang}.ts`),
    `${header}import type { Messages } from './types.ts';

export const messages: Messages = ${JSON.stringify(messages, null, 2)};

/** Shortcut to \`messages.categories\`. */
export const categories = messages.categories;
`,
  );
}

const dynamic = entries.filter((e) => e.cookies.startsWith('function'));
// Untyped original code: isolated in a file without type checking.
writeFileSync(
  join(out, 'cookies.ts'),
  `${header}// Cookie lists that depend on the service configuration (original code, not type-checked).\n` +
    `// @ts-nocheck\n/* eslint-disable */\n` +
    `type CookieList = (tarteaucitron: { user: Record<string, unknown> }) => string[];\n\n` +
    dynamic.map((e) => `export const ${e.exportName}Cookies: CookieList = ${e.cookies};\n`).join('\n'),
);
console.log(`${entries.length} services generated from tarteaucitronjs@${version}`);
console.log(`  embeds: ${entries.filter((e) => e.embed).length}, with fallback: ${entries.filter((e) => e.hasFallback).length}`);
console.log(`  dynamic cookies: ${dynamic.map((e) => e.key).join(', ') || 'none'}`);
console.log(`  dependencies: ${entries.filter((e) => e.deps.length).map((e) => `${e.key} → ${e.deps.join(',')}`).join(' ; ') || 'none'}`);
console.log(`  possible third-party requests before consent (opt-in): ${entries.filter((e) => e.preConsentRequests).map((e) => e.key).join(', ')}`);
console.log(`  messages: ${languages.length} languages${incomplete.length ? ` (completed with English: ${incomplete.join(', ')})` : ''}`);
console.log(`  required options: ${entries.filter((e) => e.requiredKeys.length).length} services`);
if (warnings.length) console.log(`\n⚠️  ${warnings.length} warnings:\n  ${warnings.join('\n  ')}`);
