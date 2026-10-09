import { defineConfig } from 'vite';

// The engine, the interface and one chunk per service and per language, loaded by dist/zeste.js.
export default defineConfig({
  build: {
    target: 'es2020',
    emptyOutDir: true,
    rollupOptions: {
      input: { app: 'src/app.ts' },
      preserveEntrySignatures: false,
      output: {
        entryFileNames: 'zeste.app.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});
