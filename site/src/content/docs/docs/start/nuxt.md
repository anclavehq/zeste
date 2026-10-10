---
title: Nuxt
description: Set up zeste in a Nuxt app, with the choice read on the server.
---

## 1. Install and declare your services

```sh
npm install @zeste/vue @zeste/core @zeste/services
npx @zeste/cli init
```

`zeste init` writes `app/lib/consent.ts` with the services it finds. You can also write it yourself:

```ts
// app/lib/consent.ts
import { gtag, youtube } from '@zeste/services';

export const services = () => [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()];
```

## 2. Generate the interface

```sh
npx @zeste/cli add                 # detects Reka UI, Ark UI or shadcn-vue
npx @zeste/cli add --style pelure
```

This writes `CookieBanner`, `CookiePreferences` and `CookiePlaceholder` into `app/components/zeste/`.

## 3. Add zeste to your app

`useCookie` also reads the cookie during server rendering, so the first render already shows the right state.

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import { createZeste, parseConsentCookie, ZesteProvider } from '@zeste/vue';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/en';
import { CookieBanner, CookiePreferences } from '~/components/zeste';
import { services } from '~/lib/consent';

const cookie = useCookie('tarteaucitron', { decode: (value) => value });
// One instance per request on the server, one per page in the browser: never at module level.
const zeste = createZeste({
  services: services(),
  initial: parseConsentCookie(cookie.value),
  plugins: [googleConsentMode()],
  messages,
});
</script>

<template>
  <ZesteProvider :zeste="zeste">
    <NuxtPage />
    <CookieBanner />
    <CookiePreferences />
    <!-- A permanent link to change one's mind: required by EU consent rules -->
    <button v-bind="zeste.actions.openPreferences">Cookie settings</button>
  </ZesteProvider>
</template>
```

In a child component, `useZeste()` returns the same reactive object. Actions bind with
`v-bind="zeste.actions.denyAll"`, a dialog with `v-model:open="zeste.preferencesOpen"` and a switch with
`v-model="zeste.draft[key]"`.
