#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { add, STYLES, UIS, type Style, type Ui } from './add.ts';

const HELP = `zeste — consent banner and preferences, ready to edit

Usage:
  npx zeste add [--ui bits|ark|shadcn] [--style zeste|pelure] [--dir <folder>] [--force]

Options:
  --ui      UI library (auto-detected: components.json → shadcn, @ark-ui/svelte → ark, bits-ui → bits)
  --style   zeste (default): understated, lemon accent · pelure: flat banner, thick outlines
  --dir     Destination folder (default: src/lib/components/zeste)
  --force   Overwrite existing files
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    ui: { type: 'string' },
    style: { type: 'string' },
    dir: { type: 'string' },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const isUi = (value: string): value is Ui => (UIS as readonly string[]).includes(value);
const isStyle = (value: string): value is Style => (STYLES as readonly string[]).includes(value);

if (values.help || positionals[0] !== 'add') {
  console.log(HELP);
  process.exit(values.help ? 0 : 1);
}
if (values.ui !== undefined && !isUi(values.ui)) {
  console.error(`--ui must be one of ${UIS.join(', ')}`);
  process.exit(1);
}
if (values.style !== undefined && !isStyle(values.style)) {
  console.error(`--style must be one of ${STYLES.join(', ')}`);
  process.exit(1);
}

try {
  const result = add({ cwd: process.cwd(), ui: values.ui, style: values.style, dir: values.dir, force: values.force });
  console.log(`✔ zeste (${result.ui}, style ${result.style}) → ${result.dir}`);
  for (const file of result.written) console.log(`  + ${file}`);
  for (const file of result.skipped) console.log(`  = ${file} (already present, use --force to overwrite)`);
  for (const warning of result.warnings) console.log(`⚠ ${warning}`);
  console.log(`
Then, in your +layout.svelte:

  <ZesteProvider {zeste}>
    {@render children()}
    <CookieBanner />
    <CookiePreferences />
    <!-- permanent link to change one's mind (required by EU consent rules) -->
    <button {@attach zeste.actions.openPreferences}>{zeste.messages.alertSmall}</button>
  </ZesteProvider>
`);
} catch (error) {
  console.error(`✘ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
