---
title: Introduction
description: What zeste is, what it does for you and what it leaves to you.
---

zeste is a **headless** cookie consent library. It keeps the service catalog of
[tarteaucitron.js](https://github.com/AmauriC/tarteaucitron.js) (247 services, texts in 36 languages) and replaces
its engine and its interface: you build the banner with your own components.

## What zeste does

- Loads each third-party service **only after consent**, and nothing before: no request to Google, YouTube or
  Matomo until the visitor accepts.
- Stores the choice in the same cookie as tarteaucitron, so visitors of a migrated site keep their choices.
- Withdraws consent cleanly: cookies deleted, embeds back to their placeholder.
- Drives Google Consent Mode v2.
- Warns you during development when the banner breaks a measurable rule (a "Deny all" button that is missing,
  smaller or paler than "Accept all", no way to reopen the preferences).
- Hands you a record of each choice, to keep as proof of consent.

## What it leaves to you

- **The interface.** zeste draws nothing in Svelte, React or Vue. `npx zeste add` writes a first version with your
  UI library, and those files are yours.
- **The texts and your privacy policy.** zeste ships tarteaucitron's translations; what your cookies are for is
  yours to describe.

## Packages

| Package | Role |
|---|---|
| `@zeste/core` | Framework-free engine: state, cookie, plugins, tarteaucitron compatibility |
| `@zeste/services` | The catalog, one module per service, and the texts |
| `@zeste/svelte` | Svelte 5 bindings |
| `@zeste/react` | React 18 and 19 bindings, Next.js |
| `@zeste/vue` | Vue 3 bindings, Nuxt |
| `@zeste/browser` | One `<script>` tag for sites without a framework, banner included |
| `zeste` | The CLI: `zeste init`, `zeste add` |

## Where to start

- A SvelteKit, Next.js or Nuxt app: [SvelteKit](./start/sveltekit/), [Next.js](./start/nextjs/),
  [Nuxt](./start/nuxt/).
- A client-only app (Vite): [Single-page apps](./start/spa/).
- WordPress, a static site, PHP templates: [Script tag](./start/script-tag/).
- A site already on tarteaucitron: [Migrate from tarteaucitron](./guides/migrate/).

:::note
zeste is not on npm yet. The commands on these pages describe the first release.
:::
