---
title: Script tag configuration
description: Every option of window.zesteConfig.
---

Set `window.zesteConfig` before the zeste `<script>` tag. See [Script tag](../../start/script-tag/).

| Option | Default | |
|---|---|---|
| `services` | | Services by catalog key, with their options: `{ gtag: { gtagUa: 'G-…' }, youtube: {} }` |
| `language` | page, then browser | Language code (`fr`, `de`…) |
| `style` | `'zeste'` | `'zeste'` (understated, lemon accent) or `'pelure'` (flat banner, thick outlines) |
| `theme` | `'site'` | `'site'`: dark when `<html>` has the `dark` class or `data-theme="dark"`. `'system'`: follows the visitor's system. `'light'` or `'dark'`: fixed |
| `privacyUrl` | | Your privacy policy, linked from the banner |
| `cookieName` | `'tarteaucitron'` | Visitors keep the choices made with tarteaucitron |
| `cookieDomain` | | For example `.example.com` to share the choice across subdomains |
| `policyVersion` | | Changing it asks every visitor again |
| `googleConsentMode` | `true` | Google Consent Mode v2 for Google Analytics, Ads and Tag Manager |
| `showIcon` | `true` | Round button to reopen the preferences once the choice is made. Turn it off only if the page has its own link to `#zeste` |
| `hashtag` | `'#zeste'` | Address fragment that opens the preferences (`#tarteaucitron` also works) |
| `allowPreConsentRequests` | `false` | Services allowed to contact their third party before consent (cookieless modes) |
| `guard` | | Console warnings when the banner breaks a measurable consent rule |
| `onRecord` | | Called after every choice: see [Proof of consent](../../guides/proof-of-consent/) |

## `window.zeste`

| Member | |
|---|---|
| `open()`, `close()` | The preferences |
| `acceptAll()`, `denyAll()` | |
| `grant(key)`, `deny(key)`, `has(key)` | One service |
| `manager` | The engine (`@zeste/core`) |

Elements with `data-zeste-open` and links to `#zeste` open the preferences.
