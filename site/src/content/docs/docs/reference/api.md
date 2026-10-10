---
title: API
description: createZeste, the zeste object, the components and the engine.
---

The three bindings expose the same API. Differences are noted where they exist.

## `createZeste(options)`

Creates the consent state. On the server, create one **per request** (inside a component, never at module level).

| Option | Type | |
|---|---|---|
| `services` | `ServiceDefinition[]` | The services, from `@zeste/services` |
| `initial` | `Record<string, string>` | The choice read on the server: `parseConsentCookie(cookieValue)` |
| `messages` | `Messages` | Texts, from `@zeste/services/i18n/<lang>`. English by default |
| `plugins` | `ConsentPlugin[]` | For example `googleConsentMode()` |
| `policyVersion` | `string` | Changing it invalidates existing choices and shows the banner again |
| `onRecord` | `(record) => void` | Called after every choice: see [Proof of consent](../../guides/proof-of-consent/) |
| `allowPreConsentRequests` | `boolean \| string[]` | Allows the services that contact a third party before consent. Off by default |
| `storage` | `ConsentStorage` | Where the choice is kept. Default: `cookieStorage()`, tarteaucitron-compatible |
| `guard` | `boolean` | The [compliance guard](../../guides/compliance/). Default: on in development |
| `delegateClicks` | `boolean` | Handles `[data-zeste-allow="<key>"]` buttons in HTML placeholders. On by default |
| `expose` | `boolean` | Publishes the declared services in `window.__zesteManifest`, as other consent tools do, so audit tools can compare them with what the page loads. On by default |

`cookieStorage({ name, domain, expiresInDays })` changes the cookie name (`tarteaucitron` by default), shares it
across subdomains (`.example.com`) or changes its lifetime (395 days by default).

## The `zeste` object

Returned by `createZeste`, and by `getZeste()` (Svelte) or `useZeste()` (React, Vue) in child components.

### State

| Member | |
|---|---|
| `showBanner` | `true` while the visitor has not chosen (and once the state is known) |
| `decided` | The visitor has chosen for every service that needs consent |
| `services` | Every service with its `status`: `granted`, `denied` or `unknown` |
| `categories` | Services grouped by purpose, each with a `status` (`mixed` if they differ) |
| `exempt` | Services that need no consent |
| `needsReload` | A refused script was already loaded: only a reload really stops it |
| `has(key)`, `statusOf(key)` | One service's state |
| `messages` | The texts |
| `preferencesOpen` | Whether the preferences are open. Svelte: bindable. React: `setPreferencesOpen(open)`. Vue: `v-model:open` |
| `draft` | Choices being edited in the preferences. React: `setDraft(key, checked)` |

### Actions

| Member | |
|---|---|
| `acceptAll()`, `denyAll()` | |
| `grant(key)`, `deny(key)` | One service |
| `setCategory(category, granted)` | Every service of a category |
| `openPreferences()`, `closePreferences()`, `savePreferences()` | The preferences window; `savePreferences` applies the draft |
| `draftCategory(category, granted)` | Checks or unchecks a whole category in the draft |
| `actions.<name>` | The same actions (`acceptAll`, `denyAll`, `openPreferences`, `savePreferences`, `closePreferences`) to attach to your buttons, checked by the guard. Svelte: `{@attach zeste.actions.denyAll}`. React: `{...zeste.actions.denyAll}`. Vue: `v-bind="zeste.actions.denyAll"` |
| `manager` | The underlying engine |

## Components

| Component | |
|---|---|
| `<ZesteProvider zeste>` | Makes `zeste` available to child components and starts it in the browser |
| `<ConsentBanner>` | Renders its content only while the banner should show; marks it for the guard |
| `<ConsentGate service embed? embedClass? placeholder>` | See [Embedded content](../../guides/embeds/) |

## The engine: `@zeste/core`

`createConsent(options)` takes the same options (but `messages` and `guard`) and returns a framework-free manager:
`getSnapshot()`, `subscribe(listener)`, `has`, `grant`, `deny`, `grantAll`, `denyAll`, `setCategory`, `set(choices)`,
`start()`, `rescan(key?)`, `settled()`, `destroy()`. `subscribe` follows the Svelte store contract and works with
React's `useSyncExternalStore`.

Also exported: `parseConsentCookie`, `serializeConsentCookie`, `cookieStorage`, `memoryStorage`,
`googleConsentMode`, and the guard's building blocks (`auditBanner`, `auditReopen`).
