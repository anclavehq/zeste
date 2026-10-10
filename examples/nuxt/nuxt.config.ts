export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // Inside this monorepo the zeste packages are TypeScript sources (the published ones are compiled).
  build: { transpile: ['@zeste/core', '@zeste/services', '@zeste/vue'] },
  app: { head: { htmlAttrs: { lang: 'fr' }, title: 'zeste + Nuxt' } },
  css: ['~/assets/main.css'],
  devtools: { enabled: false },
  telemetry: false,
});
