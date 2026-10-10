---
title: Introduction
description: What zeste does, what you handle yourself, and where to start.
---

zeste is a cookie consent library for Svelte, React, Vue and sites without a framework. It reuses the service
catalog of [tarteaucitron.js](https://github.com/AmauriC/tarteaucitron.js), with 247 services and texts in 36
languages, and replaces its engine and its interface. You build the banner with your own components.

## What zeste does

- It loads each third-party service only after the visitor accepts it. Before that, the page sends no request to
  Google, YouTube, Matomo or any other service in the catalog.
- It stores the choice in the same cookie as tarteaucitron. Visitors of a site that moves from tarteaucitron keep
  their choices.
- It handles withdrawal. When a visitor refuses a service they had accepted, zeste deletes its cookies and puts
  embedded videos back behind their placeholder.
- It updates Google Consent Mode v2.
- In development, it warns you when the banner breaks a measurable rule, for example when "Deny all" is missing or
  smaller than "Accept all".
- It passes a record of each choice to your code, which you can keep as proof of consent.

## What you handle

In Svelte, React and Vue, zeste does not draw anything. You write the banner and the preferences with your
components. `npx @zeste/cli add` writes a first version with your UI library, and the files are yours to change.

zeste ships tarteaucitron's translations of the banner texts. Your privacy policy, and the description of what each
cookie is for, are up to you.

## Packages

| Package | Role |
|---|---|
| `@zeste/core` | The engine. It works without a framework and handles the state, the cookie, plugins and tarteaucitron compatibility |
| `@zeste/services` | The catalog, with one module per service, and the texts |
| `@zeste/svelte` | Svelte 5 bindings |
| `@zeste/react` | React 18 and 19 bindings, for Next.js and client-only apps |
| `@zeste/vue` | Vue 3 bindings, for Nuxt and client-only apps |
| `@zeste/browser` | A `<script>` tag for sites without a framework, with a banner included |
| `@zeste/cli` | The CLI, with `zeste init` and `zeste add` |

## Where to start

- For a SvelteKit, Next.js or Nuxt app, follow [SvelteKit](./start/sveltekit/), [Next.js](./start/nextjs/) or
  [Nuxt](./start/nuxt/).
- For an app without a server, built with Vite, see [Single-page apps](./start/spa/).
- For WordPress, a static site or PHP templates, see [Script tag](./start/script-tag/).
- For a site that already uses tarteaucitron, see [Migrate from tarteaucitron](./guides/migrate/).
