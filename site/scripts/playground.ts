/** Copies the interactive demo (examples/playground, one self-contained HTML file) into the site. */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const built = join(root, 'examples', 'playground', 'dist', 'playground.html');
if (!existsSync(built) || process.env.CI) {
  execFileSync('pnpm', ['--filter', 'example-playground', 'build'], { cwd: root, stdio: 'inherit' });
}
copyFileSync(built, join(import.meta.dirname, '..', 'public', 'playground.html'));
