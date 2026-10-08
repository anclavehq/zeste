import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), svelte()],
	resolve: { alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) } },
	// A single JS and a single CSS file, later inlined into a self-contained HTML file (scripts/inline.ts)
	build: {
		assetsInlineLimit: Number.MAX_SAFE_INTEGER,
		cssCodeSplit: false,
		modulePreload: false,
		rollupOptions: { output: { inlineDynamicImports: true } }
	}
});
