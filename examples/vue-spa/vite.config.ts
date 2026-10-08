import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // In this monorepo, @zeste/vue has its own Vue (dev dependency): use the app's one only.
  resolve: { dedupe: ['vue'] },
});
