import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        catalog: resolve(__dirname, 'catalog.html'),
        client: resolve(__dirname, 'client.html'),
      },
    },
  },
});
