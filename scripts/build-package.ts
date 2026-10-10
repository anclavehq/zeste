/**
 * Compiles a package's src/ to dist/, run from the package folder:
 *   node ../../scripts/build-package.ts            tsc (tsconfig.build.json)
 *   node ../../scripts/build-package.ts --svelte   svelte-package (keeps .svelte files)
 * The sources import each other as `./x.ts`; published files must say `./x.js`. tsc rewrites the JavaScript but
 * not the declarations, svelte-package rewrites neither: done here.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const svelte = process.argv.includes('--svelte');
const dist = join(process.cwd(), 'dist');
rmSync(dist, { recursive: true, force: true });
if (svelte) execFileSync('svelte-package', ['-i', 'src', '-o', 'dist'], { stdio: 'inherit' });
else execFileSync('tsc', ['-p', 'tsconfig.build.json'], { stdio: 'inherit' });

const relativeTs = /((?:from|import)\s*\(?\s*['"]\.{1,2}\/[^'"]+?)\.tsx?(['"])/g;
for (const entry of readdirSync(dist, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !/\.(d\.ts|js|svelte)$/.test(entry.name)) continue;
  const file = join(entry.parentPath, entry.name);
  const source = readFileSync(file, 'utf8');
  const rewritten = source.replace(relativeTs, '$1.js$2');
  if (rewritten !== source) writeFileSync(file, rewritten);
}
