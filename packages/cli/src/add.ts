import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UIS = ['bits', 'ark', 'shadcn'] as const;
export type Ui = (typeof UIS)[number];

/** `zeste`: understated, lemon accent (default). `pelure`: flat banner, thick outlines. */
export const STYLES = ['zeste', 'pelure'] as const;
export type Style = (typeof STYLES)[number];

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const FILES = ['CookieBanner.svelte', 'CookiePreferences.svelte', 'CookiePlaceholder.svelte', 'index.ts'];
/** Skin colors: only without shadcn (shadcn follows the project theme). */
const THEME = 'theme.css';
/** shadcn-svelte components used by the generated files. */
export const SHADCN_COMPONENTS = ['button', 'dialog', 'switch', 'label'];

export interface AddOptions {
  cwd: string;
  ui?: Ui;
  style?: Style;
  dir?: string;
  force?: boolean;
}

export interface AddResult {
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

/** Guesses the project's UI lib: shadcn-svelte (components.json), then Ark UI, then Bits UI. */
export function detectUi(cwd: string): Ui | undefined {
  if (existsSync(join(cwd, 'components.json'))) return 'shadcn';
  const deps = dependencies(cwd);
  if (deps.has('@ark-ui/svelte')) return 'ark';
  if (deps.has('bits-ui')) return 'bits';
  return undefined;
}

/** Import alias of the shadcn components (e.g. `$lib/components/ui`) and the matching folder. */
function shadcnUi(cwd: string): { alias: string; path: string } {
  const alias = readJson<ShadcnConfig>(join(cwd, 'components.json'))?.aliases?.ui ?? '$lib/components/ui';
  return { alias, path: join(cwd, alias.replace(/^[$#]lib/, 'src/lib')) };
}

export function add(options: AddOptions): AddResult {
  const { cwd, force = false, style = 'zeste' } = options;
  const ui = options.ui ?? detectUi(cwd);
  if (!ui) {
    throw new Error(
      'Cannot guess the project\'s UI library (no components.json, no @ark-ui/svelte, no bits-ui). Specify --ui bits|ark|shadcn.',
    );
  }

  const dir = join(cwd, options.dir ?? 'src/lib/components/zeste');
  const warnings: string[] = [];
  const deps = dependencies(cwd);
  const required = ['@zeste/svelte', '@zeste/services', ...(ui === 'bits' ? ['bits-ui'] : ui === 'ark' ? ['@ark-ui/svelte'] : [])];
  const missing = required.filter((d) => !deps.has(d));
  if (missing.length) warnings.push(`Missing dependencies: install ${missing.join(' ')}`);

  const shadcn = ui === 'shadcn' ? shadcnUi(cwd) : undefined;
  if (shadcn) {
    const absent = SHADCN_COMPONENTS.filter((c) => !existsSync(join(shadcn.path, c)));
    if (absent.length) warnings.push(`Missing shadcn components: npx shadcn-svelte@latest add ${absent.join(' ')}`);
  }

  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  const skipped: string[] = [];
  const files = ui === 'shadcn' ? FILES : [...FILES, THEME];
  for (const file of files) {
    // Most specific first: style + lib, then style-wide, then shared by all styles.
    const source = [join(TEMPLATES, style, ui, file), join(TEMPLATES, style, 'common', file), join(TEMPLATES, style, file), join(TEMPLATES, file)].find(
      (p) => existsSync(p),
    );
    if (!source) throw new Error(`Template not found: ${style}/${ui}/${file}`);
    const target = join(dir, file);
    const display = relative(cwd, target);
    if (existsSync(target) && !force) {
      skipped.push(display);
      continue;
    }
    let content = readFileSync(source, 'utf8');
    if (shadcn) content = content.replaceAll('%UI%', shadcn.alias);
    writeFileSync(target, content);
    written.push(display);
  }

  return { ui, style, dir: relative(cwd, dir), written, skipped, warnings };
}
