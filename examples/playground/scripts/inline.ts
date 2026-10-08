/** Bundles the build into a single self-contained HTML file: dist/playground.html. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
let html = readFileSync(join(dist, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*href="\/([^"]+)"[^>]*>/g, (_, file: string) => {
	return `<style>${readFileSync(join(dist, file), 'utf8')}</style>`;
});
html = html.replace(/<script type="module"[^>]*src="\/([^"]+)"[^>]*><\/script>/g, (_, file: string) => {
	const js = readFileSync(join(dist, file), 'utf8').replaceAll('</script', '<\\/script');
	return `<script type="module">${js}</script>`;
});
if (/src="\/assets|href="\/assets/.test(html)) throw new Error('resource not inlined');

writeFileSync(join(dist, 'playground.html'), html);
console.log(`dist/playground.html: ${(html.length / 1024).toFixed(0)} KB`);
