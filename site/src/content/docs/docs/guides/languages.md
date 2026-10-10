---
title: Languages
description: The banner texts in 36 languages, chosen from the page or the browser.
---

The banner texts come from tarteaucitron, which translates them into 36 languages. If you pass no `messages`, zeste uses English.

## One language

```ts
import { messages } from '@zeste/services/i18n/fr';

createZeste({ services, messages });
```

## Several languages

`@zeste/services/i18n` picks a language and downloads only that one.

```ts
import { acceptedLanguages, detectLanguage, loadMessages, pickLanguage } from '@zeste/services/i18n';

// Client-only: the page language (<html lang>), then the browser's, English otherwise
const messages = await loadMessages(detectLanguage());

// With server rendering, choose on the server and pass the texts to the page, like the consent cookie
// (SvelteKit `load`, Next.js server component props, Nuxt `useAsyncData`)
const language = pickLanguage([pageLanguage, ...acceptedLanguages(request.headers.get('accept-language'))]);
const messages = await loadMessages(language);
```

The [script tag](../../start/script-tag/) version picks the language by itself. To force one, set `language: 'de'`.

## Typed texts in your components

`zeste.messages` holds the texts with their types, for example `zeste.messages.acceptAll` or
`zeste.messages.categories.analytic?.title`. In a child component, pass the `Messages` type from
`@zeste/services/i18n/types` to get them typed. Use `getZeste<Messages>()` in Svelte and `useZeste<Messages>()` in
React and Vue.

Developer messages (the [compliance guard](../compliance/) warnings) are in English.

## Available languages

`ar`, `bg`, `ca`, `cn`, `cs`, `da`, `de`, `el`, `en`, `es`, `et`, `fi`, `fr`, `hr`, `hu`, `it`, `ja`, `ko`, `lb`,
`lt`, `lv`, `nl`, `no`, `oc`, `pl`, `pt`, `ro`, `ru`, `se`, `sk`, `sq`, `sv`, `tr`, `uk`, `vi`, `zh`.
