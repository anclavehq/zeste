---
title: CLI
description: zeste init and zeste add.
---

## `zeste init`

Finds the services the project already uses and writes their declaration for zeste.

```sh
npx zeste init             # writes lib/consent.ts (in src/, Nuxt's app/ or the root)
npx zeste init --dry-run   # report only
```

It reads the project once and recognizes:

- a tarteaucitron configuration: `tarteaucitron.job`, `tarteaucitron.user.*`, cookie name and domain, Consent Mode;
- the most common snippets pasted as is in pages: Google Analytics, Google Ads, Tag Manager, Matomo, Hotjar, Meta
  Pixel, Clarity, Google Maps, YouTube and Vimeo embeds.

Its report lists, file and line, the scripts to remove (zeste loads them after consent), the embeds to put behind
`<ConsentGate>`, and the options left to fill in. It does not try to recognize every third party: check the list,
then add the missing services from the [catalog](../services/).

| Option | |
|---|---|
| `--out <file>` | Output file. Default: `lib/consent.ts` in `src/`, `app/` (Nuxt) or the root |
| `--format module\|script` | `module`: TypeScript for the npm packages (default with a `package.json`). `script`: `zeste.config.js` for the [script tag](../../start/script-tag/) (default without one) |
| `--dry-run` | Print the report and the file, write nothing |
| `--force` | Overwrite an existing file |

## `zeste add`

Copies a banner, preferences and a placeholder written with your UI library.

```sh
npx zeste add
npx zeste add --ui ark --style pelure
```

| Option | |
|---|---|
| `--framework svelte\|react\|vue` | Detected from `package.json` |
| `--ui <lib>` | Svelte: `shadcn`, `ark`, `bits`. React: `shadcn`, `ark`, `radix`. Vue: `shadcn`, `ark`, `reka`. Detected from `components.json` and the dependencies |
| `--style zeste\|pelure` | `zeste` (default): understated, lemon accent. `pelure`: flat banner, thick outlines |
| `--dir <folder>` | Default: `src/lib/components/zeste` (Svelte), `components/zeste` in `src/`, `app/` (Nuxt) or the root (React, Vue) |
| `--force` | Overwrite existing files |

See [Your own UI](../../guides/ui/).
