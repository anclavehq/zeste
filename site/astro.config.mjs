// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// SITE_URL / BASE_PATH: set by the deploy workflow (e.g. GitHub Pages serves the repo under /zeste).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://anclavehq.github.io',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'zeste',
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/anclavehq/zeste' }],
      editLink: { baseUrl: 'https://github.com/anclavehq/zeste/edit/main/site/' },
      customCss: ['./src/styles/fonts.css', './src/styles/starlight.css'],
      components: { SiteTitle: './src/components/SiteTitle.astro' },
      sidebar: [
        {
          label: 'Get started',
          translations: { fr: 'Démarrer' },
          items: [
            { slug: 'docs' },
            { slug: 'docs/start/sveltekit' },
            { slug: 'docs/start/nextjs' },
            { slug: 'docs/start/nuxt' },
            { slug: 'docs/start/spa' },
            { slug: 'docs/start/script-tag' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { slug: 'docs/guides/migrate' },
            { slug: 'docs/guides/ui' },
            { slug: 'docs/guides/embeds' },
            { slug: 'docs/guides/languages' },
            { slug: 'docs/guides/compliance' },
            { slug: 'docs/guides/proof-of-consent' },
          ],
        },
        {
          label: 'Reference',
          translations: { fr: 'Référence' },
          items: [
            { slug: 'docs/reference/cli' },
            { slug: 'docs/reference/api' },
            { slug: 'docs/reference/script-config' },
            { slug: 'docs/reference/services' },
          ],
        },
      ],
    }),
  ],
});
