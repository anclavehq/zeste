import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const origin = (site ? site.origin : 'https://anclavehq.github.io').replace(/\/$/, '');
  const baseUrl = `${origin}${base}`;

  const content = `# zeste

> Headless, framework-agnostic cookie consent engine built on the tarteaucitron.js 247-service catalog.

zeste stores user consent in a single cookie, loads scripts only after acceptance, and drives Google Consent Mode v2 without third-party requests prior to consent.

## Packages (npm)
- @zeste/core (v0.1.0): Headless core engine, cookie state machine, Google Consent Mode v2 integration.
- @zeste/cli (v0.1.1): CLI tool to detect services (\`init\`) and generate copy-pasteable UI components (\`add\`).
- @zeste/svelte (v0.1.0): Svelte 5 bindings and components.
- @zeste/react (v0.1.0): React 18 & 19 bindings and components (Next.js support).
- @zeste/vue (v0.1.0): Vue 3 bindings and components (Nuxt support).
- @zeste/browser (v0.1.0): Standalone script tag with bundled banner for non-framework sites.
- @zeste/services (v0.1.0): Catalog of 247 services and i18n text in 36 languages from tarteaucitron.js.

## CLI Usage
\`\`\`sh
# Detect current site scripts and generate lib/consent.ts
npx @zeste/cli init

# Generate customizable components for your UI library (shadcn, Radix, Bits UI, Reka UI, Ark UI)
npx @zeste/cli add
npx @zeste/cli add --style pelure
\`\`\`

## Documentation
- [Quick Start: Next.js](${baseUrl}/docs/start/nextjs/): Setup guide for Next.js (App Router / Pages Router).
- [Quick Start: SvelteKit](${baseUrl}/docs/start/sveltekit/): Setup guide for SvelteKit.
- [Quick Start: Nuxt](${baseUrl}/docs/start/nuxt/): Setup guide for Nuxt 3.
- [Quick Start: SPA / Vite](${baseUrl}/docs/start/spa/): Single-page applications with client-side rendering.
- [Quick Start: Script Tag](${baseUrl}/docs/start/script-tag/): Standalone HTML/WordPress/PHP integration.
- [CLI Reference](${baseUrl}/docs/reference/cli/): Detailed documentation for @zeste/cli commands and flags.
- [API Reference](${baseUrl}/docs/reference/api/): TypeScript types, events, and methods for @zeste/core.
- [Migrate from tarteaucitron](${baseUrl}/docs/guides/migrate/): Migrate existing sites while preserving user cookie choices.
- [Custom UI & Styling](${baseUrl}/docs/guides/ui/): Customizing generated components and themes.
- [Embeds & Placeholders](${baseUrl}/docs/guides/embeds/): Guarding YouTube, Vimeo, Maps behind <ConsentGate>.
- [Compliance & Consent Mode](${baseUrl}/docs/guides/compliance/): Zero-request pre-consent, Google Consent Mode v2, and dev guard.
- [Proof of Consent](${baseUrl}/docs/guides/proof-of-consent/): Storing audit records with \`onRecord\`.
- [Services Catalog](${baseUrl}/docs/reference/services/): List of supported analytics, advertising, and embed services.
- [Full Documentation for LLMs](${baseUrl}/llms-full.txt): Aggregated full documentation text.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
