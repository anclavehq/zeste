import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // The zeste packages are published as TypeScript sources.
  build: { transpile: ['@zeste/core', '@zeste/services', '@zeste/vue'] },
  app: { head: { title: 'zeste + Tailwind' } },
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  devtools: { enabled: false },
  telemetry: false,
});
