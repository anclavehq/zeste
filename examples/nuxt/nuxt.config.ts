export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // The zeste packages are published as TypeScript sources.
  build: { transpile: ['@zeste/core', '@zeste/services', '@zeste/vue'] },
  app: { head: { htmlAttrs: { lang: 'fr' }, title: 'zeste + Nuxt' } },
  css: ['~/assets/main.css'],
  devtools: { enabled: false },
  telemetry: false,
});
