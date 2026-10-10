---
title: SvelteKit
description: Installer zeste dans une app SvelteKit, avec le choix lu côté serveur.
---

## 1. Installer et déclarer ses services

```sh
npm install @zeste/svelte @zeste/core @zeste/services
npx zeste init
```

`zeste init` lit le projet et écrit `src/lib/consent.ts` avec les services qu'il trouve (une config tarteaucitron,
des scripts Google Analytics ou Matomo, des vidéos YouTube…). Vous pouvez aussi l'écrire vous-même :

```ts
// src/lib/consent.ts
import { gtag, youtube } from '@zeste/services';

export const services = () => [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()];
```

Chaque service est une fonction de `@zeste/services`. Ses options sont typées, et le navigateur ne télécharge son
code que quand le visiteur l'accepte. La liste complète est dans le [catalogue des services](../../reference/services/).

## 2. Lire le choix côté serveur

```ts
// src/routes/+layout.server.ts
import { parseConsentCookie } from '@zeste/svelte';

export const load = ({ cookies }) => ({
  consent: parseConsentCookie(cookies.get('tarteaucitron')),
});
```

Le premier rendu montre alors déjà le bon état. Un visiteur qui a déjà choisi ne voit pas la bannière apparaître puis disparaître.

## 3. Générer l'interface

```sh
npx zeste add                 # détecte Bits UI, Ark UI ou shadcn-svelte
npx zeste add --style pelure  # l'autre style
```

`CookieBanner`, `CookiePreferences` et `CookiePlaceholder` sont écrits dans `src/lib/components/zeste/`. Voir
[Votre propre interface](../../guides/ui/) pour les adapter.

## 4. Ajouter zeste au layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { createZeste, ZesteProvider } from '@zeste/svelte';
  import { googleConsentMode } from '@zeste/core';
  import { messages } from '@zeste/services/i18n/fr';
  import { CookieBanner, CookiePreferences } from '$lib/components/zeste';
  import { services } from '$lib/consent';

  let { data, children } = $props();
  // Une instance par requête : dans le composant, jamais au niveau du module.
  const zeste = createZeste({
    services: services(),
    initial: data.consent,
    plugins: [googleConsentMode()],
    messages,
  });
</script>

<ZesteProvider {zeste}>
  {@render children()}
  <CookieBanner />
  <CookiePreferences />
  <!-- Un lien permanent pour changer d'avis : exigé par les règles européennes -->
  <button {@attach zeste.actions.openPreferences}>Gestion des cookies</button>
</ZesteProvider>
```

Dans n'importe quel composant enfant, `getZeste()` renvoie le même objet.

## Pour aller plus loin

- Vidéos et cartes : [Contenus intégrés](../../guides/embeds/)
- Plusieurs langues : [Langues](../../guides/languages/)
- Tout ce qu'expose `zeste` : [API](../../reference/api/)
