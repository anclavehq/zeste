import { defineConfig } from 'vite';

// The script to put in <head>: a classic script (no module), small, which loads the app next to it.
export default defineConfig({
  build: {
    target: 'es2015',
    emptyOutDir: false,
    lib: { entry: 'src/loader.ts', formats: ['iife'], name: 'zesteLoader', fileName: () => 'zeste.js' },
  },
});
