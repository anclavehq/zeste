import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Plain HTML pages; the built zeste script is served from the site root (/zeste.js), as from a CDN.
export default defineConfig({
  publicDir: resolve(__dirname, '../../packages/browser/dist'),
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        tarteaucitron: resolve(__dirname, 'tarteaucitron.html'),
        international: resolve(__dirname, 'international.html'),
      },
    },
  },
});
