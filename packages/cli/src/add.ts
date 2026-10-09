import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FRAMEWORKS = ['svelte', 'react', 'vue'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

/** UI libraries supported by each framework. */
export const UIS = {
  svelte: ['bits', 'ark', 'shadcn'],
  react: ['radix', 'ark', 'shadcn'],
  vue: ['reka', 'ark', 'shadcn'],
} as const satisfies Record<Framework, readonly string[]>;
export type Ui = (typeof UIS)[Framework][number];

/** `zeste`: understated, lemon accent (default). `pelure`: flat banner, thick outlines. */
export const STYLES = ['zeste', 'pelure'] as const;
export type Style = (typeof STYLES)[number];

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');

interface FrameworkSetup {
  files: string[];
  /** Source folder, where `@/` points: `src/`, Nuxt's `app/`, or the project root. */
  root: (cwd: string) => string;
  dir: (root: string) => string;
  /** Packages each UI library needs, besides the zeste ones. */
  uiPackages: Partial<Record<Ui, string>>;
  /** Detection order after components.json (shadcn). */
  detect: Array<[pkg: string, ui: Ui]>;
  defaultUiAlias: string;
  /** Where a shadcn component lives, relative to the `ui` alias folder. */
  shadcnFile: (component: string) => string;
  shadcnCli: string;
}

const SETUP: Record<Framework, FrameworkSetup> = {
  svelte: {
    files: ['CookieBanner.svelte', 'CookiePreferences.svelte', 'CookiePlaceholder.svelte', 'index.ts'],
    root: () => 'src',
    dir: () => 'src/lib/components/zeste',
    uiPackages: { bits: 'bits-ui', ark: '@ark-ui/svelte' },
    detect: [
      ['@ark-ui/svelte', 'ark'],
      ['bits-ui', 'bits'],
    ],
    defaultUiAlias: '$lib/components/ui',
    shadcnFile: (component) => component,
    shadcnCli: 'shadcn-svelte@latest',
  },
  react: {
    files: ['CookieBanner.tsx', 'CookiePreferences.tsx', 'CookiePlaceholder.tsx', 'index.ts'],
    // Next.js and Vite projects keep their code in src/ when it exists, at the root otherwise.
    root: (cwd) => (existsSync(join(cwd, 'src')) ? 'src' : ''),
    dir: (root) => join(root, 'components/zeste'),
    uiPackages: { radix: 'radix-ui', ark: '@ark-ui/react' },
    detect: [
      ['@ark-ui/react', 'ark'],
      ['radix-ui', 'radix'],
      ['@radix-ui/react-dialog', 'radix'],
    ],
    defaultUiAlias: '@/components/ui',
    shadcnFile: (component) => `${component}.tsx`,
    shadcnCli: 'shadcn@latest',
  },
  vue: {
    files: ['CookieBanner.vue', 'CookiePreferences.vue', 'CookiePlaceholder.vue', 'index.ts'],
    // Nuxt 4 keeps its code in app/, Vite projects in src/.
    root: (cwd) => (existsSync(join(cwd, 'app')) && dependencies(cwd).has('nuxt') ? 'app' : existsSync(join(cwd, 'src')) ? 'src' : ''),
    dir: (root) => join(root, 'components/zeste'),
    uiPackages: { reka: 'reka-ui', ark: '@ark-ui/vue' },
    detect: [
      ['@ark-ui/vue', 'ark'],
      ['reka-ui', 'reka'],
    ],
    defaultUiAlias: '@/components/ui',
    shadcnFile: (component) => component,
    shadcnCli: 'shadcn-vue@latest',
  },
};

/** Skin colors: only without shadcn (shadcn follows the project theme). */
const THEME = 'theme.css';
/** shadcn components used by the generated files. */
export const SHADCN_COMPONENTS = ['button', 'dialog', 'switch', 'label'];

export interface AddOptions {
  cwd: string;
  framework?: Framework;
  ui?: Ui;
  style?: Style;
  dir?: string;
  force?: boolean;
}

export interface AddResult {
  framework: Framework;
  ui: Ui;
  style: Style;
  dir: string;
  written: string[];
  skipped: string[];
  warnings: string[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ShadcnConfig {
  aliases?: { ui?: string };
}

const readJson = <T>(path: string): T | undefined =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : undefined;

function dependencies(cwd: string): Set<string> {
  const pkg = readJson<PackageJson>(join(cwd, 'package.json'));
  return new Set([...Object.keys(pkg?.dependencies ?? {}), ...Object.keys(pkg?.devDependencies ?? {})]);
}

/** Guesses the project's framework: the zeste binding first, then the framework itself. */
export function detectFramework(cwd: string): Framework | undefined {
  const deps = dependencies(cwd);
  if (deps.has('@zeste/svelte')) return 'svelte';
  if (deps.has('@zeste/react')) return 'react';
  if (deps.has('@zeste/vue')) return 'vue';
  if (deps.has('svelte')) return 'svelte';
  if (deps.has('react')) return 'react';
  if (deps.has('vue') || deps.has('nuxt')) return 'vue';
  return undefined;
}

/** The only framework offering this UI lib (`bits` → svelte, `radix` → react), if any. */
function frameworkOf(ui: Ui | undefined): Framework | undefined {
  const matches = FRAMEWORKS.filter((f) => (UIS[f] as readonly string[]).includes(ui ?? ''));
  return matches.length === 1 ? matches[0] : undefined;
}

/** The project's source folder (`src`, Nuxt's `app`, or the root), whatever the framework. */
export function sourceRoot(cwd: string): string {
  const framework = detectFramework(cwd);
  if (framework) return SETUP[framework].root(cwd);
  return existsSync(join(cwd, 'src')) ? 'src' : '';
}

/** Guesses the project's UI lib: shadcn (components.json), then Ark UI, then Bits UI / Radix / Reka UI. */
export function detectUi(cwd: string, framework: Framework): Ui | undefined {
  if (existsSync(join(cwd, 'components.json'))) return 'shadcn';
  const deps = dependencies(cwd);
  return SETUP[framework].detect.find(([pkg]) => deps.has(pkg))?.[1];
}

/** Folder of an import alias: `$lib`/`#lib` → src/lib, `@/` and `~/` → the source folder. */
function aliasPath(cwd: string, root: string, alias: string): string {
  if (/^[$#]lib/.test(alias)) return join(cwd, alias.replace(/^[$#]lib/, 'src/lib'));
  if (/^[@~]\//.test(alias)) return join(cwd, root, alias.slice(2));
  return join(cwd, alias);
}

export function add(options: AddOptions): AddResult {
  const { cwd, force = false, style = 'zeste' } = options;
  const framework = options.framework ?? detectFramework(cwd) ?? frameworkOf(options.ui);
  if (!framework) {
    throw new Error(
      `Cannot guess the project's framework (no svelte, react or vue dependency). Specify --framework ${FRAMEWORKS.join('|')}.`,
    );
  }
  const setup = SETUP[framework];
  const uis: readonly Ui[] = UIS[framework];
  const ui = options.ui ?? detectUi(cwd, framework);
  if (!ui) {
    const packages = setup.detect.map(([pkg]) => pkg).join(', no ');
    throw new Error(
      `Cannot guess the project's UI library (no components.json, no ${packages}). Specify --ui ${uis.join('|')}.`,
    );
  }
  if (!uis.includes(ui)) throw new Error(`--ui ${ui} is not available for ${framework}: use ${uis.join('|')}.`);

  const root = setup.root(cwd);
  const dir = join(cwd, options.dir ?? setup.dir(root));
  const warnings: string[] = [];
  const deps = dependencies(cwd);
  const uiPackage = setup.uiPackages[ui];
  const required = [`@zeste/${framework}`, '@zeste/services', ...(uiPackage ? [uiPackage] : [])];
  const missing = required.filter((d) => !deps.has(d));
  if (missing.length) warnings.push(`Missing dependencies: install ${missing.join(' ')}`);

  let alias: string | undefined;
  if (ui === 'shadcn') {
    alias = readJson<ShadcnConfig>(join(cwd, 'components.json'))?.aliases?.ui ?? setup.defaultUiAlias;
    const folder = aliasPath(cwd, root, alias);
    const absent = SHADCN_COMPONENTS.filter((c) => !existsSync(join(folder, setup.shadcnFile(c))));
    if (absent.length) warnings.push(`Missing shadcn components: npx ${setup.shadcnCli} add ${absent.join(' ')}`);
  }

  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  const skipped: string[] = [];
  const files = ui === 'shadcn' ? setup.files : [...setup.files, THEME];
  const own = join(TEMPLATES, framework);
  for (const file of files) {
    // Most specific first: style + lib, then style-wide, then shared by every framework, then by all styles.
    const source = [
      join(own, style, ui, file),
      join(own, style, 'common', file),
      join(TEMPLATES, style, file),
      join(own, file),
    ].find((p) => existsSync(p));
    if (!source) throw new Error(`Template not found: ${framework}/${style}/${ui}/${file}`);
    const target = join(dir, file);
    const display = relative(cwd, target);
    if (existsSync(target) && !force) {
      skipped.push(display);
      continue;
    }
    let content = readFileSync(source, 'utf8');
    if (alias) content = content.replaceAll('%UI%', alias);
    writeFileSync(target, content);
    written.push(display);
  }

  return { framework, ui, style, dir: relative(cwd, dir), written, skipped, warnings };
}
