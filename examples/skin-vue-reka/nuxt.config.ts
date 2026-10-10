import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // Inside this monorepo the zeste packages are TypeScript sources (the published ones are compiled).
  build: { transpile: ['@zeste/core', '@zeste/services', '@zeste/vue'] },
  app: { head: { title: 'zeste + Tailwind' } },
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  devtools: { enabled: false },
  telemetry: false,
});
