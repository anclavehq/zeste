import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        catalog: resolve(__dirname, 'catalog.html'),
        'real-network': resolve(__dirname, 'real-network.html'),
        i18n: resolve(__dirname, 'i18n.html'),
      },
    },
  },
});
