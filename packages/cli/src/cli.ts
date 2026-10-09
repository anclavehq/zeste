#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { add, FRAMEWORKS, STYLES, UIS, type Framework, type Style, type Ui } from './add.ts';
import { init } from './init.ts';

const HELP = `zeste — consent banner and preferences, ready to edit

Usage:
  npx zeste init [--out <file>] [--dry-run] [--force]
  npx zeste add [--framework svelte|react|vue] [--ui <lib>] [--style zeste|pelure] [--dir <folder>] [--force]

init: finds the services the project already uses (a tarteaucitron configuration, analytics
snippets and video embeds pasted in pages) and writes their declaration for zeste.
  --out        Output file (default: lib/consent.ts in src/, app/ (Nuxt) or the root)
  --dry-run    Print the report and the file, write nothing

add: copies a banner, preferences and a placeholder written with your UI library.
  --framework  svelte, react or vue (auto-detected from package.json)
  --ui         UI library, auto-detected:
                 Svelte: shadcn (components.json), ark (@ark-ui/svelte), bits (bits-ui)
                 React:  shadcn (components.json), ark (@ark-ui/react), radix (radix-ui)
                 Vue:    shadcn (components.json), ark (@ark-ui/vue), reka (reka-ui)
  --style      zeste (default): understated, lemon accent · pelure: flat banner, thick outlines
  --dir        Destination folder (default: src/lib/components/zeste for Svelte,
               components/zeste in src/, app/ (Nuxt) or the root for React and Vue)
  --force      Overwrite existing files
`;

const NEXT_STEPS: Record<Framework, string> = {
  svelte: `
Then, in your +layout.svelte:

  <ZesteProvider {zeste}>
    {@render children()}
    <CookieBanner />
    <CookiePreferences />
    <!-- permanent link to change one's mind (required by EU consent rules) -->
    <button {@attach zeste.actions.openPreferences}>{zeste.messages.alertSmall}</button>
  </ZesteProvider>
`,
  react: `
Then, where you create zeste (a client component with Next.js):

  <ZesteProvider zeste={zeste}>
    {children}
    <CookieBanner />
    <CookiePreferences />
    {/* permanent link to change one's mind (required by EU consent rules) */}
    <button {...zeste.actions.openPreferences}>{zeste.messages.alertSmall}</button>
  </ZesteProvider>
`,
  vue: `
Then, where you create zeste (app.vue with Nuxt):

  <ZesteProvider :zeste="zeste">
    <NuxtPage />
    <CookieBanner />
    <CookiePreferences />
    <!-- permanent link to change one's mind (required by EU consent rules) -->
    <button v-bind="zeste.actions.openPreferences">{{ zeste.messages.alertSmall }}</button>
  </ZesteProvider>
`,
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    framework: { type: 'string' },
    ui: { type: 'string' },
    style: { type: 'string' },
    dir: { type: 'string' },
    out: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const isFramework = (value: string): value is Framework => (FRAMEWORKS as readonly string[]).includes(value);
const allUis: readonly string[] = [...new Set(Object.values(UIS).flat())];
const isUi = (value: string): value is Ui => allUis.includes(value);
const isStyle = (value: string): value is Style => (STYLES as readonly string[]).includes(value);

if (positionals[0] === 'init' && !values.help) {
  const result = init({ cwd: process.cwd(), out: values.out, force: values.force, dryRun: values['dry-run'] });
  const at = (f: { file: string; line: number }) => `${f.file}:${f.line}`;
  if (!result.services.length) {
    console.log('No known service found in the project. Declare yours from the catalog: https://github.com/AmauriC/tarteaucitron.js');
  }
  for (const s of result.services) {
    const notes = [...s.missing.map((k) => `${k} to fill in`), ...s.code.map((k) => `${k} to copy`)];
    console.log(`✔ ${s.name} (${s.exportName})${notes.length ? ` · ${notes.join(', ')}` : ''}  ← ${s.found.map(at).join(', ')}`);
  }
  for (const f of result.unknown) console.log(`? ${at(f)}  ${f.message}`);
  if (result.remove.length) {
    console.log('\nTo remove, zeste loads these services itself, after consent:');
    for (const f of result.remove) console.log(`  ${at(f)}  ${f.message}`);
  }
  if (result.embeds.length) {
    console.log('\nEmbeds that load before consent:');
    for (const f of result.embeds) console.log(`  ${at(f)}  ${f.message}`);
  }
  if (result.cookieName) {
    console.log(`\n⚠ Your tarteaucitron cookie is named "${result.cookieName}": pass storage: cookieStorage({ name: '${result.cookieName}' }) to createZeste() to keep your visitors' choices.`);
  }
  if (result.googleConsentMode) {
    console.log('\n⚠ tarteaucitron had Google Consent Mode on: pass plugins: [googleConsentMode()] to createZeste().');
  }
  if (result.cookieDomain) {
    console.log(`\n⚠ Your tarteaucitron cookie is shared with "${result.cookieDomain}": pass storage: cookieStorage({ domain: '${result.cookieDomain}' }) to createZeste().`);
  }
  if (values['dry-run']) console.log(`\n--- ${result.file}\n${result.source}`);
  else if (result.written) console.log(`\n✔ ${result.file} written. Next: npx zeste add`);
  else console.log(`\n= ${result.file} already exists (use --force to overwrite, or --dry-run to see the result)`);
  process.exit(0);
}

if (values.help || positionals[0] !== 'add') {
  console.log(HELP);
  process.exit(values.help ? 0 : 1);
}
if (values.framework !== undefined && !isFramework(values.framework)) {
  console.error(`--framework must be one of ${FRAMEWORKS.join(', ')}`);
  process.exit(1);
}
if (values.ui !== undefined && !isUi(values.ui)) {
  console.error(`--ui must be one of ${allUis.join(', ')}`);
  process.exit(1);
}
if (values.style !== undefined && !isStyle(values.style)) {
  console.error(`--style must be one of ${STYLES.join(', ')}`);
  process.exit(1);
}

try {
  const result = add({
    cwd: process.cwd(),
    framework: values.framework,
    ui: values.ui,
    style: values.style,
    dir: values.dir,
    force: values.force,
  });
  console.log(`✔ zeste (${result.framework}, ${result.ui}, style ${result.style}) → ${result.dir}`);
  for (const file of result.written) console.log(`  + ${file}`);
  for (const file of result.skipped) console.log(`  = ${file} (already present, use --force to overwrite)`);
  for (const warning of result.warnings) console.log(`⚠ ${warning}`);
  console.log(NEXT_STEPS[result.framework]);
} catch (error) {
  console.error(`✘ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
