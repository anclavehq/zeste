#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { add, FRAMEWORKS, STYLES, UIS, type Framework, type Style, type Ui } from './add.ts';

const HELP = `zeste — consent banner and preferences, ready to edit

Usage:
  npx zeste add [--framework svelte|react|vue] [--ui <lib>] [--style zeste|pelure] [--dir <folder>] [--force]

Options:
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
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const isFramework = (value: string): value is Framework => (FRAMEWORKS as readonly string[]).includes(value);
const allUis: readonly string[] = [...new Set(Object.values(UIS).flat())];
const isUi = (value: string): value is Ui => allUis.includes(value);
const isStyle = (value: string): value is Style => (STYLES as readonly string[]).includes(value);

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
