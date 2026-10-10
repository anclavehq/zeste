---
title: Nuxt
description: Installer zeste dans une app Nuxt, avec le choix lu côté serveur.
---

## 1. Installer et déclarer ses services

```sh
npm install @zeste/vue @zeste/core @zeste/services
npx zeste init
```

`zeste init` écrit `app/lib/consent.ts` avec les services qu'il trouve. Vous pouvez aussi l'écrire vous-même :

```ts
// app/lib/consent.ts
import { gtag, youtube } from '@zeste/services';

export const services = () => [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()];
```

## 2. Générer l'interface

```sh
npx zeste add                 # détecte Reka UI, Ark UI ou shadcn-vue
npx zeste add --style pelure
```

`CookieBanner`, `CookiePreferences` et `CookiePlaceholder` sont écrits dans `app/components/zeste/`.

## 3. Ajouter zeste à l'app

`useCookie` lit aussi le cookie pendant le rendu serveur, donc le premier rendu montre déjà le bon état.

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import { createZeste, parseConsentCookie, ZesteProvider } from '@zeste/vue';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import { CookieBanner, CookiePreferences } from '~/components/zeste';
import { services } from '~/lib/consent';

const cookie = useCookie('tarteaucitron', { decode: (value) => value });
// Une instance par requête côté serveur, une par page dans le navigateur : jamais au niveau du module.
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
    <!-- Un lien permanent pour changer d'avis : exigé par les règles européennes -->
    <button v-bind="zeste.actions.openPreferences">Gestion des cookies</button>
  </ZesteProvider>
</template>
```

Dans un composant enfant, `useZeste()` renvoie le même objet, réactif. Les actions se lient avec
`v-bind="zeste.actions.denyAll"`, une modale avec `v-model:open="zeste.preferencesOpen"` et un interrupteur avec
`v-model="zeste.draft[key]"`.
